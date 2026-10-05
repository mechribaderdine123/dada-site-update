import {
  AuthError,
  deleteAccount,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  signInWithPassword,
  signUpArtist,
  verifyEmailToken,
} from "../../auth/accounts.server";
import { requireAdmin, resolveCaller } from "../../auth/identity.server";
import {
  buildClearedCookie,
  buildSessionCookie,
  destroySession,
  readSessionToken,
} from "../../auth/sessions.server";
import { TokenError } from "../../auth/tokens.server";
import { assertSameOrigin, failure, json, methodNotAllowed, readJson } from "../http.server";
import {
  assertWithinRateLimit,
  clientKey,
  clearRateLimit,
  RateLimitError,
} from "../rate-limit.server";

// /api/auth/* — sign up, sign in, sign out, current session, e-mail
// confirmation, password reset and account deletion.
//
// Every guessing-sensitive endpoint is rate limited. The sign-in limit is keyed
// on the address as well as the caller, so one attacker cannot lock a known
// artist out of their own account by hammering it from many addresses.

export async function handleAuthRoute(
  request: Request,
  segments: string[],
): Promise<Response | null> {
  if (segments[0] !== "auth") return null;

  switch (segments[1] ?? "") {
    case "sign-up":
      return signUp(request);
    case "sign-in":
      return signIn(request);
    case "sign-out":
      return signOut(request);
    case "session":
      return session(request);
    case "verify-email":
      return verifyEmail(request);
    case "resend-verification":
      return resendVerification(request);
    case "forgot-password":
      return forgotPassword(request);
    case "reset-password":
      return resetPasswordRoute(request);
    case "delete-account":
      return removeAccount(request);
    default:
      return failure(404, "Unknown auth endpoint.");
  }
}

const SIGN_UP_RULE = { limit: 5, windowMs: 60 * 60 * 1000 };
const SIGN_IN_RULE = { limit: 8, windowMs: 15 * 60 * 1000 };
const MAIL_RULE = { limit: 3, windowMs: 15 * 60 * 1000 };

function limitFailure(error: unknown): Response | null {
  if (!(error instanceof RateLimitError)) return null;
  return failure(429, error.message, "rate_limited");
}

async function signUp(request: Request): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  assertSameOrigin(request);

  const body = await readJson(request);
  const email = String(body.email ?? "");
  const password = String(body.password ?? "");
  const profile = (body.profile ?? {}) as Record<string, string | null>;

  try {
    assertWithinRateLimit({ ...SIGN_UP_RULE, key: clientKey(request, email) });
  } catch (error) {
    return limitFailure(error) ?? failure(400, "Request rejected.");
  }

  // The account exists immediately but stays locked until the address is
  // confirmed, so no session is issued here.
  const { user, mailSent } = await signUpArtist({ email, password, profile });

  return json(
    {
      data: {
        user,
        confirmationRequired: true,
        mailSent,
      },
      error: null,
    },
    200,
  );
}

async function signIn(request: Request): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  assertSameOrigin(request);

  const body = await readJson(request);
  const email = String(body.email ?? "");
  const password = String(body.password ?? "");
  const limitKey = clientKey(request, email);

  try {
    assertWithinRateLimit({ ...SIGN_IN_RULE, key: limitKey });
  } catch (error) {
    return limitFailure(error) ?? failure(400, "Request rejected.");
  }

  try {
    const result = await signInWithPassword(email, password);
    clearRateLimit(limitKey);

    return json({ data: { user: result.user, session: { user: result.user } }, error: null }, 200, {
      "set-cookie": buildSessionCookie(result.token, result.expiresAt),
    });
  } catch (error) {
    if (error instanceof AuthError && error.code) {
      return failure(error.code === "invalid_credentials" ? 401 : 403, error.message, error.code);
    }
    throw error;
  }
}

async function signOut(request: Request): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  assertSameOrigin(request);

  const token = readSessionToken(request);
  if (token) await destroySession(token);

  return json({ data: null, error: null }, 200, { "set-cookie": buildClearedCookie() });
}

async function session(request: Request): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  const { actor } = await resolveCaller(request);
  if (!actor) return json({ data: { session: null, user: null }, error: null });

  const user = { id: actor.id, email: actor.email };
  return json({ data: { session: { user }, user }, error: null });
}

async function verifyEmail(request: Request): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  assertSameOrigin(request);

  const body = await readJson(request);
  const token = String(body.token ?? "");
  if (!token) return failure(400, "Missing token.", "invalid_token");

  try {
    const { token: sessionToken, expiresAt } = await verifyEmailToken(token);
    return json({ data: { verified: true }, error: null }, 200, {
      "set-cookie": buildSessionCookie(sessionToken, expiresAt),
    });
  } catch (error) {
    if (error instanceof TokenError) return failure(400, error.message, "invalid_token");
    throw error;
  }
}

async function resendVerification(request: Request): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  assertSameOrigin(request);

  const body = await readJson(request);
  const email = String(body.email ?? "");
  if (!email) return failure(400, "E-mail address required.");

  try {
    assertWithinRateLimit({ ...MAIL_RULE, key: clientKey(request, `resend:${email}`) });
  } catch (error) {
    return limitFailure(error) ?? failure(400, "Request rejected.");
  }

  const { mailSent } = await resendVerificationEmail(email);
  return json({ data: { sent: true, mailSent }, error: null });
}

/**
 * Always answers the same way, whether or not the address is registered, so
 * the form cannot be used to discover who has an account here.
 */
async function forgotPassword(request: Request): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  assertSameOrigin(request);

  const body = await readJson(request);
  const email = String(body.email ?? "");
  if (!email) return failure(400, "E-mail address required.");

  try {
    assertWithinRateLimit({ ...MAIL_RULE, key: clientKey(request, `forgot:${email}`) });
  } catch (error) {
    return limitFailure(error) ?? failure(400, "Request rejected.");
  }

  await requestPasswordReset(email);
  return json({
    data: {
      sent: true,
      message: "If an account exists for this address, a reset link is on its way.",
    },
    error: null,
  });
}

async function resetPasswordRoute(request: Request): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  assertSameOrigin(request);

  const body = await readJson(request);
  const token = String(body.token ?? "");
  const password = String(body.password ?? "");
  if (!token) return failure(400, "Missing token.", "invalid_token");

  try {
    assertWithinRateLimit({
      ...SIGN_IN_RULE,
      key: clientKey(request, `reset:${token.slice(0, 16)}`),
    });
    await resetPassword(token, password);
  } catch (error) {
    if (error instanceof TokenError) return failure(400, error.message, "invalid_token");
    const limited = limitFailure(error);
    if (limited) return limited;
    throw error;
  }

  return json({ data: { reset: true }, error: null });
}

async function removeAccount(request: Request): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  assertSameOrigin(request);
  await requireAdmin(request);

  const body = await readJson(request);
  const userId = String(body.userId ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return failure(400, "A valid user id is required.");
  }

  await deleteAccount(userId);
  return json({ data: null, error: null });
}
