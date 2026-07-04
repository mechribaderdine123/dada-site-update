import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";
import event4 from "@/assets/event-4.jpg";
import event5 from "@/assets/event-5.jpg";
import { useContent } from "@/lib/site-content";
import { useWorkshops, WORKSHOP_CATEGORIES } from "@/lib/workshops";

export const Route = createFileRoute("/workshops")({
  head: () => ({
    meta: [
      { title: "Workshops & Événements — Dada Hip Hop Academy" },
      { name: "description", content: "Découvrez nos prochains workshops et événements : dance, master class, battles, ateliers musique et création digitale." },
      { property: "og:title", content: "Workshops & Événements — Dada Hip Hop Academy" },
      { property: "og:description", content: "Prochains workshops et événements hip hop à Dada." },
    ],
  }),
  component: WorkshopsPage,
});

const CATEGORIES = ["Tous", ...WORKSHOP_CATEGORIES] as const;
type Category = (typeof CATEGORIES)[number];

const DEFAULT_EVENTS = [
  { id: "d1", image_url: event1, month: "Nov", day: "12", name: "Urban Night Live", category: "Dance", description: "Notre studio professionnel est ouvert aux chanteurs, rappeurs, danseurs, beatmakers et créateurs de contenu.", place: "Dada Studio", time: "08:00 pm" },
  { id: "d2", image_url: event2, month: "Nov", day: "18", name: "Cypher Battle", category: "Battles et spectacles", description: "Notre studio professionnel est ouvert aux chanteurs, rappeurs, danseurs, beatmakers et créateurs de contenu.", place: "Salle principale", time: "08:00 pm" },
  { id: "d3", image_url: event3, month: "Nov", day: "22", name: "Master Class Live", category: "Master class", description: "Notre studio professionnel est ouvert aux chanteurs, rappeurs, danseurs, beatmakers et créateurs de contenu.", place: "Studio A", time: "08:00 pm" },
  { id: "d4", image_url: event4, month: "Dec", day: "05", name: "Family Groove Night", category: "Activités spéciales pour les clubs et les familles", description: "Notre studio professionnel est ouvert aux chanteurs, rappeurs, danseurs, beatmakers et créateurs de contenu.", place: "Dada Hall", time: "08:00 pm" },
  { id: "d5", image_url: event5, month: "Dec", day: "12", name: "Beatmakers Session", category: "Ateliers musique & création digitale", description: "Notre studio professionnel est ouvert aux chanteurs, rappeurs, danseurs, beatmakers et créateurs de contenu.", place: "Studio B", time: "08:00 pm" },
];

function WorkshopsPage() {
  const [category, setCategory] = useState<Category>("Tous");
  const [open, setOpen] = useState(false);
  const title1 = useContent("workshops.title1", "WORKSHOPS &");
  const title2 = useContent("workshops.title2", "ÉVÉNEMENTS");
  const intro = useContent("workshops.intro", "Notre studio professionnel est ouvert aux chanteurs, rappeurs, danseurs, beatmakers et créateurs de contenu. Il permet d'enregistrer, produire, mixer, filmer et expérimenter dans un cadre moderne.");
  const section = useContent("workshops.section", "PROCHAINS EVENEMENTS");

  const { workshops, loading } = useWorkshops();
  const source = workshops;
  const events = category === "Tous" ? source : source.filter((e) => e.category === category);

  return (
    <div className="pt-32 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="font-display tracking-wider text-5xl md:text-7xl leading-[0.9]">
            {title1}
            <br />
            {title2}
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-muted-foreground">{intro}</p>
        </header>

        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <h2 className="font-display tracking-widest text-xl md:text-2xl">
            {section.split(" ")[0]} <span className="text-primary">{section.split(" ").slice(1).join(" ")}</span>
          </h2>

          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="min-w-[280px] flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-5 py-3 text-left shadow-sm"
            >
              <span>{category}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-2 w-[420px] max-w-[90vw] rounded-2xl border border-border bg-background shadow-xl p-2 z-20">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategory(c); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-muted ${
                      category === c ? "text-primary" : ""
                    }`}
                  >
                    <span className="w-4 h-4 rounded-sm bg-primary/20 shrink-0" />
                    <span>{c}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <ul className="space-y-5">
          {events.map((e) => {
            const finished = Boolean((e as { is_finished?: boolean }).is_finished);
            return (
            <li
              key={e.id}
              className={`rounded-2xl border border-border bg-card p-3 md:p-4 flex flex-col md:flex-row gap-4 md:gap-6 shadow-sm hover:shadow-md transition-shadow ${finished ? "opacity-70" : ""}`}
            >
              <div className="relative w-full md:w-56 h-48 md:h-44 shrink-0 rounded-xl overflow-hidden">
                <img
                  src={e.image_url}
                  alt={e.name}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className={`w-full h-full object-cover ${finished ? "grayscale" : ""}`}
                />
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-md px-2 py-1 text-center leading-none font-display tracking-wider">
                  <div className="text-[10px]">{e.month}</div>
                  <div className="text-xl">{e.day}</div>
                </div>
                {finished && (
                  <div className="absolute top-2 right-2 bg-foreground text-background rounded-md px-2 py-1 text-[10px] uppercase tracking-widest font-semibold">
                    Terminé
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display tracking-wider text-2xl md:text-3xl">{e.name}</h3>
                  {finished && (
                    <span className="text-[10px] uppercase tracking-widest bg-muted text-muted-foreground px-2 py-1 rounded font-semibold">
                      Événement terminé
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{e.category}</p>
                <p className="mt-3 text-sm md:text-base text-foreground/80">
                  {e.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm">
                  <span>place : <span className="text-muted-foreground">{e.place}</span></span>
                  <span>time : <span className="text-muted-foreground">{e.time}</span></span>
                </div>
              </div>
            </li>
            );
          })}
        </ul>

        {events.length === 0 && (
          <p className="text-center text-muted-foreground py-16">
            Aucun événement dans cette catégorie pour le moment.
          </p>
        )}
      </div>
    </div>
  );
}
