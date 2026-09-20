import type { Actor } from "../policy/rules.server";
import { readSession, readSessionToken, type SessionOwner } from "./sessions.server";

// Resolves the caller of a request from its session cookie.

export type Caller = { actor: Actor; owner: SessionOwner | null };

export async function resolveCaller(request: Request): Promise<Caller> {
  const token = readSessionToken(request);
  if (!token) return { actor: null, owner: null };

  const owner = await readSession(token);
  if (!owner) return { actor: null, owner: null };

  return {
    actor: { id: owner.userId, email: owner.email, isAdmin: owner.isAdmin },
    owner,
  };
}

export class UnauthorizedError extends Error {
  constructor(message = "You must be signed in.") {
    super(message);
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
  }
}

export async function requireActor(request: Request): Promise<Extract<Actor, object>> {
  const { actor } = await resolveCaller(request);
  if (!actor) throw new UnauthorizedError();
  return actor;
}

export async function requireAdmin(request: Request): Promise<Extract<Actor, object>> {
  const actor = await requireActor(request);
  if (!actor.isAdmin) throw new ForbiddenError("Admin access required.");
  return actor;
}
