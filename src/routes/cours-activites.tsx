import { createFileRoute, Link } from "@tanstack/react-router";
import { PersonStanding, Dumbbell, Flower2 } from "lucide-react";
import heroAsset from "@/assets/cours-hero.png.asset.json";
import planAsset from "@/assets/cours-plan.png.asset.json";
import { useContent } from "@/lib/site-content";

export const Route = createFileRoute("/cours-activites")({
  head: () => ({
    meta: [
      { title: "Nos Cours & Activités — Dada Hip Hop Academy" },
      { name: "description", content: "Danse, fitness, bien-être et arts martiaux. Découvrez tous nos programmes à Dada Hip Hop Academy." },
    ],
  }),
  component: CoursPage,
});

type Card = {
  title: string;
  items: string[];
  icon: React.ReactNode;
  accent: "primary" | "secondary";
};

const CARDS: Card[] = [
  {
    title: "COURS DE DANCE",
    icon: <PersonStanding className="w-6 h-6" />,
    accent: "primary",
    items: ["Hip-hop", "Breakdance", "Danse classique", "Danse urbaine & freestyle", "Expression corporelle"],
  },
  {
    title: "COURS DE FITNESS",
    icon: <Dumbbell className="w-6 h-6" />,
    accent: "secondary",
    items: ["Fitness général", "Renforcement musculaire", "Stretching", "Cardio dance"],
  },
  {
    title: "COURS BIEN ETRE",
    icon: <Flower2 className="w-6 h-6" />,
    accent: "primary",
    items: ["Yoga", "Pilates", "Gym douce"],
  },
  {
    title: "ARTS MARTIAUX",
    icon: <PersonStanding className="w-6 h-6" />,
    accent: "primary",
    items: ["Kung Fu", "Lutte", "Self défense"],
  },
  {
    title: "GYM KIDS",
    icon: <Dumbbell className="w-6 h-6" />,
    accent: "secondary",
    items: ["Gym kids poussins", "Gym kids débutants", "Gymnastique filles 13+", "Gymnastique garçons 13+"],
  },
  {
    title: "SPÉCIAL FEMMES",
    icon: <Flower2 className="w-6 h-6" />,
    accent: "primary",
    items: ["Cardio mix + CAF", "Zumba", "Pilates", "Renfo / Pilates"],
  },
];

function CoursPage() {
  const heroImg = useContent("cours.hero.image", heroAsset.url);
  const title = useContent("cours.title", "NOS COURS & ACTIVITÉS");
  const intro = useContent("cours.intro", "Découvrez une variété de cours conçus pour développer votre technique, votre forme physique et votre créativité. Nos coachs qualifiés vous accompagnent à chaque étape.");
  const cta = useContent("cours.cta", "Contacter Nous");
  const sectionTitle = useContent("cours.section.title", "TOUS NOS COURS");
  const sectionSub = useContent("cours.section.sub", "Des programmes adaptés à tous les niveaux, du débutant à l'expert.");
  const planImg = useContent("cours.plan.image", planAsset.url);

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid gap-8 md:grid-cols-[320px_1fr] items-center">
          <img src={heroImg} alt="Dada Hip Hop Academy" className="w-full rounded-2xl object-cover" loading="lazy" />
          <div>
            <h1 className="font-display text-5xl md:text-6xl tracking-wide">{title}</h1>
            <p className="mt-4 text-foreground/85 leading-relaxed">{intro}</p>
            <Link to="/contact" className="mt-6 inline-flex rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-bold hover:opacity-90 transition">
              {cta}
            </Link>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="font-display text-3xl tracking-wide">{sectionTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{sectionSub}</p>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((c) => (
              <article key={c.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className={`w-12 h-12 grid place-items-center rounded-lg ${c.accent === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/15 text-secondary"}`}>
                  {c.icon}
                </div>
                <h3 className={`mt-5 font-display text-2xl tracking-wide ${c.accent === "primary" ? "text-primary" : "text-secondary"}`}>{c.title}</h3>
                <ul className="mt-4 space-y-1.5 text-sm text-foreground/85">
                  {c.items.map((item) => (<li key={item}>• {item}</li>))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="font-display text-3xl tracking-wide">PLAN</h2>
          <p className="mt-2 text-sm text-muted-foreground">Consultez notre planning hebdomadaire pour trouver le créneau qui vous convient.</p>
          <div className="mt-6 rounded-2xl overflow-hidden border border-border">
            <img src={planImg} alt="Planning hebdomadaire Dada Hip Hop Academy" className="w-full h-auto" loading="lazy" />
          </div>
        </div>
      </div>
    </div>
  );
}
