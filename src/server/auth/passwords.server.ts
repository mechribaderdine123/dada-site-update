import { compare, hash } from "bcryptjs";

// bcrypt with a per-password salt. The cost factor is high enough to make
// offline guessing expensive while staying fast on a small VPS.

const COST = 12;
export const MIN_PASSWORD_LENGTH = 8;

export function assertPasswordStrength(password: unknown): asserts password is string {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
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
