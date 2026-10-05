// A small fixed-window limiter for the authentication endpoints.
//
// Sign-in, sign-up and the password-reset forms are the only places where
// guessing is worth an attacker's time, and before this existed they accepted
// unlimited attempts from anywhere. State lives in the app process: the API
// runs as a single container, and if that ever changes the limiter fails
// open rather than locking everyone out.

export type RateLimitRule = {
  /** Identifies the caller, normally "<ip>|<identifier>". */
  key: string;
  /** Attempts allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Too many attempts. Please wait a moment before trying again.");
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

/** Throws RateLimitError once the caller has used up its allowance. */
export function assertWithinRateLimit(rule: RateLimitRule): void {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(rule.key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(rule.key, { count: 1, resetAt: now + rule.windowMs });
    return;
  }

  existing.count += 1;
  if (existing.count > rule.limit) {
    throw new RateLimitError(Math.max(1, Math.ceil((existing.resetAt - now) / 1000)));
  }
}

/** Forgets a caller after a successful action, so honest users are not punished. */
export function clearRateLimit(key: string): void {
  buckets.delete(key);
}

/** Best-effort client address, used only as a rate-limit key. */
export function clientKey(request: Request, identifier: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${ip}|${identifier.toLowerCase()}`;
}

/** Drops expired buckets so the map cannot grow without bound. */
function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
