import { createHash, randomBytes } from "node:crypto";

import { query, queryOne } from "../db/pool.server";

// Single-use tokens for e-mail confirmation and password reset.
//
// The raw token only ever exists in the URL that is mailed out; the database
// keeps its SHA-256 hash, so reading the table does not hand over an account.
// Tokens are consumed with a conditional update, which makes a double submit
// fail the second time.

export type TokenPurpose = "verify_email" | "password_reset";

const TOKEN_BYTES = 32;

const LIFETIMES: Record<TokenPurpose, number> = {
  verify_email: 24 * 60 * 60 * 1000,
  password_reset: 30 * 60 * 1000,
};

export class TokenError extends Error {}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Issues a fresh token, invalidating any earlier unused one of the same purpose
 * so a mail that leaked an old link cannot be used after a resend.
 */
export async function issueToken(
  userId: string,
  purpose: TokenPurpose,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + LIFETIMES[purpose]);

  await query("delete from auth_tokens where user_id = $1 and purpose = $2 and used_at is null", [
    userId,
    purpose,
  ]);
  await query(
    "insert into auth_tokens (user_id, purpose, token_hash, expires_at) values ($1, $2, $3, $4)",
    [userId, purpose, hashToken(token), expiresAt],
  );

  return { token, expiresAt };
}

/**
 * Consumes a token and returns the account it belongs to. Throws when the
 * token is unknown, already used, or expired — the caller turns every one of
 * those into the same generic message so nothing is leaked.
 */
export async function consumeToken(
  rawToken: string,
  purpose: TokenPurpose,
): Promise<{ userId: string }> {
  if (!rawToken || rawToken.length > 200) throw new TokenError("Invalid or expired link.");

  // A single conditional update claims the token: a second submit, a replay of
  // an old mail or an expired link all match zero rows.
  const row = await queryOne<{ user_id: string }>(
    `update auth_tokens
        set used_at = now()
      where token_hash = $1
        and purpose = $2
        and used_at is null
        and expires_at > now()
      returning user_id`,
    [hashToken(rawToken), purpose],
  );

  if (!row) throw new TokenError("Invalid or expired link.");
  return { userId: row.user_id };
}

/** Removes expired and consumed tokens; called opportunistically on issue. */
export async function pruneTokens(): Promise<void> {
  await query(
    "delete from auth_tokens where expires_at <= now() or used_at < now() - interval '7 days'",
  );
}
