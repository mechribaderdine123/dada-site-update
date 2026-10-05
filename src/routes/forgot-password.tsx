import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard, AuthInput, AuthNotice, BackToSignIn } from "@/components/auth/AuthCard";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — Dada Hip Hop Academy" },
      { name: "description", content: "Réinitialisez le mot de passe de votre compte artiste." },
    ],
  }),
  component: ForgotPasswordPage,
});

const GENERIC_ANSWER =
  "Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé. Vérifiez vos courriers indésirables.";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.forgotPassword(email.trim());
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  };

  return (
    <AuthCard
      title="Mot de passe oublié"
      intro="Indiquez l'adresse e-mail de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe."
      footer={<BackToSignIn />}
    >
      {sent ? (
        <>
          <AuthNotice tone="success">{GENERIC_ANSWER}</AuthNotice>
          <Link
            to="/sign-in"
            className="mt-6 block w-full text-center h-12 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:opacity-90 transition"
          >
            Retour à la connexion
          </Link>
        </>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <AuthInput
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="e-mail@gmail.com"
            autoComplete="email"
          />

          {error && <AuthNotice tone="error">{error}</AuthNotice>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
