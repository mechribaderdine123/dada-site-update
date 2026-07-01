import { createFileRoute } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Dada Hip Hop Academy" },
      { name: "description", content: "Contactez Dada Hip Hop Academy pour toute demande d'information, d'inscription ou de collaboration." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <section className="pt-32 pb-20">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <p className="uppercase tracking-[0.4em] text-primary text-xs font-semibold">Restons en contact</p>
        <h1 className="mt-4 font-display text-6xl md:text-8xl tracking-wide">Contactez-nous</h1>
        <p className="mt-6 max-w-2xl mx-auto text-foreground/85 text-lg">
          Pour toute demande d'information, d'inscription ou de collaboration, contactez-nous par téléphone ou directement sur nos réseaux sociaux.
        </p>
      </div>

      <div className="mt-14 max-w-5xl mx-auto px-6 grid gap-6 md:grid-cols-2">
        <a
          href="https://www.facebook.com/profile.php?id=61585478522995"
          target="_blank"
          rel="noreferrer"
          className="group rounded-xl bg-card border border-border/60 p-8 hover:border-primary transition flex items-center gap-5"
        >
          <div className="w-14 h-14 grid place-items-center rounded-xl bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
            <Facebook className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Facebook</p>
            <p className="mt-1 font-display text-2xl tracking-wide">DADA HipHop Academy</p>
          </div>
        </a>

        <a
          href="https://www.instagram.com/dada.hiphop.academy1/"
          target="_blank"
          rel="noreferrer"
          className="group rounded-xl bg-card border border-border/60 p-8 hover:border-primary transition flex items-center gap-5"
        >
          <div className="w-14 h-14 grid place-items-center rounded-xl bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
            <Instagram className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Instagram</p>
            <p className="mt-1 font-display text-2xl tracking-wide">dada.hiphop.academy1</p>
          </div>
        </a>
      </div>

      <div className="mt-6 max-w-5xl mx-auto px-6 grid gap-6 md:grid-cols-3">
        <InfoCard icon={<Mail className="w-5 h-5" />} label="Email" value="contact.dadahiphop@gmail.com" href="mailto:contact.dadahiphop@gmail.com" />
        <InfoCard icon={<Phone className="w-5 h-5" />} label="Téléphone" value="97 800 464" href="tel:+21697800464" />
        <InfoCard icon={<MapPin className="w-5 h-5" />} label="Adresse" value="Tunis, Tunisie" />
      </div>
    </section>
  );
}

function InfoCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const inner = (
    <div className="rounded-xl bg-card border border-border/60 p-6 h-full hover:border-primary transition">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <p className="mt-3 font-semibold break-words">{value}</p>
    </div>
  );
  return href ? <a href={href} className="block">{inner}</a> : inner;
}
