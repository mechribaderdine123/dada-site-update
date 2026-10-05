// Mirrors MIN_PASSWORD_LENGTH in src/server/auth/passwords.server.ts. It is
// duplicated rather than imported because that module pulls in bcrypt and must
// stay server-only; the server always re-checks the real value.

export const MIN_PASSWORD_LENGTH = 8;
