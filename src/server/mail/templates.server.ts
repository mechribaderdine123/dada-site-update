import { getEnv } from "../env.server";

// The two transactional e-mails an artist can receive. Both are in French to
// match the site, and both are plain enough to read in a text-only client.

const BRAND = "#00e5bf";
const INK = "#111111";

function layout(
  heading: string,
  body: string,
  action: { label: string; url: string },
  footer: string,
) {
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:Helvetica,Arial,sans-serif;color:${INK}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:14px;padding:32px" cellpadding="0" cellspacing="0">
          <tr><td>
            <p style="margin:0 0 4px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${BRAND}">Dada Hip Hop Academy</p>
            <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">${heading}</h1>
            ${body}
            <p style="margin:28px 0 0">
              <a href="${action.url}" style="display:inline-block;background:${BRAND};color:${INK};text-decoration:none;font-weight:bold;padding:14px 26px;border-radius:8px">${action.label}</a>
            </p>
            <p style="margin:24px 0 0;font-size:13px;color:#52525b;line-height:1.6">${footer}</p>
            <p style="margin:16px 0 0;font-size:12px;color:#71717a;word-break:break-all">${action.url}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function verificationEmail(token: string): { subject: string; text: string; html: string } {
  const url = `${getEnv().siteUrl}/verify-email?token=${encodeURIComponent(token)}`;
  return {
    subject: "Confirmez votre adresse e-mail — Dada Hip Hop Academy",
    text: [
      "Bienvenue chez Dada Hip Hop Academy.",
      "",
      "Confirmez votre adresse e-mail en ouvrant ce lien :",
      url,
      "",
      "Ce lien est valable 24 heures. Si vous n'avez pas créé de compte, ignorez ce message.",
    ].join("\n"),
    html: layout(
      "Confirmez votre adresse e-mail",
      '<p style="margin:0 0 8px;line-height:1.6">Bonjour,</p>' +
        '<p style="margin:0 0 8px;line-height:1.6">Confirmez votre adresse pour activer votre compte artiste et accéder à votre studio.</p>',
      { label: "Confirmer mon e-mail", url },
      "Ce lien est valable 24 heures. Si vous n'avez pas créé de compte, ignorez ce message.",
    ),
  };
}

export function passwordResetEmail(token: string): { subject: string; text: string; html: string } {
  const url = `${getEnv().siteUrl}/reset-password?token=${encodeURIComponent(token)}`;
  return {
    subject: "Réinitialisez votre mot de passe — Dada Hip Hop Academy",
    text: [
      "Une réinitialisation de mot de passe a été demandée pour votre compte Dada.",
      "",
      "Choisissez un nouveau mot de passe en ouvrant ce lien :",
      url,
      "",
      "Le lien est valable 30 minutes et ne fonctionne qu'une seule fois.",
      "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe actuel reste valable.",
    ].join("\n"),
    html: layout(
      "Réinitialisez votre mot de passe",
      '<p style="margin:0 0 8px;line-height:1.6">Une réinitialisation a été demandée pour votre compte.</p>' +
        '<p style="margin:0 0 8px;line-height:1.6">Choisissez un nouveau mot de passe. Toutes vos sessions ouvertes seront fermées.</p>',
      { label: "Choisir un nouveau mot de passe", url },
      "Ce lien est valable 30 minutes et ne fonctionne qu'une seule fois. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe actuel reste valable.",
    ),
  };
}
