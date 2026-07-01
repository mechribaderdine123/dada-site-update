import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Users, Radio } from "lucide-react";
import heroAsset from "@/assets/dada-hero-new.png.asset.json";
import handstandAsset from "@/assets/dada-handstand.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dada Hip Hop Academy — Danse. Culture. Création." },
      { name: "description", content: "L'espace où chaque talent trouve son expression. Cours de danse, studio musique et création artistique." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="relative h-[85vh] min-h-[600px] w-full overflow-hidden">
          <img
            src={heroAsset.url}
            alt="Danseurs Dada Hip Hop Academy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* red left / teal right cinematic wash */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, color-mix(in oklch, var(--primary) 55%, transparent) 0%, transparent 30%, transparent 70%, color-mix(in oklch, var(--primary) 55%, transparent) 100%)" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/80" />

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
            <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9] tracking-wide text-white drop-shadow-2xl">
              DADA HIP HOP<br />ACADEMY
            </h1>
            <h2 className="mt-8 font-display text-3xl md:text-4xl tracking-wide text-white">
              Danse. Culture. Création.
            </h2>
            <p className="mt-3 text-base md:text-lg text-white/90">
              L'espace où chaque talent trouve son expression.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/cours-activites"
                className="rounded-md bg-secondary text-secondary-foreground px-8 py-3 text-sm font-semibold hover:opacity-90 transition"
              >
                Découvrir nos cours
              </Link>
              <Link
                to="/sign-in"
                className="rounded-md bg-primary text-primary-foreground px-8 py-3 text-sm font-semibold hover:opacity-90 transition"
              >
                Sign in artist
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WELCOME + IMAGE */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-6 font-sans text-foreground/90 leading-relaxed">
            <p>
              Bienvenue à <strong className="font-semibold">Dada Hip Hop Academy,</strong> un lieu unique dédié à la danse, au mouvement, au bien-être et à la création artistique.
            </p>
            <p>
              Nous réunissons cours, clubs, studio musique, ateliers créatifs et espace digital pour offrir à chacun un véritable terrain d'expression.
            </p>
            <p>
              Rejoignez une communauté dynamique, artistique et passionnée.
            </p>
            <p className="font-semibold">Bougez. Créez. Exprimez-vous</p>

            <div className="grid sm:grid-cols-2 gap-5 pt-4">
              <div className="rounded-xl border border-primary/40 bg-card/50 p-6">
                <div className="w-11 h-11 rounded-lg bg-primary/15 grid place-items-center mb-4">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-2xl tracking-wide text-primary">Rejoindre un club</h3>
                <p className="mt-3 text-sm text-foreground/80">
                  Explorez nos styles de danse et trouvez votre rythme.
                </p>
                <Link to="/cours-activites" className="mt-5 inline-flex items-center gap-2 text-primary font-semibold text-sm">
                  Explorer <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="rounded-xl border border-primary/40 bg-card/50 p-6">
                <div className="w-11 h-11 rounded-lg bg-primary/15 grid place-items-center mb-4">
                  <Radio className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-2xl tracking-wide text-primary">Réserver au studio musique</h3>
                <p className="mt-3 text-sm text-foreground/80">
                  Un studio musique pro pour enregistrer vos sons.
                </p>
                <Link to="/contact" className="mt-5 inline-flex items-center gap-2 text-primary font-semibold text-sm">
                  Explorer <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="relative">
            <img
              src={handstandAsset.url}
              alt="Danseur breakdance sous logo Dada"
              className="w-full h-full max-h-[640px] object-cover rounded-2xl"
            />
          </div>
        </div>
      </section>
    </>
  );
}
