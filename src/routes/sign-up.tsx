import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import authImg from "@/assets/dada-auth.jpg";

export const Route = createFileRoute("/sign-up")({
  head: () => ({
    meta: [
      { title: "Créer un compte — Dada Hip Hop Academy" },
      { name: "description", content: "Créez votre espace artiste Dada Hip Hop Academy." },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate({ to: "/dada-reseaux-artist" }), 500);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background text-foreground">
      <div className="relative hidden md:block overflow-hidden">
        <img src={authImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/40 to-primary/40" />
        <div className="relative h-full flex flex-col justify-between p-10">
          <Link to="/" className="flex items-center gap-2 font-display tracking-widest text-xl">
            <span className="w-9 h-9 grid place-items-center rounded-md bg-primary text-primary-foreground font-black">D</span>
            DADA HIP HOP
          </Link>
          <div>
            <h2 className="font-display text-5xl tracking-wide leading-none">Rejoignez<br />l'aventure.</h2>
            <p className="mt-4 text-foreground/85 max-w-sm">Créez votre profil artiste et mettez votre talent en lumière.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/sign-in" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide">Créer un compte</h1>
          <p className="mt-2 text-muted-foreground">Quelques infos pour démarrer.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prénom" name="firstname" required />
              <Field label="Nom" name="lastname" required />
            </div>
            <Field label="E-mail" type="email" name="email" required />
            <Field label="Mot de passe" type="password" name="password" required minLength={6} />

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-bold uppercase tracking-wider text-sm hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? "Création..." : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link to="/sign-in" className="text-secondary font-semibold hover:underline">Se connecter</Link>
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
