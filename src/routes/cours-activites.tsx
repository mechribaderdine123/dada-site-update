import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import coursImg from "@/assets/dada-cours.jpg";
import planImg from "@/assets/dada-plan.jpg";

export const Route = createFileRoute("/cours-activites")({
  head: () => ({
    meta: [
      { title: "Nos Cours & Activités — Dada Hip Hop Academy" },
      { name: "description", content: "Danse, gymnastique, cardio, arts martiaux, cours pour enfants et adultes. Découvrez tous nos programmes à Tunis." },
    ],
  }),
  component: CoursPage,
});

const CATEGORIES = [
  { title: "Cours collectifs spécial femmes", items: ["Cardio mixte", "Zumba", "Pilates"] },
  { title: "Cours collectifs mixte", items: ["Cours mixte + CAF", "Renforcement", "Tabata"] },
  { title: "Danse", items: ["Contemporaine", "Classique", "Hip hop"] },
  { title: "Bac Sport", items: ["Gymnastique garçons", "Gymnastique filles"] },
  { title: "Gymnastique Kids", items: ["Gym kids poussins", "Gym kids débutants", "Gym kids avancé", "Gym kids inter"] },
  { title: "Martial Arts", items: ["Lutte", "Kung Fu"] },
];

function CoursPage() {
  return (
    <>
      {/* HEADER */}
      <section className="relative pt-32 pb-20 overflow-hidden border-b border-border/40">
        <img src={coursImg} alt="Cours de danse" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <p className="uppercase tracking-[0.4em] text-primary text-xs font-semibold">Programmes</p>
          <h1 className="mt-4 font-display text-6xl md:text-8xl tracking-wide">Nos Cours & Activités</h1>
          <p className="mt-6 max-w-2xl mx-auto text-foreground/85 text-lg">
            Découvrez une variété de cours conçus pour développer votre technique, votre forme physique et votre créativité. Nos coachs qualifiés vous accompagnent à chaque étape.
          </p>
          <Link
            to="/contact"
            className="mt-8 inline-flex rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-bold uppercase tracking-wider hover:opacity-90 transition"
          >
            Contactez-nous
          </Link>
        </div>
      </section>

      {/* COURSES */}
      <section id="cours" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-4xl md:text-5xl tracking-wide">Tous nos cours</h2>
            <p className="mt-3 text-muted-foreground">Des programmes adaptés à tous les niveaux, du débutant à l'expert.</p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <article
                key={cat.title}
                className="group relative overflow-hidden rounded-xl bg-card border border-border/60 p-7 hover:border-primary transition"
              >
                <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-primary/10 blur-3xl group-hover:bg-primary/20 transition" />
                <h3 className="relative font-display text-2xl tracking-wide text-secondary uppercase">{cat.title}</h3>
                <ul className="relative mt-5 space-y-3">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <span className="w-6 h-6 grid place-items-center rounded-full bg-primary/15 text-primary">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PLAN */}
      <section className="py-20 border-t border-border/40 bg-card/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <p className="uppercase tracking-[0.4em] text-primary text-xs font-semibold">Nos locaux</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl tracking-wide">Plan de l'académie</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Studios de danse, salle de gym, vestiaires, réception — un espace conçu pour votre confort.
            </p>
          </div>
          <div className="mt-10 rounded-2xl overflow-hidden border border-border shadow-2xl">
            <img src={planImg} alt="Plan de l'académie" width={1600} height={1024} loading="lazy" className="w-full h-auto" />
          </div>
        </div>
      </section>
    </>
  );
}
