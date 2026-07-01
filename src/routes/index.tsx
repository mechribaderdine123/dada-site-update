import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import heroImg from "@/assets/dada-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dada Hip Hop Academy — Danse. Culture. Création." },
      { name: "description", content: "L'espace où chaque talent trouve son expression. Cours de danse, gymnastique, arts martiaux à Tunis." },
    ],
  }),
  component: HomePage,
});

const PARTNERS = Array.from({ length: 12 }, (_, i) => `P${String(i + 1).padStart(2, "0")}`);

function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <img
          src={heroImg}
          alt="Danseurs Dada Hip Hop Academy"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/60 to-background" />
        <div className="absolute inset-0" style={{ background: "var(--glow-red)" }} />

        <div className="relative max-w-6xl mx-auto px-6 py-32 text-center w-full">
          <p className="uppercase tracking-[0.4em] text-primary text-xs font-semibold">Hip Hop Academy</p>
          <h1 className="mt-6 font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9] tracking-wide">
            DADA HIP HOP<br />ACADEMY
          </h1>
          <h2 className="mt-6 font-display text-2xl md:text-3xl tracking-widest text-secondary">
            Danse. Culture. Création.
          </h2>
          <p className="mt-6 max-w-xl mx-auto text-base md:text-lg text-foreground/85">
            L'espace où chaque talent trouve son expression.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/cours-activites"
              className="group inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-bold uppercase tracking-wider hover:opacity-90 transition shadow-xl shadow-primary/30"
            >
              Découvrir nos cours
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/sign-in"
              className="inline-flex items-center gap-2 rounded-md border border-foreground/40 bg-background/40 backdrop-blur px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition"
            >
              Se connecter artiste
            </Link>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-xs text-muted-foreground animate-bounce">
          <div className="w-px h-8 bg-foreground/40" />
          scroll
        </div>
      </section>

      {/* PARTNERS */}
      <section className="py-20 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <p className="uppercase tracking-[0.4em] text-primary text-xs font-semibold">Ensemble</p>
            <h2 className="mt-3 font-display text-5xl md:text-6xl tracking-wide">Nos Partenaires</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Ils nous font confiance et soutiennent l'aventure Dada Hip Hop Academy.
            </p>
          </div>

          <div className="mt-12 overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
            <div className="flex gap-6 animate-[marquee_35s_linear_infinite]">
              {[...PARTNERS, ...PARTNERS].map((p, i) => (
                <div
                  key={i}
                  className="shrink-0 w-40 h-24 rounded-lg bg-card border border-border/60 grid place-items-center font-display text-2xl tracking-widest text-muted-foreground hover:text-secondary hover:border-secondary transition"
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROMO STRIP */}
      <section className="relative py-24 border-t border-border/40 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--glow-red)" }} />
        <div className="relative max-w-4xl mx-auto text-center px-6">
          <h2 className="font-display text-5xl md:text-7xl tracking-wide">Rejoignez la famille</h2>
          <p className="mt-5 text-foreground/85 max-w-2xl mx-auto">
            Que vous soyez débutant curieux, athlète confirmé ou artiste en devenir — trouvez votre discipline et donnez vie à votre énergie.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/cours-activites" className="rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-bold uppercase tracking-wider hover:opacity-90 transition">
              Voir les cours
            </Link>
            <Link to="/contact" className="rounded-md border border-foreground/40 px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition">
              Contactez-nous
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </>
  );
}
