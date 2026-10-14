import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PersonStanding, Dumbbell, Flower2, X } from "lucide-react";
import heroAsset from "@/assets/dada-cours.jpg";
import planAsset from "@/assets/dada-plan.jpg";
import { SiteContentProvider, useContent } from "@/lib/site-content";
import { loadSiteContent } from "@/lib/site-content.server";
import { PLAN_DAYS, useDailyPlans, todayPlanDay } from "@/lib/daily-plans";

export const Route = createFileRoute("/cours-activites")({
  head: () => ({
    meta: [
      { title: "Nos Cours & Activités — Dada Hip Hop Academy" },
      {
        name: "description",
        content:
          "Danse, fitness, bien-être et arts martiaux. Découvrez tous nos programmes à Dada Hip Hop Academy.",
      },
    ],
  }),
  loader: () => loadSiteContent(),

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
    items: [
      "Hip-hop",
      "Breakdance",
      "Danse classique",
      "Danse urbaine & freestyle",
      "Expression corporelle",
    ],
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
    items: [
      "Gym kids poussins",
      "Gym kids débutants",
      "Gymnastique filles 13+",
      "Gymnastique garçons 13+",
    ],
  },
  {
    title: "SPÉCIAL FEMMES",
    icon: <Flower2 className="w-6 h-6" />,
    accent: "primary",
    items: ["Cardio mix + CAF", "Zumba", "Pilates", "Renfo / Pilates"],
  },
];

function CoursPage() {
  return (
    <SiteContentProvider content={Route.useLoaderData()}>
      <CoursPageContent />
    </SiteContentProvider>
  );
}

function CoursPageContent() {
  const heroImg = useContent("cours.hero.image", heroAsset);
  const title = useContent("cours.title", "NOS COURS & ACTIVITÉS");
  const intro = useContent(
    "cours.intro",
    "Découvrez une variété de cours conçus pour développer votre technique, votre forme physique et votre créativité. Nos coachs qualifiés vous accompagnent à chaque étape.",
  );
  const cta = useContent("cours.cta", "Contacter Nous");
  const sectionTitle = useContent("cours.section.title", "TOUS NOS COURS");
  const sectionSub = useContent(
    "cours.section.sub",
    "Des programmes adaptés à tous les niveaux, du débutant à l'expert.",
  );
  return (
    <div className="pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid gap-8 md:grid-cols-[320px_1fr] items-center">
          <img
            src={heroImg}
            alt="Dada Hip Hop Academy"
            className="w-full rounded-2xl object-cover"
            loading="lazy"
          />
          <div>
            <h1 className="font-display text-5xl md:text-6xl tracking-wide">{title}</h1>
            <p className="mt-4 text-foreground/85 leading-relaxed">{intro}</p>
            <Link
              to="/contact"
              className="mt-6 inline-flex rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-bold hover:opacity-90 transition"
            >
              {cta}
            </Link>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="font-display text-3xl tracking-wide">{sectionTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{sectionSub}</p>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((c) => (
              <article
                key={c.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div
                  className={`w-12 h-12 grid place-items-center rounded-lg ${c.accent === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/15 text-secondary"}`}
                >
                  {c.icon}
                </div>
                <h3
                  className={`mt-5 font-display text-2xl tracking-wide ${c.accent === "primary" ? "text-primary" : "text-secondary"}`}
                >
                  {c.title}
                </h3>
                <ul className="mt-4 space-y-1.5 text-sm text-foreground/85">
                  {c.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <PlanSection />
      </div>
    </div>
  );
}

const DAY_LABELS: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche",
};

function PlanSection() {
  const { plans, loading } = useDailyPlans();
  const planImg = useContent("cours.plan.image", planAsset);
  const [selected, setSelected] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const daysWithPlans: string[] = PLAN_DAYS.filter((d) => plans.some((p) => p.day === d));
  const today = todayPlanDay();
  const activeDay =
    selected && daysWithPlans.includes(selected)
      ? selected
      : daysWithPlans.includes(today)
        ? today
        : daysWithPlans[0];
  const visible = activeDay ? plans.filter((p) => p.day === activeDay) : [];

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  return (
    <div className="mt-16">
      <h2 className="font-display text-3xl tracking-wide">PLAN</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Choisissez un jour pour voir le planning de la journée.
      </p>

      {/* The weekly overview stays visible whether or not daily plans exist;
          it remains editable from the dashboard (cours.plan.image). */}
      <div className="mt-6 rounded-2xl overflow-hidden border border-border">
        <img
          src={planImg}
          alt="Planning hebdomadaire Dada Hip Hop Academy"
          className="w-full h-auto"
          loading="lazy"
        />
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Chargement du planning…</p>
      ) : plans.length === 0 ? null : (
        <>
          <div className="mt-8 flex flex-wrap gap-2">
            {PLAN_DAYS.map((d) => {
              const has = daysWithPlans.includes(d);
              const active = d === activeDay;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => has && setSelected(d)}
                  disabled={!has}
                  aria-pressed={active}
                  className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : has
                        ? "border-border bg-card hover:bg-muted"
                        : "border-border/60 text-muted-foreground/50 opacity-60 cursor-not-allowed"
                  }`}
                >
                  {DAY_LABELS[d]}
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Aucun plan publié pour ce jour pour le moment.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setLightbox(p.image_url)}
                  className="group aspect-square rounded-2xl overflow-hidden border border-border bg-muted text-left focus:outline-none focus:ring-2 focus:ring-primary"
                  title={p.title || `Planning ${DAY_LABELS[p.day]}`}
                >
                  <img
                    src={p.image_url}
                    alt={p.title || `Planning ${DAY_LABELS[p.day]}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 grid place-items-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Fermer"
            className="absolute top-4 right-4 rounded-full bg-white/10 text-white p-2 hover:bg-white/25"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightbox}
            alt="Planning Dada Hip Hop Academy"
            className="max-h-[90vh] max-w-[95vw] w-auto h-auto rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
