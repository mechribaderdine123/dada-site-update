import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard, AuthNotice, BackToSignIn } from "@/components/auth/AuthCard";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Dada Hip Hop Academy" },
      {
        name: "description",
        content: "Choisissez un nouveau mot de passe pour votre compte artiste.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = () => new URLSearchParams(window.location.search).get("token") ?? "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }
    if (password !== password2) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.resetPassword(token(), password);
    setLoading(false);
    if (err) {
      setError(
        err.code === "invalid_token"
          ? "Ce lien n'est plus valable. Demandez-en un nouveau depuis « Mot de passe oublié »."
          : err.message,
      );
      return;
    }
    setDone(true);
  };

  return (
    <AuthCard
      title="Nouveau mot de passe"
      intro="Choisissez un mot de passe d'au moins 8 caractères que vous n'utilisez nulle part ailleurs."
      footer={<BackToSignIn />}
    >
      {done ? (
        <>
          <AuthNotice tone="success">
            Mot de passe mis à jour. Vos autres sessions ont été fermées par sécurité.
          </AuthNotice>
          <Link
            to="/sign-in"
            className="mt-6 block w-full text-center h-12 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:opacity-90 transition"
          >
            Se connecter
          </Link>
        </>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-semibold">Nouveau mot de passe</label>
            <div className="mt-2 relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="***********"
                className="w-full h-12 px-4 pr-11 rounded-lg bg-white text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-secondary"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black"
              >
                {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Confirmer le mot de passe</label>
            <input
              type={show ? "text" : "password"}
              value={password2}
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="***********"
              className="mt-2 w-full h-12 px-4 rounded-lg bg-white text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          {error && <AuthNotice tone="error">{error}</AuthNotice>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Enregistrement..." : "Enregistrer le mot de passe"}
          </button>

          <p className="text-center text-sm text-white/70">
            <Link to="/forgot-password" className="text-secondary font-semibold hover:underline">
              Demander un nouveau lien
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
