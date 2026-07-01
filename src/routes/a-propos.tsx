import { createFileRoute, Link } from "@tanstack/react-router";
import teamAsset from "@/assets/apropos-team.png.asset.json";
import dancersAsset from "@/assets/apropos-dancers.png.asset.json";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "Qui sommes-nous ? — Dada Hip Hop Academy" },
      { name: "description", content: "Fondée par Ghada Belgacem, Dada Hip Hop Academy est un centre artistique et sportif dédié à révéler le potentiel de chaque individu." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-center font-display text-5xl md:text-7xl tracking-wide">QUI SOMMES-NOUS ?</h1>

        {/* Row 1 */}
        <div className="mt-12 grid gap-10 md:grid-cols-2 items-start">
          <img
            src={teamAsset.url}
            alt="Dada Hip Hop Academy — Where the beat drops"
            className="w-full rounded-2xl object-cover"
            loading="lazy"
          />
          <div className="space-y-5 text-foreground/90 leading-relaxed">
            <p>
              Dada Hip Hop Academy est un centre artistique et sportif conçu pour inspirer, former et accompagner les talents de tous âges.
            </p>
            <p>
              Fondé par <strong>Ghada Belgacem</strong>, danseuse, coach et créatrice de contenus, notre espace met en avant les valeurs de la culture urbaine : énergie, créativité, liberté et dépassement.
            </p>
            <Link
              to="/cours-activites"
              className="inline-flex mt-4 rounded-md bg-secondary text-secondary-foreground px-6 py-3 text-sm font-bold lowercase tracking-wider hover:opacity-90 transition"
            >
              voir les cours
            </Link>
          </div>
        </div>

        {/* Row 2 */}
        <div className="mt-14 grid gap-10 md:grid-cols-2 items-center">
          <div className="space-y-5 text-foreground/90 leading-relaxed">
            <p>
              Nous offrons un environnement où chacun peut évoluer à son rythme : passionnés, débutants, athlètes, artistes, enfants, adultes…
            </p>
            <p>
              <strong>Notre objectif est simple :</strong>
              <br />
              révéler le potentiel de chaque individu à travers le mouvement et la création.
            </p>
          </div>
          <img
            src={dancersAsset.url}
            alt="Danseurs Dada Hip Hop en performance"
            className="w-full rounded-2xl object-cover"
            loading="lazy"
          />
        </div>

        {/* Pillars */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <Card title="MISSION" body="Promouvoir la danse, le bien-être et la création artistique à travers un espace moderne et inclusif." />
          <Card title="VISION" body="Créer une plateforme culturelle et sportive qui révèle les talents et inspire la nouvelle génération." />
          <div className="rounded-2xl border border-border p-8">
            <h3 className="font-display text-3xl tracking-wide text-primary">VALEURS</h3>
            <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
              <span>Créativité</span><span>Respect</span><span>Énergie</span>
              <span>Confiance</span><span>Excellence</span><span>Communauté</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border p-8">
      <h3 className="font-display text-3xl tracking-wide text-primary">{title}</h3>
      <p className="mt-3 text-foreground/85 leading-relaxed">{body}</p>
    </div>
  );
}
