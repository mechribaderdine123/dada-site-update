import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import authImg from "@/assets/dada-auth.jpg";
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
    <div className="min-h-screen grid md:grid-cols-2 bg-background text-foreground">
      {/* IMAGE PANEL */}
      <div className="relative hidden md:block overflow-hidden">
        <img src={authImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/40 to-primary/40" />
        <div className="relative h-full flex flex-col justify-between p-10">
          <Link to="/" className="inline-flex">
            <img src={logo.url} alt="Dada Hip Hop Academy" className="h-20 w-auto drop-shadow-2xl" />
          </Link>
          <div>
            <h2 className="font-display text-5xl tracking-wide leading-none">Danse.<br />Culture.<br />Création.</h2>
            <p className="mt-4 text-foreground/85 max-w-sm">L'espace où chaque talent trouve son expression.</p>
          </div>
        </div>
      </div>

      {/* FORM PANEL */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide">Bienvenue de retour</h1>
          <p className="mt-2 text-muted-foreground">Connectez-vous à votre espace artiste.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <Field label="E-mail" type="email" name="email" placeholder="votre@email.com" required />
            <div>
              <label className="text-sm font-semibold">Mot de passe</label>
              <div className="mt-1.5 relative">
                <input
                  type={showPwd ? "text" : "password"}
                  name="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 pr-11 rounded-lg bg-muted/40 border border-border focus:border-primary outline-none transition"
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <a className="text-xs text-secondary hover:underline cursor-pointer">Mot de passe oublié ?</a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-bold uppercase tracking-wider text-sm hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            Vous n'avez pas de compte ?{" "}
            <Link to="/sign-up" className="text-secondary font-semibold hover:underline">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <input
        {...props}
        className="mt-1.5 w-full h-11 px-4 rounded-lg bg-muted/40 border border-border focus:border-primary outline-none transition"
      />
    </div>
  );
}
