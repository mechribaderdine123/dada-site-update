import { createTransport, type Transporter } from "nodemailer";

import { getEnv } from "../env.server";

// Outgoing mail for e-mail confirmation and password reset.
//
// Two transports are supported and the first configured one wins:
//   * Resend  — RESEND_API_KEY (+ optional RESEND_FROM)
//   * SMTP    — SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM
//
// Sending is deliberately best-effort: a mail outage must never leave an
// artist locked out of the sign-up form with an unexplained error, so the
// caller decides what to tell them.

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export class MailError extends Error {}

let cached: Transporter | null | undefined;
let cachedKey = "";

/** True when at least one transport is configured. */
export function isMailConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.resendApiKey || env.smtpHost);
}

/** "from" address, preferring the explicit override then the transport default. */
function fromAddress(): string {
  const env = getEnv();
  if (env.mailFrom) return env.mailFrom;
  if (env.smtpHost) return `Dada Hip Hop Academy <no-reply@${env.smtpHost}>`;
  return "Dada Hip Hop Academy <no-reply@dadahiphop.com>";
}

async function sendViaResend(message: MailMessage): Promise<void> {
  const apiKey = getEnv().resendApiKey;
  if (!apiKey) throw new MailError("RESEND_API_KEY is not set.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new MailError(`Resend returned ${response.status}: ${detail.slice(0, 300)}`);
  }
}

async function sendViaSmtp(message: MailMessage): Promise<void> {
  const env = getEnv();
  const host = env.smtpHost;
  if (!host) throw new MailError("SMTP_HOST is not set.");

  const key = `${host}|${env.smtpPort}|${env.smtpUser}|${env.smtpSecure}`;
  if (!cached || cachedKey !== key) {
    cached = createTransport({
      host,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass ?? "" } : undefined,
    });
    cachedKey = key;
  }

  const transport: Transporter = cached;
  await transport.sendMail({
    from: fromAddress(),
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}

export async function sendMail(message: MailMessage): Promise<void> {
  const env = getEnv();

  try {
    if (env.resendApiKey) {
      await sendViaResend(message);
      return;
    }
    if (env.smtpHost) {
      await sendViaSmtp(message);
      return;
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[mail] delivery failed:", detail);
    throw new MailError("The e-mail could not be sent. Please try again in a moment.");
  }

  throw new MailError(
    "No mail transport is configured. Set RESEND_API_KEY or SMTP_HOST on the server.",
  );
}
