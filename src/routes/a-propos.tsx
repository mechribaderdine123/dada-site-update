import { createFileRoute, Link } from "@tanstack/react-router";
import teamAsset from "@/assets/apropos-team.png.asset.json";
import dancersAsset from "@/assets/apropos-dancers.png.asset.json";
import { useContent } from "@/lib/site-content";

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
  const title = useContent("about.title", "QUI SOMMES-NOUS ?");
  const image1 = useContent("about.image1", teamAsset.url);
  const p1 = useContent("about.p1", "Dada Hip Hop Academy est un centre artistique et sportif conçu pour inspirer, former et accompagner les talents de tous âges.");
  const p2 = useContent("about.p2", "Fondé par Ghada Belgacem, danseuse, coach et créatrice de contenus, notre espace met en avant les valeurs de la culture urbaine : énergie, créativité, liberté et dépassement.");
  const cta = useContent("about.cta", "voir les cours");
  const p3 = useContent("about.p3", "Nous offrons un environnement où chacun peut évoluer à son rythme : passionnés, débutants, athlètes, artistes, enfants, adultes…");
  const p4 = useContent("about.p4", "révéler le potentiel de chaque individu à travers le mouvement et la création.");
  const image2 = useContent("about.image2", dancersAsset.url);
  const mission = useContent("about.mission", "Promouvoir la danse, le bien-être et la création artistique à travers un espace moderne et inclusif.");
  const vision = useContent("about.vision", "Créer une plateforme culturelle et sportive qui révèle les talents et inspire la nouvelle génération.");

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-center font-display text-5xl md:text-7xl tracking-wide">{title}</h1>

        <div className="mt-12 grid gap-10 md:grid-cols-2 items-start">
          <img src={image1} alt="Dada Hip Hop Academy" className="w-full rounded-2xl object-cover" loading="lazy" />
          <div className="space-y-5 text-foreground/90 leading-relaxed">
            <p>{p1}</p>
            <p>{p2}</p>
            <Link to="/cours-activites" className="inline-flex mt-4 rounded-md bg-secondary text-secondary-foreground px-6 py-3 text-sm font-bold lowercase tracking-wider hover:opacity-90 transition">
              {cta}
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-2 items-center">
          <div className="space-y-5 text-foreground/90 leading-relaxed">
            <p>{p3}</p>
            <p>
              <strong>Notre objectif est simple :</strong>
              <br />
              {p4}
            </p>
          </div>
          <img src={image2} alt="Danseurs Dada Hip Hop en performance" className="w-full rounded-2xl object-cover" loading="lazy" />
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <Card title="MISSION" body={mission} />
          <Card title="VISION" body={vision} />
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
