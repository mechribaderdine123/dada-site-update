import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import bgAsset from "@/assets/auth-bg.png.asset.json";
const bg = bgAsset.url;
import logo from "@/assets/dada-logo.png.asset.json";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Se connecter — Dada Hip Hop Academy" },
      { name: "description", content: "Connectez-vous à votre espace artiste Dada Hip Hop Academy." },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate({ to: "/dada-reseaux-artist" }), 500);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 text-white">
      <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative w-full max-w-lg rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 shadow-2xl p-8 md:p-10">
        <div className="flex justify-center">
          <img src={logo.url} alt="Dada Hip Hop Academy" className="h-20 w-auto" />
        </div>
        <h1 className="mt-4 text-center font-display text-3xl md:text-4xl tracking-wide">Bienvenue de retour</h1>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-semibold">E-mail</label>
            <input
              type="email"
              required
              placeholder="e-mail@gmail.com"
              className="mt-2 w-full h-12 px-4 rounded-lg bg-white text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Mot de Passe</label>
            <div className="mt-2 relative">
              <input
                type={showPwd ? "text" : "password"}
                required
                minLength={6}
                placeholder="***********"
                className="w-full h-12 px-4 pr-11 rounded-lg bg-white text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-secondary"
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black">
                {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

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
          <Link to="/sign-up" className="text-secondary font-semibold hover:underline">Créer un compte</Link>
        </p>
        <div className="mt-3 text-center">
          <Link to="/" className="text-sm text-secondary hover:underline">Retour</Link>
        </div>
      </div>
    </div>
  );
}
