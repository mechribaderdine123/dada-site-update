import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Users, Radio } from "lucide-react";
import heroAsset from "@/assets/dada-hero-new.png.asset.json";
import handstandAsset from "@/assets/dada-handstand.png.asset.json";
import { useContent } from "@/lib/site-content";
import { useSponsors } from "@/lib/sponsors";

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
  const heroImage = useContent("home.hero.image", heroAsset.url);
  const title1 = useContent("home.hero.title1", "DADA HIP HOP");
  const title2 = useContent("home.hero.title2", "ACADEMY");
  const subtitle = useContent("home.hero.subtitle", "Danse. Culture. Création.");
  const tagline = useContent("home.hero.tagline", "L'espace où chaque talent trouve son expression.");
  const cta1 = useContent("home.hero.cta1", "Découvrir nos cours");
  const cta2 = useContent("home.hero.cta2", "Sign in artist");
  const p1 = useContent("home.welcome.p1", "Bienvenue à Dada Hip Hop Academy, un lieu unique dédié à la danse, au mouvement, au bien-être et à la création artistique.");
  const p2 = useContent("home.welcome.p2", "Nous réunissons cours, clubs, studio musique, ateliers créatifs et espace digital pour offrir à chacun un véritable terrain d'expression.");
  const p3 = useContent("home.welcome.p3", "Rejoignez une communauté dynamique, artistique et passionnée.");
  const motto = useContent("home.welcome.motto", "Bougez. Créez. Exprimez-vous");
  const card1Title = useContent("home.card1.title", "Rejoindre un club");
  const card1Body = useContent("home.card1.body", "Explorez nos styles de danse et trouvez votre rythme.");
  const card2Title = useContent("home.card2.title", "Réserver au studio musique");
  const card2Body = useContent("home.card2.body", "Un studio musique pro pour enregistrer vos sons.");
  const welcomeImage = useContent("home.welcome.image", handstandAsset.url);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="relative h-[85vh] min-h-[600px] w-full overflow-hidden">
          <img src={heroImage} alt="Danseurs Dada Hip Hop Academy" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, color-mix(in oklch, var(--primary) 55%, transparent) 0%, transparent 30%, transparent 70%, color-mix(in oklch, var(--primary) 55%, transparent) 100%)" }} />

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
            <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9] tracking-wide text-white drop-shadow-2xl">
              {title1}<br />{title2}
            </h1>
            <h2 className="mt-8 font-display text-3xl md:text-4xl tracking-wide text-white">{subtitle}</h2>
            <p className="mt-3 text-base md:text-lg text-white/90">{tagline}</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link to="/cours-activites" className="rounded-md bg-secondary text-secondary-foreground px-8 py-3 text-sm font-semibold hover:opacity-90 transition">{cta1}</Link>
              <Link to="/sign-in" className="rounded-md bg-primary text-primary-foreground px-8 py-3 text-sm font-semibold hover:opacity-90 transition">{cta2}</Link>
            </div>
          </div>
        </div>
      </section>

      <SponsorsStrip />



      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-6 font-sans text-foreground/90 leading-relaxed">
            <p>{p1}</p>
            <p>{p2}</p>
            <p>{p3}</p>
            <p className="font-semibold">{motto}</p>

            <div className="grid sm:grid-cols-2 gap-5 pt-4">
              <div className="rounded-xl border border-primary/40 bg-card/50 p-6">
                <div className="w-11 h-11 rounded-lg bg-primary/15 grid place-items-center mb-4">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-2xl tracking-wide text-primary">{card1Title}</h3>
                <p className="mt-3 text-sm text-foreground/80">{card1Body}</p>
                <Link to="/cours-activites" className="mt-5 inline-flex items-center gap-2 text-primary font-semibold text-sm">
                  Explorer <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="rounded-xl border border-primary/40 bg-card/50 p-6">
                <div className="w-11 h-11 rounded-lg bg-primary/15 grid place-items-center mb-4">
                  <Radio className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-2xl tracking-wide text-primary">{card2Title}</h3>
                <p className="mt-3 text-sm text-foreground/80">{card2Body}</p>
                <Link to="/contact" className="mt-5 inline-flex items-center gap-2 text-primary font-semibold text-sm">
                  Explorer <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="relative">
            <img src={welcomeImage} alt="Danseur breakdance sous logo Dada" className="w-full h-full max-h-[640px] object-cover rounded-2xl" />
          </div>
        </div>
      </section>
    </>
  );
}

function SponsorsStrip() {
  const sponsors = useSponsors();
  if (sponsors.length === 0) return null;
  return (
    <section className="py-12 md:py-16 border-b border-border/60 bg-muted/20">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-muted-foreground mb-8">
          Avec le soutien de
        </p>
        <div className="group relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max animate-marquee gap-16 md:gap-20 group-hover:[animation-play-state:paused]">
            {[...sponsors, ...sponsors].map((s, i) => {
              const img = (
                <img
                  src={s.image}
                  alt={s.name}
                  className="h-20 md:h-24 w-auto object-contain opacity-90 hover:opacity-100 transition"
                />
              );
              return (
                <div key={`${s.id}-${i}`} className="shrink-0 flex items-center" title={s.name}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer">{img}</a>
                  ) : img}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}

