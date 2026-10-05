import { createFileRoute } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { SiteContentProvider, useContent } from "@/lib/site-content";
import { loadSiteContent } from "@/lib/site-content.server";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Dada Hip Hop Academy" },
      {
        name: "description",
        content: "Contactez Dada Hip Hop Academy par téléphone, email ou sur nos réseaux sociaux.",
      },
    ],
  }),
  loader: () => loadSiteContent(),

  component: ContactPage,
});

function ContactPage() {
  return (
    <SiteContentProvider content={Route.useLoaderData()}>
      <ContactPageContent />
    </SiteContentProvider>
  );
}

function ContactPageContent() {
  const title = useContent("contact.title", "CONTACTEZ-NOUS");
  const intro = useContent(
    "contact.intro",
    "Pour toute demande d'information, d'inscription ou de collaboration, contactez-nous par téléphone ou directement sur nos réseaux sociaux.",
  );
  const fb = useContent("contact.facebook", "DADA HipHop Academy");
  const fbUrl = useContent(
    "contact.facebook.url",
    "https://www.facebook.com/profile.php?id=61585478522995",
  );
  const ig = useContent("contact.instagram", "dada.hiphop.academy");
  const igUrl = useContent(
    "contact.instagram.url",
    "https://www.instagram.com/dada.hiphop.academy/",
  );
  const email = useContent("contact.email", "contact.dadahiphop@gmail.com");
  const phone = useContent("contact.phone", "97 800 464");
  const address = useContent("contact.address", "Tunis, Tunisie");

  const rows = [
    {
      icon: <Facebook className="w-5 h-5" />,
      label: "Facebook",
      value: fb,
      href: fbUrl,
      tone: "primary" as const,
    },
    {
      icon: <Instagram className="w-5 h-5" />,
      label: "Instagram",
      value: ig,
      href: igUrl,
      tone: "secondary" as const,
    },
    {
      icon: <Mail className="w-5 h-5" />,
      label: "Email",
      value: email,
      href: `mailto:${email}`,
      tone: "primary" as const,
    },
    {
      icon: <Phone className="w-5 h-5" />,
      label: "Téléphone",
      value: phone,
      href: `tel:${phone.replace(/\s/g, "")}`,
      tone: "secondary" as const,
    },
  ];

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl md:text-6xl tracking-wide text-foreground">
            {title}
          </h1>
          <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            {intro}
          </p>
        </div>

        <div className="rounded-2xl border border-border p-6 md:p-8 space-y-4">
          {rows.map((row) => {
            const Wrapper: React.ElementType = row.href ? "a" : "div";
            const props = row.href
              ? {
                  href: row.href,
                  target: row.href.startsWith("http") ? "_blank" : undefined,
                  rel: "noreferrer",
                }
              : {};
            return (
              <Wrapper
                key={row.label}
                {...props}
                className="flex items-center gap-4 rounded-xl border border-border p-4 hover:border-primary/60 transition"
              >
                <div
                  className={`w-12 h-12 shrink-0 grid place-items-center rounded-full ${row.tone === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/15 text-secondary"}`}
                >
                  {row.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{row.label}</p>
                  <p className="font-semibold truncate">{row.value}</p>
                </div>
              </Wrapper>
            );
          })}

          <div className="rounded-xl border border-border p-5 text-center">
            <p className="flex items-center justify-center gap-2 text-primary font-display tracking-wide">
              <MapPin className="w-4 h-4" /> ADRESSE
            </p>
            <p className="mt-1 font-semibold">{address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
