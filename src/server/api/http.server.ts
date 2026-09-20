import { QueryDeniedError } from "../policy/rules.server";
import { QueryInputError } from "../db/tables.server";
import { StorageError } from "../storage/buckets.server";
import { AuthError } from "../auth/accounts.server";
import { ForbiddenError, UnauthorizedError } from "../auth/identity.server";

// Small helpers shared by every API route: JSON responses, body parsing, the
// same-origin check that protects cookie-authenticated writes, and a single
// mapping from thrown errors to HTTP status codes.

export type ApiError = { status: number; message: string };

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
const MAX_JSON_BYTES = 256 * 1024;

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, "cache-control": "no-store", ...headers },
  });
}

export function failure(status: number, message: string): Response {
  return json({ data: null, error: { message } }, status);
}

export function noContent(headers: Record<string, string> = {}): Response {
  return new Response(null, { status: 204, headers });
}

export function methodNotAllowed(allowed: readonly string[]): Response {
  return json(
    { data: null, error: { message: "Method not allowed." } },
    405,
    { allow: allowed.join(", ") },
  );
}

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_JSON_BYTES) {
    throw new QueryInputError("Request body is too large.");
  }

  const text = await request.text();
  if (!text.trim()) return {} as T;
  if (text.length > MAX_JSON_BYTES) throw new QueryInputError("Request body is too large.");

  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new QueryInputError("Request body must be a JSON object.");
    }
    return parsed as T;
  } catch (error) {
    if (error instanceof QueryInputError) throw error;
    throw new QueryInputError("Request body must be valid JSON.");
  }
}

/**
 * Cookie-authenticated writes are only accepted from our own origin. Browsers
 * always send Origin on cross-site POSTs, so this blocks CSRF attempts.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const host = request.headers.get("host");
  if (!host) throw new ForbiddenError("Cross-origin requests are not allowed.");

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    throw new ForbiddenError("Invalid origin header.");
  }

  if (parsed.host !== host) {
    throw new ForbiddenError("Cross-origin requests are not allowed.");
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof QueryDeniedError) return { status: 403, message: error.message };
  if (error instanceof ForbiddenError) return { status: 403, message: error.message };
  if (error instanceof UnauthorizedError) return { status: 401, message: error.message };
  if (error instanceof QueryInputError) return { status: 400, message: error.message };
  if (error instanceof StorageError) return { status: 400, message: error.message };
  if (error instanceof AuthError) {
    const status = /credentials/i.test(error.message) ? 401 : 400;
    return { status, message: error.message };
  }

const code = postgresErrorCode(error);

if (code) {
  console.error("[DB RAW ERROR]", error);
  return mapPostgresCode(code);
}

console.error("[api] unhandled error", error);
return { status: 500, message: "Something went wrong on the server." };
}

function postgresErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const candidate = (error as { code?: unknown }).code;
  return typeof candidate === "string" ? candidate : null;
}

function mapPostgresCode(code: string): ApiError {
  switch (code) {
    case "23505":
      return { status: 409, message: "That value is already taken (duplicate)." };
    case "23503":
      return { status: 400, message: "Related record not found." };
    case "23502":
      return { status: 400, message: "A required value is missing." };
    case "23514":
      return { status: 400, message: "A value is outside the allowed range." };
    case "22P02":
      return { status: 400, message: "Invalid value format." };
    case "22001":
      return { status: 400, message: "A value is too long." };
    case "42501":
      return { status: 403, message: "Not allowed." };
    default:
      return { status: 500, message: "Database error." };
  }
}
