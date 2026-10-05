import path from "node:path";
import process from "node:process";

// Server-only configuration. The `.server.ts` suffix keeps this module out of
// the client bundle, so nothing here (database URL, session secret) ever
// reaches the browser.

export type ServerEnv = {
  nodeEnv: string;
  isProduction: boolean;
  databaseUrl: string;
  sessionSecret: string;
  sessionDays: number;
  uploadDir: string;
  maxAudioBytes: number;
  maxImageBytes: number;
  dbPoolMax: number;
  adminEmail: string | null;
  adminPassword: string | null;
  /** Public origin used to build links inside outgoing e-mails. */
  siteUrl: string;
  resendApiKey: string | null;
  smtpHost: string | null;
  smtpPort: number;
  smtpUser: string | null;
  smtpPass: string | null;
  smtpSecure: boolean;
  mailFrom: string | null;
};

const MEGABYTE = 1024 * 1024;
const DEV_DATABASE_URL = "postgres://postgres:postgres@localhost:5432/dadahiphop";
const DEV_SESSION_SECRET = "development-only-insecure-session-secret";

function numberOf(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

let cached: ServerEnv | undefined;

export function getEnv(): ServerEnv {
  if (cached) return cached;

  const nodeEnv = process.env.NODE_ENV ?? "development";
  const isProduction = nodeEnv === "production";
  const sessionSecret = process.env.SESSION_SECRET?.trim();

  if (isProduction && (!sessionSecret || sessionSecret.length < 32)) {
    throw new Error(
      "SESSION_SECRET must be at least 32 characters in production. Generate one with: openssl rand -hex 32",
    );
  }

  cached = {
    nodeEnv,
    isProduction,
    databaseUrl: process.env.DATABASE_URL?.trim() || DEV_DATABASE_URL,
    sessionSecret: sessionSecret || DEV_SESSION_SECRET,
    sessionDays: numberOf(process.env.SESSION_DAYS, 30),
    uploadDir: path.resolve(process.env.UPLOAD_DIR?.trim() || "./uploads"),
    maxAudioBytes: numberOf(process.env.MAX_AUDIO_BYTES, 75 * MEGABYTE),
    maxImageBytes: numberOf(process.env.MAX_IMAGE_BYTES, 8 * MEGABYTE),
    dbPoolMax: numberOf(process.env.DB_POOL_MAX, 10),
    adminEmail: process.env.ADMIN_EMAIL?.trim() || null,
    adminPassword: process.env.ADMIN_PASSWORD?.trim() || null,
    siteUrl: (process.env.SITE_URL?.trim() || "http://localhost:3000").replace(/\/+$/, ""),
    resendApiKey: process.env.RESEND_API_KEY?.trim() || null,
    smtpHost: process.env.SMTP_HOST?.trim() || null,
    smtpPort: numberOf(process.env.SMTP_PORT, 587),
    smtpUser: process.env.SMTP_USER?.trim() || null,
    smtpPass: process.env.SMTP_PASS?.trim() || null,
    smtpSecure: process.env.SMTP_SECURE === "true" || numberOf(process.env.SMTP_PORT, 587) === 465,
    mailFrom: process.env.MAIL_FROM?.trim() || null,
  };

  return cached;
}
