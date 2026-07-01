import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Eye, Heart } from "lucide-react";
import founderImg from "@/assets/dada-founder.jpg";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "Qui sommes-nous ? — Dada Hip Hop Academy" },
      { name: "description", content: "Fondée par Ghada Belgacem, Dada Hip Hop Academy est un centre artistique et sportif dédié à révéler le potentiel de chaque individu." },
    ],
  }),
  component: AboutPage,
});

const VALUES = ["Créativité", "Respect", "Énergie", "Confiance", "Excellence", "Communauté"];

function AboutPage() {
  return (
    <>
      <section className="pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-6 grid gap-12 md:grid-cols-2 items-center">
          <div>
            <p className="uppercase tracking-[0.4em] text-primary text-xs font-semibold">Notre histoire</p>
            <h1 className="mt-4 font-display text-5xl md:text-7xl tracking-wide">Qui sommes-nous ?</h1>
            <div className="mt-6 space-y-5 text-foreground/90 leading-relaxed">
              <p>
                <span className="font-display text-2xl text-secondary tracking-wide">Dada Hip Hop Academy</span> est un centre artistique et sportif conçu pour inspirer, former et accompagner les talents de tous âges.
              </p>
              <p>
                Fondé par <strong>Ghada Belgacem</strong>, danseuse, coach et créatrice de contenus, notre espace met en avant les valeurs de la culture urbaine&nbsp;: énergie, créativité, liberté et dépassement.
              </p>
              <p>
                Nous offrons un environnement où chacun peut évoluer à son rythme&nbsp;: passionnés, débutants, athlètes, artistes, enfants, adultes...
              </p>
              <p className="text-lg text-secondary font-semibold">
                Notre objectif est simple&nbsp;: révéler le potentiel de chaque individu à travers le mouvement et la création.
              </p>
            </div>
            <Link
              to="/cours-activites"
              className="mt-8 inline-flex rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-bold uppercase tracking-wider hover:opacity-90 transition"
            >
              Voir les cours
            </Link>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/40 to-secondary/40 blur-3xl -z-10" />
            <img
              src={founderImg}
              alt="Ghada Belgacem, fondatrice"
              width={1024}
              height={1280}
              loading="lazy"
              className="w-full rounded-2xl object-cover shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* MISSION / VISION / VALEURS */}
      <section className="py-20 border-t border-border/40 bg-card/30">
        <div className="max-w-6xl mx-auto px-6 grid gap-6 md:grid-cols-3">
          <Pillar
            icon={<Sparkles className="w-6 h-6" />}
            title="Mission"
            body="Promouvoir la danse, le bien-être et la création artistique à travers un espace moderne et inclusif."
          />
          <Pillar
            icon={<Eye className="w-6 h-6" />}
            title="Vision"
            body="Créer une plateforme culturelle et sportive qui révèle les talents et inspire la nouvelle génération."
          />
          <div className="rounded-xl bg-card border border-border/60 p-8">
            <div className="w-12 h-12 grid place-items-center rounded-lg bg-primary/15 text-primary">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="mt-4 font-display text-2xl tracking-wide uppercase">Valeurs</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {VALUES.map((v) => (
                <span key={v} className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-semibold uppercase tracking-wider">
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Pillar({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl bg-card border border-border/60 p-8">
      <div className="w-12 h-12 grid place-items-center rounded-lg bg-primary/15 text-primary">{icon}</div>
      <h3 className="mt-4 font-display text-2xl tracking-wide uppercase">{title}</h3>
      <p className="mt-3 text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
