import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { query } from "../db/pool.server";
import { getEnv } from "../env.server";

// Sessions are opaque random tokens. Only the SHA-256 hash is stored, so a
// database leak does not hand over live sessions.

export const SESSION_COOKIE = "dadahiphop_session";

const TOKEN_BYTES = 32;

export type SessionOwner = { userId: string; email: string; isAdmin: boolean };

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const env = getEnv();
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + env.sessionDays * 24 * 60 * 60 * 1000);

  await query("delete from sessions where expires_at <= now()");
  await query("insert into sessions (token_hash, user_id, expires_at) values ($1, $2, $3)", [
    hashToken(token),
    userId,
    expiresAt,
  ]);

  return { token, expiresAt };
}

export async function destroySession(token: string): Promise<void> {
  await query("delete from sessions where token_hash = $1", [hashToken(token)]);
}

export async function destroyUserSessions(userId: string): Promise<void> {
  await query("delete from sessions where user_id = $1", [userId]);
}

export async function readSession(token: string): Promise<SessionOwner | null> {
  const rows = await query<{ user_id: string; email: string; is_admin: boolean }>(
    `select u.id as user_id,
            u.email,
            exists (
              select 1 from user_roles r where r.user_id = u.id and r.role = 'admin'
            ) as is_admin
       from sessions s
       join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)],
  );

  const row = rows[0];
  if (!row) return null;
  return { userId: row.user_id, email: row.email, isAdmin: row.is_admin };
}

export function readSessionToken(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const name = part.slice(0, index).trim();
    if (name !== SESSION_COOKIE) continue;
    const value = part.slice(index + 1).trim();
    return value ? decodeURIComponent(value) : null;
  }
  return null;
}

export function buildSessionCookie(token: string, expiresAt: Date): string {
  const env = getEnv();
  const attributes = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${expiresAt.toUTCString()}`,
    `Max-Age=${Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))}`,
  ];
  if (env.isProduction) attributes.push("Secure");
  return attributes.join("; ");
}

export function buildClearedCookie(): string {
  const env = getEnv();
  const attributes = [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (env.isProduction) attributes.push("Secure");
  return attributes.join("; ");
}

/** Constant-time comparison helper for token checks in tests and diagnostics. */
export function sameToken(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
