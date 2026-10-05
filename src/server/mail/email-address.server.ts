import { isIP } from "node:net";
import { resolveMx } from "node:dns/promises";

// Decides whether an address is a real, deliverable mailbox before an account
// is created. Three checks, cheapest first:
//   1. strict syntax — the old regex accepted "a@b.c" and "user@x.y";
//   2. the domain must not be a known throwaway mail provider;
//   3. the domain must publish MX records, so mail to it can actually arrive.

export class EmailAddressError extends Error {}

/** Throwaway providers: an artist account on one of these is worthless. */
const DISPOSABLE_DOMAINS = new Set([
  "0-mail.com",
  "10minutemail.com",
  "20minutemail.com",
  "33mail.com",
  "anonaddy.com",
  "discard.email",
  "discardmail.com",
  "emailondeck.com",
  "fakeinbox.com",
  "getairmail.com",
  "getnada.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "guerrillamail.net",
  "inboxkitten.com",
  "mailcatch.com",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "mintemail.com",
  "moakt.com",
  "mohmal.com",
  "mytemp.email",
  "sharklasers.com",
  "spam4.me",
  "spamgourmet.com",
  "temp-mail.io",
  "temp-mail.org",
  "tempmail.com",
  "tempmailo.com",
  "throwawaymail.com",
  "trashmail.com",
  "yopmail.com",
  "yopmail.fr",
]);

/**
 * Local part, "@", domain, "." and a 2+ letter TLD. Deliberately narrower than
 * RFC 5322: the address still has to pass the MX lookup to be accepted, so
 * there is no reason to admit exotic-but-unusable forms.
 */
const ADDRESS_PATTERN =
  /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

const MAX_ADDRESS_LENGTH = 254;

export function normaliseEmail(input: string): string {
  return input.trim().toLowerCase();
}

/** Syntax and throwaway-domain check. No I/O, so it is safe on every request. */
export function assertEmailLooksDeliverable(email: string): void {
  const value = normaliseEmail(email);
  if (!value || value.length > MAX_ADDRESS_LENGTH) {
    throw new EmailAddressError("Please enter a valid e-mail address.");
  }
  if (!ADDRESS_PATTERN.test(value)) {
    throw new EmailAddressError("Please enter a valid e-mail address.");
  }
  if (DISPOSABLE_DOMAINS.has(value.split("@")[1] ?? "")) {
    throw new EmailAddressError(
      "Please use a permanent e-mail address, not a temporary or disposable one.",
    );
  }
}

const mxCache = new Map<string, { at: number; deliverable: boolean }>();
const MX_CACHE_MS = 6 * 60 * 60 * 1000;

/**
 * Confirms the domain accepts mail. A DNS failure is treated as "cannot prove
 * it works", which blocks the sign-up rather than creating a dead account; the
 * cache keeps the lookup off the critical path of a burst of sign-ups.
 */
export async function domainAcceptsMail(domain: string): Promise<boolean> {
  const key = domain.toLowerCase();
  const cached = mxCache.get(key);
  if (cached && Date.now() - cached.at < MX_CACHE_MS) return cached.deliverable;

  let deliverable = false;
  try {
    const records = await resolveMx(key);
    // An empty MX with a null exchanger is the RFC 5321 "no mail here" marker;
    // a literal A record (an IP) is also accepted.
    deliverable = records.some((record) => isIP(record.exchange) > 0 || record.exchange.length > 0);
  } catch {
    deliverable = false;
  }

  mxCache.set(key, { at: Date.now(), deliverable });
  return deliverable;
}

/** Full check used when an artist signs up. */
export async function assertEmailIsReal(email: string): Promise<string> {
  assertEmailLooksDeliverable(email);
  const value = normaliseEmail(email);
  if (!(await domainAcceptsMail(value.split("@")[1]))) {
    throw new EmailAddressError(
      "This e-mail domain cannot receive mail. Please check the address and try again.",
    );
  }
  return value;
}
