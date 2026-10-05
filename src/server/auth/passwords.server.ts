import { compare, hash } from "bcryptjs";

// bcrypt with a per-password salt. The cost factor is high enough to make
// offline guessing expensive while staying fast on a small VPS.

const COST = 12;
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Passwords that pass a length check but are the first thing any wordlist
 * tries. Kept deliberately short: this is a speed bump for the lazy case, not
 * a replacement for the rate limiter on the auth endpoints.
 */
const WEAK_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "passw0rd",
  "motdepasse",
  "motdepasse1",
  "azerty123",
  "qwerty123",
  "12345678",
  "123456789",
  "1234567890",
  "11111111",
  "iloveyou",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "welcome",
  "admin123",
  "artist123",
  "dada1234",
  "dadahiphop",
  "letmein",
  "abc12345",
]);

export function assertPasswordStrength(password: unknown): asserts password is string {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
}

/**
 * Rejects the obvious choices once the e-mail address is known: the address
 * itself, its local part, or the site name, which are the passwords people
 * reach for first when they cannot be bothered.
 */
export function assertPasswordNotTrivial(password: string, email?: string): void {
  const value = password.toLowerCase();

  if (WEAK_PASSWORDS.has(value)) {
    throw new Error("This password is too easy to guess. Please choose another one.");
  }

  const localPart = email?.split("@")[0]?.toLowerCase() ?? "";
  if (localPart.length >= 4) {
    const stem = localPart.replace(/[^a-z0-9]/g, "");
    if (stem.length >= 4 && (value === stem || value.includes(stem))) {
      throw new Error("Your password must not be based on your e-mail address.");
    }
  }
  if (value.includes("dadahiphop")) {
    throw new Error("Your password must not be based on the site name.");
  }
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, COST);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  if (!passwordHash) return false;
  try {
    return await compare(password, passwordHash);
  } catch {
    return false;
  }
}
