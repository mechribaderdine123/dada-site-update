import { deleteAccount, signInWithPassword, signUpArtist } from "../../auth/accounts.server";
import { requireAdmin, resolveCaller } from "../../auth/identity.server";
import {
  buildClearedCookie,
  buildSessionCookie,
  destroySession,
  readSessionToken,
} from "../../auth/sessions.server";
import { assertSameOrigin, failure, json, methodNotAllowed, readJson } from "../http.server";

// /api/auth/* — sign up, sign in, sign out, current session, account deletion.

export async function handleAuthRoute(request: Request, segments: string[]): Promise<Response | null> {
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
    case "delete-account":
      return removeAccount(request);
    default:
      return failure(404, "Unknown auth endpoint.");
  }
}

async function signUp(request: Request): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  assertSameOrigin(request);

  const body = await readJson(request);
  const email = String(body.email ?? "");
  const password = String(body.password ?? "");
  const profile = (body.profile ?? {}) as Record<string, string | null>;

  const created = await signUpArtist({ email, password, profile });
  // Signing up also signs the artist in, so the studio opens right away.
  const { token, expiresAt } = await signInWithPassword(email, password);

  return json(
    { data: { user: created.user, session: { user: created.user } }, error: null },
    200,
    { "set-cookie": buildSessionCookie(token, expiresAt) },
  );
}

async function signIn(request: Request): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  assertSameOrigin(request);

  const body = await readJson(request);
  const result = await signInWithPassword(String(body.email ?? ""), String(body.password ?? ""));

  return json(
    { data: { user: result.user, session: { user: result.user } }, error: null },
    200,
    { "set-cookie": buildSessionCookie(result.token, result.expiresAt) },
  );
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
