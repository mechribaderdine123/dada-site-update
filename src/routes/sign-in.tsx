import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import bg from "@/assets/dada-auth.jpg";
import logo from "@/assets/dada-logo.png";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Se connecter — Dada Hip Hop Academy" },
      {
        name: "description",
        content: "Connectez-vous à votre espace artiste Dada Hip Hop Academy.",
      },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);

  const resendConfirmation = async () => {
    setResent(false);
    await supabase.auth.resendVerification(email.trim());
    setResent(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverified(false);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) {
      if (err.code === "invalid_credentials") {
        setError("E-mail ou mot de passe incorrect.");
        return;
      }
      if (err.code === "email_unverified") {
        setUnverified(true);
        setError(null);
        return;
      }
      setError(err.message);
      return;
    }
    navigate({ to: "/artist" });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 text-white">
      <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative w-full max-w-lg rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-2xl p-8 md:p-10">
        <div className="flex justify-center">
          <img src={logo} alt="Dada Hip Hop Academy" className="h-20 w-auto" fetchPriority="high" />
        </div>
        <h1 className="mt-4 text-center font-display text-3xl md:text-4xl tracking-wide">
          Bienvenue de retour
        </h1>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-semibold">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e-mail@gmail.com"
              className="mt-2 w-full h-12 px-4 rounded-lg bg-white text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-semibold">Mot de Passe</label>
              <Link to="/forgot-password" className="text-xs text-secondary hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="mt-2 relative">
              <input
                type={showPwd ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="***********"
                className="w-full h-12 px-4 pr-11 rounded-lg bg-white text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-secondary"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black"
              >
                {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-200 bg-red-900/40 border border-red-400/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {unverified && (
            <div className="text-sm bg-white/10 border border-white/20 rounded-lg px-3 py-3 space-y-2">
              <p className="text-white">
                Votre mot de passe est correct, mais cette adresse e-mail n&apos;a pas encore été
                confirmée.
              </p>
              {resent ? (
                <p className="text-white/70 text-xs">
                  Si un e-mail vous a été envoyé, il arrive. Pensez à vérifier les courriers
                  indésirables.
                </p>
              ) : null}
              <button
                type="button"
                onClick={resendConfirmation}
                className="text-secondary font-semibold hover:underline"
              >
                Renvoyer le lien de confirmation
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg bg-secondary text-secondary-foreground font-semibold text-base hover:opacity-90 transition disabled:opacity-60 mt-4"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-white/80">
          Vous n'avez pas de compte ?{" "}
          <Link to="/sign-up" className="text-secondary font-semibold hover:underline">
            Créer un compte
          </Link>
        </p>
        <div className="mt-3 text-center">
          <Link to="/" className="text-sm text-secondary hover:underline">
            Retour
          </Link>
        </div>
      </div>
    </div>
  );
}
