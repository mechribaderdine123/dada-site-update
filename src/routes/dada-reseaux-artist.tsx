import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import heroAsset from "@/assets/dada-hero-new.png.asset.json";
import artistPortrait from "@/assets/artist-portrait.png";

export const Route = createFileRoute("/dada-reseaux-artist")({
  head: () => ({
    meta: [
      { title: "Dada Réseaux Artist — Dada Hip Hop Academy" },
      { name: "description", content: "Espace dédié aux artistes de Dada Hip Hop Academy. Découvrez, partagez et mettez en lumière votre talent." },
    ],
  }),
  component: DadaReseauxArtistPage,
});

function DadaReseauxArtistPage() {
  const [search, setSearch] = useState("");

  const artists = [
    { id: 1, name: "Artist name", genre: "under ground", image: artistPortrait },
    { id: 2, name: "Artist name", genre: "under ground", image: artistPortrait },
    { id: 3, name: "Artist name", genre: "under ground", image: artistPortrait },
    { id: 4, name: "Artist name", genre: "under ground", image: artistPortrait },
  ];

  const filtered = artists.filter(
    (a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.genre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Hero */}
      <section className="relative h-[75vh] min-h-[520px] w-full overflow-hidden">
        <img
          src={heroAsset.url}
          alt="Danseurs Dada Hip Hop Academy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#1a1a1a]" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 pt-24">
          <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.9] tracking-wide text-white drop-shadow-2xl">
            DADA RESEAUX ARTIST
          </h1>
          <p className="mt-6 text-lg md:text-2xl font-medium text-white/90 max-w-2xl">
            Un espace conçu pour vous mettre en lumière
          </p>
          <Link
            to="/sign-in"
            className="mt-8 rounded-md bg-primary text-primary-foreground px-8 py-3 text-sm font-semibold hover:opacity-90 transition"
          >
            Sign in artist
          </Link>
        </div>
      </section>

      {/* Artists section */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center font-display text-4xl md:text-6xl tracking-wide">
            DECOUVRER <span className="text-primary">NOS ARTIST</span>
          </h2>

          <div className="mt-10 flex justify-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="search artist"
                className="w-full h-14 pl-12 pr-4 rounded-full bg-transparent border border-white/30 text-white placeholder:text-white/50 outline-none focus:border-primary transition"
              />
            </div>
          </div>

          <h3 className="mt-12 font-semibold text-lg text-white/90">Featured Artist</h3>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((artist) => (
              <div key={artist.id} className="group cursor-pointer">
                <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-white/10">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    width={400}
                    height={533}
                  />
                </div>
                <h4 className="mt-4 font-display text-2xl tracking-wide text-white">{artist.name}</h4>
                <p className="text-sm text-white/60">{artist.genre}</p>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="mt-12 text-center text-white/60">Aucun artiste trouvé.</p>
          )}
        </div>
      </section>
    </div>
  );
}
