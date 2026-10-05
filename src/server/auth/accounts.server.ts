import { query, queryOne, withTransaction } from "../db/pool.server";
import { sendMail, isMailConfigured, MailError } from "../mail/mail.server";
import { assertEmailIsReal } from "../mail/email-address.server";
import { passwordResetEmail, verificationEmail } from "../mail/templates.server";
import { removeAssetPaths } from "../storage/files.server";
import {
  hashPassword,
  verifyPassword,
  assertPasswordStrength,
  assertPasswordNotTrivial,
} from "./passwords.server";
import { createSession, destroyUserSessions } from "./sessions.server";
import { consumeToken, issueToken, pruneTokens } from "./tokens.server";

// Account lifecycle: creating artist accounts, signing in, and (for admins)
// deleting an account together with everything it uploaded.

export type AccountUser = { id: string; email: string };

export type ProfileSeed = {
  artist_name?: string | null;
  genre?: string | null;
  city?: string | null;
  bio?: string | null;
  phone?: string | null;
  youtube?: string | null;
  spotify?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
};

export class AuthError extends Error {
  /** Machine-readable reason the UI can branch on, e.g. "email_unverified". */
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

const RESERVED_SLUGS = new Set(["edit", "music", "my-music", "artist"]);

export function slugify(value: string): string {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = base || "artist";
  return RESERVED_SLUGS.has(slug) ? `${slug}-page` : slug;
}

export async function findAccountByEmail(email: string): Promise<{ id: string } | null> {
  return queryOne<{ id: string }>("select id from users where lower(email) = lower($1)", [email]);
}

export async function signUpArtist(input: {
  email: string;
  password: string;
  profile?: ProfileSeed;
}): Promise<{ user: AccountUser; mailSent: boolean }> {
  // An account that can never be confirmed is worse than a refused sign-up, so
  // the server refuses to create one while no mail transport is configured.
  if (!isMailConfigured()) {
    throw new AuthError(
      "Sign-up is temporarily unavailable. Please contact the administration.",
      "mail_not_configured",
    );
  }

  // A real, deliverable mailbox is required before the account exists.
  const email = await assertEmailIsReal(input.email);
  assertPasswordStrength(input.password);
  assertPasswordNotTrivial(input.password, email);

  if (await findAccountByEmail(email)) {
    throw new AuthError("An account already exists for this e-mail address.", "email_taken");
  }

  const passwordHash = await hashPassword(input.password);
  const seed = input.profile ?? {};

  const user = await withTransaction(async (client) => {
    const created = await client.query<{ id: string }>(
      "insert into users (email, password_hash) values ($1, $2) returning id",
      [email, passwordHash],
    );
    const userId = created.rows[0].id;

    const baseSlug = slugify(seed.artist_name || email.split("@")[0]);
    let slug = baseSlug;
    for (let attempt = 2; attempt < 50; attempt += 1) {
      const taken = await client.query("select 1 from profiles where lower(slug) = lower($1)", [
        slug,
      ]);
      if (taken.rowCount === 0) break;
      slug = `${baseSlug}-${attempt}`;
    }

    await client.query(
      `insert into profiles
         (id, email, artist_name, slug, genre, city, bio, phone,
          youtube, spotify, facebook, instagram, tiktok, twitter, status)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending')`,
      [
        userId,
        email,
        (seed.artist_name || email.split("@")[0]).trim(),
        slug,
        seed.genre ?? null,
        seed.city ?? null,
        seed.bio ?? null,
        seed.phone ?? null,
        seed.youtube ?? null,
        seed.spotify ?? null,
        seed.facebook ?? null,
        seed.instagram ?? null,
        seed.tiktok ?? null,
        seed.twitter ?? null,
      ],
    );

    await client.query("insert into user_roles (user_id, role) values ($1, 'artist')", [userId]);
    return { id: userId, email };
  });

  const mailSent = await sendVerificationEmail(user.id, email);
  return { user, mailSent };
}

/**
 * Mails a fresh confirmation link. Returns whether the mail went out; a mail
 * outage is reported to the caller instead of throwing, so a half-registered
 * artist can always ask for another link.
 */
async function sendVerificationEmail(userId: string, email: string): Promise<boolean> {
  try {
    await pruneTokens();
    const { token } = await issueToken(userId, "verify_email");
    await sendMail({ to: email, ...verificationEmail(token) });
    return true;
  } catch (error) {
    if (error instanceof MailError) {
      console.error(`[auth] confirmation e-mail not sent to ${email}`);
      return false;
    }
    throw error;
  }
}

export type ResendResult = { mailSent: boolean };

/** Sends another confirmation link, whatever the previous outcome was. */
export async function resendVerificationEmail(email: string): Promise<ResendResult> {
  const account = await queryOne<{ id: string; email: string; email_verified_at: Date | null }>(
    "select id, email, email_verified_at from users where lower(email) = lower($1)",
    [email.trim()],
  );

  // Always report success: whether the address exists is not public
  // information, and the honest answer would let anyone test addresses.
  if (!account || account.email_verified_at) return { mailSent: true };
  return { mailSent: await sendVerificationEmail(account.id, account.email) };
}

/** Marks the address confirmed and opens a session for the freshly verified artist. */
export async function verifyEmailToken(token: string): Promise<{ token: string; expiresAt: Date }> {
  const { userId } = await consumeToken(token, "verify_email");
  await query(
    "update users set email_verified_at = now() where id = $1 and email_verified_at is null",
    [userId],
  );
  return createSession(userId);
}

/**
 * Starts the reset flow. The answer never depends on whether the account
 * exists, and a rate limit plus a one-token-per-account rule keep it from being
 * used to mail-bomb an address.
 */
export async function requestPasswordReset(email: string): Promise<{ mailSent: boolean }> {
  const account = await queryOne<{ id: string; email: string; email_verified_at: Date | null }>(
    "select id, email, email_verified_at from users where lower(email) = lower($1)",
    [email.trim()],
  );

  if (!account || !account.email_verified_at) return { mailSent: true };

  try {
    await pruneTokens();
    const { token } = await issueToken(account.id, "password_reset");
    await sendMail({ to: account.email, ...passwordResetEmail(token) });
    return { mailSent: true };
  } catch (error) {
    if (error instanceof MailError) {
      console.error(`[auth] reset e-mail not sent to ${account.email}`);
      return { mailSent: false };
    }
    throw error;
  }
}

/** Consumes a reset token, stores the new password and drops every session. */
export async function resetPassword(token: string, password: string): Promise<void> {
  const { userId } = await consumeToken(token, "password_reset");
  const account = await queryOne<{ email: string }>("select email from users where id = $1", [
    userId,
  ]);
  if (!account) throw new AuthError("This account no longer exists.", "no_account");

  assertPasswordStrength(password);
  assertPasswordNotTrivial(password, account.email);

  await query("update users set password_hash = $2 where id = $1", [
    userId,
    await hashPassword(password),
  ]);
  // A stolen session must not survive a password change.
  await destroyUserSessions(userId);
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ user: AccountUser; token: string; expiresAt: Date }> {
  const account = await queryOne<{
    id: string;
    email: string;
    password_hash: string;
    email_verified_at: Date | null;
  }>(
    "select id, email, password_hash, email_verified_at from users where lower(email) = lower($1)",
    [email.trim()],
  );

  // Always run a verification step so a missing account and a wrong password
  // take a comparable amount of time.
  const hash =
    account?.password_hash ??
    "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
  const valid = await verifyPassword(password, hash);
  if (!account || !valid) throw new AuthError("Invalid login credentials", "invalid_credentials");

  // The password is right, but the address has never been confirmed: this is
  // the one case where it is safe to say so, because the caller already knows
  // the password.
  if (!account.email_verified_at) {
    throw new AuthError(
      "Confirm your e-mail address before signing in. Check your inbox for the link we sent you.",
      "email_unverified",
    );
  }

  const session = await createSession(account.id);
  return { user: { id: account.id, email: account.email }, ...session };
}

export async function deleteAccount(userId: string): Promise<void> {
  const assets = await query<{ path: string }>(
    `select avatar_url as path from profiles where id = $1 and avatar_url is not null
     union all
     select cover_url from profiles where id = $1 and cover_url is not null
     union all
     select audio_url from tracks where user_id = $1 and audio_url is not null
     union all
     select cover_url from tracks where user_id = $1 and cover_url is not null`,
    [userId],
  );

  const removed = await query("delete from users where id = $1 returning id", [userId]);
  if (removed.length === 0) throw new AuthError("This account no longer exists.");

  await removeAssetPaths(assets.map((row) => row.path));
}
