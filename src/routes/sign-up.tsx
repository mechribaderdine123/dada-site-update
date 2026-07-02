import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Youtube, Facebook, Instagram, Music2, Twitter } from "lucide-react";
import bgAsset from "@/assets/auth-bg.png.asset.json";
const bg = bgAsset.url;
import logo from "@/assets/dada-logo.png.asset.json";

export const Route = createFileRoute("/sign-up")({
  head: () => ({
    meta: [
      { title: "Créer un compte — Dada Hip Hop Academy" },
      { name: "description", content: "Rejoignez la communauté Dada Réseaux Artist." },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate({ to: "/artist" }), 500);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 text-white">
      <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative w-full max-w-2xl rounded-2xl bg-black/55 backdrop-blur-xl border border-white/10 shadow-2xl p-8 md:p-10">
        <div className="flex justify-center">
          <img src={logo.url} alt="Dada Hip Hop Academy" className="h-16 w-auto" />
        </div>
        <h1 className="mt-3 text-center font-display text-3xl md:text-4xl tracking-wide">Rejoignez la communauté</h1>

        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="mt-6">
            <h2 className="text-secondary font-semibold border-b border-white/15 pb-2">Informations Générales</h2>

            <div className="mt-5 space-y-4">
              <Field label="Nom d'artiste *" placeholder="Nom" required />
              <Field label="E-mail *" type="email" placeholder="e-mail@gmail.com" required />

              <div className="grid grid-cols-2 gap-4">
                <PwdField label="Mot de Passe *" show={showPwd} setShow={setShowPwd} />
                <PwdField label="Confirmer Mot de Passe *" show={showPwd2} setShow={setShowPwd2} />
              </div>
            </div>

            <button type="submit" className="mt-8 w-full h-12 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:opacity-90 transition">
              Suivant
            </button>
            <StepBar step={1} />
            <p className="mt-4 text-sm text-center text-white/80">
              Vous avez déjà un compte?{" "}
              <Link to="/sign-in" className="text-secondary font-semibold hover:underline">Connecter</Link>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="mt-6">
            <h2 className="text-secondary font-semibold border-b border-white/15 pb-2">Profil Artistique</h2>

            <div className="mt-5 space-y-4">
              <Field label="Genre musical *" placeholder="Hip Hop, R&B, Rap..." required />
              <Field label="Ville *" placeholder="Votre ville" required />
              <div>
                <label className="text-sm font-semibold">Biographie</label>
                <textarea
                  rows={4}
                  placeholder="Parlez-nous de votre parcours artistique..."
                  className="mt-2 w-full px-4 py-3 rounded-lg bg-white text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-secondary resize-none"
                />
              </div>
              <Field label="Téléphone" type="tel" placeholder="+243 ..." />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setStep(1)} className="h-12 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 font-semibold transition">
                Retour
              </button>
              <button type="submit" className="h-12 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:opacity-90 transition">
                Suivant
              </button>
            </div>
            <StepBar step={2} />
          </form>
        )}

        {step === 3 && (
          <form onSubmit={submit} className="mt-6">
            <h2 className="text-secondary font-semibold border-b border-white/15 pb-2">Plateformes de médias sociaux et de musique</h2>

            <div className="mt-5 space-y-4">
              <SocialField icon={<Youtube className="w-4 h-4 text-red-500" />} label="YouTube" placeholder="https://www.youtube.com/@nom artiste" />
              <SocialField icon={<Music2 className="w-4 h-4 text-green-500" />} label="Spotify" placeholder="https://open.spotify.com/artiste/..." />

              <div className="grid grid-cols-2 gap-4">
                <SocialField icon={<Facebook className="w-4 h-4 text-blue-500" />} label="Facebook" placeholder="https://Facebook/artiste" />
                <SocialField icon={<Instagram className="w-4 h-4 text-pink-500" />} label="Instagram" placeholder="https://instagram/artiste" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SocialField icon={<Music2 className="w-4 h-4" />} label="TikTok" placeholder="https://tiktok.com/@artiste" />
                <SocialField icon={<Twitter className="w-4 h-4" />} label="Twitter" placeholder="https://twitter.com/artiste" />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setStep(2)} className="h-12 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 font-semibold transition">
                Retour
              </button>
              <button type="submit" disabled={loading} className="h-12 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:opacity-90 transition disabled:opacity-60">
                {loading ? "Création..." : "Créer le compte"}
              </button>
            </div>
            <StepBar step={3} />
          </form>
        )}
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
        className="mt-2 w-full h-12 px-4 rounded-lg bg-white text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-secondary"
      />
    </div>
  );
}

function PwdField({ label, show, setShow }: { label: string; show: boolean; setShow: (v: boolean) => void }) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <div className="mt-2 relative">
        <input
          type={show ? "text" : "password"}
          required
          minLength={6}
          placeholder="***********"
          className="w-full h-12 px-4 pr-11 rounded-lg bg-white text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-secondary"
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black">
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

function SocialField({ icon, label, placeholder }: { icon: React.ReactNode; label: string; placeholder: string }) {
  return (
    <div>
      <label className="text-sm font-semibold inline-flex items-center gap-2">
        {icon} {label}
      </label>
      <input
        placeholder={placeholder}
        className="mt-2 w-full h-12 px-4 rounded-lg bg-white text-black placeholder:text-black/40 outline-none focus:ring-2 focus:ring-secondary"
      />
    </div>
  );
}

function StepBar({ step }: { step: number }) {
  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      {[1, 2, 3].map((n) => (
        <div key={n} className={`h-1.5 w-16 rounded-full ${n <= step ? "bg-secondary" : "bg-white/20"}`} />
      ))}
    </div>
  );
}
