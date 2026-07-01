import { createFileRoute } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Dada Hip Hop Academy" },
      { name: "description", content: "Contactez Dada Hip Hop Academy par téléphone, email ou sur nos réseaux sociaux." },
    ],
  }),
  component: ContactPage,
});

type Row = {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  tone: "primary" | "secondary";
};

const ROWS: Row[] = [
  { icon: <Facebook className="w-5 h-5" />, label: "Facebook", value: "DADA HipHop Academy", href: "https://www.facebook.com/profile.php?id=61585478522995", tone: "primary" },
  { icon: <Instagram className="w-5 h-5" />, label: "Instagram", value: "dada.hiphop.academy1", href: "https://www.instagram.com/dada.hiphop.academy1/", tone: "secondary" },
  { icon: <Mail className="w-5 h-5" />, label: "Email", value: "contact.dadahiphop@gmail.com", href: "mailto:contact.dadahiphop@gmail.com", tone: "primary" },
  { icon: <Phone className="w-5 h-5" />, label: "Téléphone", value: "97 800 464", href: "tel:+21697800464", tone: "secondary" },
];

function ContactPage() {
  return (
    <div className="pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl md:text-6xl tracking-wide text-foreground">
            CONTACTEZ-NOUS
          </h1>
          <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Pour toute demande d'information, d'inscription ou de collaboration, contactez-nous par téléphone ou directement sur nos réseaux sociaux.
          </p>
        </div>

        <div className="rounded-2xl border border-border p-6 md:p-8 space-y-4">
          {ROWS.map((row) => {
            const Wrapper: React.ElementType = row.href ? "a" : "div";
            const props = row.href ? { href: row.href, target: row.href.startsWith("http") ? "_blank" : undefined, rel: "noreferrer" } : {};
            return (
              <Wrapper
                key={row.label}
                {...props}
                className="flex items-center gap-4 rounded-xl border border-border p-4 hover:border-primary/60 transition"
              >
                <div
                  className={`w-12 h-12 shrink-0 grid place-items-center rounded-full ${
                    row.tone === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/15 text-secondary"
                  }`}
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
            <p className="mt-1 font-semibold">Tunis, Tunisie</p>
          </div>
        </div>
      </div>
    </div>
  );
}
