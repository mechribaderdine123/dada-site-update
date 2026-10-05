import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard, AuthNotice, BackToSignIn } from "@/components/auth/AuthCard";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Confirmation de l'e-mail — Dada Hip Hop Academy" },
      { name: "description", content: "Confirmez votre adresse e-mail pour activer votre compte." },
    ],
  }),
  component: VerifyEmailPage,
});

type State = "working" | "done" | "failed";

function VerifyEmailPage() {
  const [state, setState] = useState<State>("working");
  const [message, setMessage] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // React runs effects twice in development; the token is single-use, so the
    // claim must happen exactly once.
    if (started.current) return;
    started.current = true;

    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    if (!token) {
      setState("failed");
      setMessage("Ce lien est incomplet. Demandez un nouveau lien de confirmation.");
      return;
    }

    void supabase.auth.verifyEmail(token).then(({ error }) => {
      if (error) {
        setState("failed");
        setMessage(
          error.code === "invalid_token"
            ? "Ce lien n'est plus valable. Demandez-en un nouveau depuis la page de connexion."
            : error.message,
        );
        return;
      }
      setState("done");
    });
  }, []);

  return (
    <AuthCard
      title="Confirmation de l'e-mail"
      intro={
        state === "working"
          ? "Vérification en cours..."
          : "Votre adresse e-mail fait foi : elle sert aussi à réinitialiser votre mot de passe."
      }
      footer={<BackToSignIn />}
    >
      {state === "done" && (
        <>
          <AuthNotice tone="success">Adresse confirmée. Votre compte artiste est actif.</AuthNotice>
          <Link
            to="/artist"
            className="mt-6 block w-full text-center h-12 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:opacity-90 transition"
          >
            Ouvrir mon studio
          </Link>
        </>
      )}

      {state === "failed" && (
        <>
          <AuthNotice tone="error">{message}</AuthNotice>
          <Link
            to="/sign-in"
            className="mt-6 block w-full text-center h-12 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:opacity-90 transition"
          >
            Renvoyer le lien
          </Link>
        </>
      )}
    </AuthCard>
  );
}
