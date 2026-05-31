import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import heroDancers from "@/assets/hero-dancers.jpg";
import artistPortrait from "@/assets/artist-portrait.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dada Réseaux Artist — Hip Hop Academy" },
      { name: "description", content: "Un espace conçu pour vous mettre en lumière. Rejoignez la plateforme artistique de Dada Hip Hop Academy." },
      { property: "og:title", content: "Dada Réseaux Artist — Hip Hop Academy" },
      { property: "og:description", content: "Un espace conçu pour vous mettre en lumière." },
    ],
  }),
  component: Index,
});

const navLinks = ["Accueil", "À propos", "Studio Musique", "Workshops & Événements", "Communauté"];
const artists = [1, 2, 3, 4];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
          <div className="font-bold text-lg tracking-tight">Hip Hop Academy</div>
          <ul className="hidden md:flex items-center gap-8 text-sm text-foreground/80">
            {navLinks.map((l) => (
              <li key={l}><a href="#" className="hover:text-secondary transition-colors">{l}</a></li>
            ))}
          </ul>
          <a href="#signin" className="rounded-full bg-secondary text-secondary-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 transition">
            Dada Réseaux Artist
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative pt-20">
        <div className="relative h-[600px] overflow-hidden border-y-4 border-secondary">
          <img src={heroDancers} alt="Hip hop dancers" width={1920} height={1080} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/50" />
          <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight uppercase drop-shadow-2xl">
              Dada Reseaux Artist
            </h1>
            <p className="mt-4 text-lg md:text-xl font-semibold text-white/95">
              Un espace conçu pour vous mettre en lumière
            </p>
            <button className="mt-8 rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-bold hover:opacity-90 transition shadow-lg">
              Sign in artist
            </button>
          </div>
        </div>
      </section>

      {/* Discover */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-4xl md:text-5xl font-black uppercase tracking-tight">
            Decouvrer <span className="text-primary">Nos Artist</span>
          </h2>

          <div className="mt-10 flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="search artist"
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-transparent border border-border focus:border-secondary outline-none transition"
              />
            </div>
          </div>

          <h3 className="mt-14 text-xl font-bold">Featured Artist</h3>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {artists.map((i) => (
              <div key={i} className="group cursor-pointer">
                <div className="aspect-square overflow-hidden rounded-2xl bg-card">
                  <img src={artistPortrait} alt="Artist" width={400} height={400} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="mt-3">
                  <p className="font-bold text-lg">Artist name</p>
                  <p className="text-sm text-muted-foreground">under ground</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button className="rounded-md bg-primary text-primary-foreground px-5 py-2 text-sm font-bold hover:opacity-90 transition">
              See all
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6 overflow-hidden border-t-4 border-secondary">
        <div className="absolute inset-0" style={{ background: "var(--glow-teal)" }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-block rounded-full bg-secondary text-secondary-foreground px-8 py-3 font-bold text-lg shadow-lg">
            Créer votre Profil Artistique
          </div>
          <p className="mt-6 text-sm md:text-base text-foreground/80 max-w-xl mx-auto leading-relaxed">
            Rejoignez la plateforme artistique de Dada Hip Hop Academy et partagez votre univers.
            Décrivez votre style, présentez vos œuvres, ajoutez vos liens sociaux et construisez votre présence professionnelle.
          </p>
          <button className="mt-8 rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-bold hover:opacity-90 transition shadow-lg">
            Sign in artist
          </button>
        </div>
      </section>
    </div>
  );
}
