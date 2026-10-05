import { createFileRoute } from "@tanstack/react-router";
import { Mic, Music2, SlidersHorizontal, Building2, Video, GraduationCap } from "lucide-react";
import heroImage from "@/assets/dada-hero.jpg";
import { SiteContentProvider, useContent } from "@/lib/site-content";
import { loadSiteContent } from "@/lib/site-content.server";
import { useStudioServices, type StudioServiceIcon } from "@/lib/studio-services";
import { useStudioTags } from "@/lib/studio-tags";

export const Route = createFileRoute("/studio-musique")({
  head: () => ({
    meta: [
      { title: "Studio Musique — Dada Hip Hop Academy" },
      {
        name: "description",
        content:
          "Studio de création et production musicale : enregistrement vocal, mixage, tournage vidéo et coaching artistique.",
      },
    ],
  }),
  loader: () => loadSiteContent(),

  component: StudioMusiquePage,
});

const STUDIO_SERVICE_ICON_MAP: Record<StudioServiceIcon, React.ReactNode> = {
  mic: <Mic className="w-6 h-6" />,
  music: <Music2 className="w-6 h-6" />,
  sliders: <SlidersHorizontal className="w-6 h-6" />,
  building: <Building2 className="w-6 h-6" />,
  video: <Video className="w-6 h-6" />,
  graduation: <GraduationCap className="w-6 h-6" />,
};

function ServiceCard({
  title,
  description,
  icon,
  accent,
}: {
  title: string;
  description: string;
  icon: StudioServiceIcon;
  accent: "primary" | "secondary";
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div
        className={`w-12 h-12 grid place-items-center rounded-lg ${accent === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/15 text-secondary"}`}
      >
        {STUDIO_SERVICE_ICON_MAP[icon]}
      </div>
      <h3
        className={`mt-5 font-display text-2xl tracking-wide ${accent === "primary" ? "text-primary" : "text-secondary"}`}
      >
        {title}
      </h3>
      <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{description}</p>
    </article>
  );
}

function StudioMusiquePage() {
  return (
    <SiteContentProvider content={Route.useLoaderData()}>
      <StudioMusiquePageContent />
    </SiteContentProvider>
  );
}

function StudioMusiquePageContent() {
  const heroImg = useContent("studio.hero.image", heroImage);
  const title1 = useContent("studio.title1", "STUDIO MUSIQUE");
  const title2 = useContent("studio.title2", "CRÉATION & PRODUCTION");
  const intro = useContent(
    "studio.intro",
    "Notre studio professionnel est ouvert aux chanteurs, rappeurs, danseurs, beatmakers et créateurs de contenu. Il permet d'enregistrer, produire, mixer, filmer et expérimenter dans un cadre moderne.",
  );

  const servicesTitle1 = useContent("studio.services.title1", "NOS");
  const servicesTitle2 = useContent("studio.services.title2", "SERVICES");
  const servicesSub = useContent(
    "studio.services.sub",
    "Un accompagnement complet pour tous vos projets créatifs",
  );

  const pourquiTitle1 = useContent("studio.pourqui.title1", "POUR");
  const pourquiTitle2 = useContent("studio.pourqui.title2", "QUI ?");
  const pourquiSub = useContent(
    "studio.pourqui.sub",
    "Notre studio accueille tous les profils créatifs",
  );

  const { services, loading: servicesLoading } = useStudioServices();
  const { tags, loading: tagsLoading } = useStudioTags();

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <div>
            <h1 className="font-display text-5xl md:text-6xl leading-[0.95] tracking-wide">
              {title1}
              <br />
              {title2}
            </h1>
            <p className="mt-5 text-foreground/85 leading-relaxed">{intro}</p>
          </div>
          <img
            src={heroImg}
            alt="Studio Musique Dada Hip Hop Academy"
            className="w-full rounded-2xl object-cover aspect-4/3"
            loading="lazy"
          />
        </div>

        <div className="mt-20">
          <h2 className="font-display text-3xl tracking-wide">
            {servicesTitle1} <span className="text-primary">{servicesTitle2}</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{servicesSub}</p>

          {servicesLoading ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm animate-pulse"
                >
                  <div className="w-12 h-12 rounded-lg bg-muted" />
                  <div className="mt-5 h-6 w-2/3 bg-muted rounded" />
                  <div className="mt-3 h-4 w-full bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">Aucun service pour le moment.</p>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map((s, i) => (
                <ServiceCard
                  key={s.id}
                  title={s.title}
                  description={s.description}
                  icon={s.icon}
                  accent={i % 2 === 0 ? "primary" : "secondary"}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-20 text-center">
          <h2 className="font-display text-3xl tracking-wide">
            {pourquiTitle1} <span className="text-primary">{pourquiTitle2}</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{pourquiSub}</p>

          {tagsLoading ? (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-11 w-28 rounded-full bg-muted animate-pulse" />
              ))}
            </div>
          ) : tags.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">Aucun profil pour le moment.</p>
          ) : (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {tags.map((t) => (
                <span
                  key={t.id}
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
                >
                  {t.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
