import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, Youtube, Instagram, Facebook, Music as MusicIcon, ExternalLink } from "lucide-react";
import artistPortrait from "@/assets/artist-portrait.jpg";
import album1 from "@/assets/album-1.jpg";
import album2 from "@/assets/album-2.jpg";
import album3 from "@/assets/album-3.jpg";
import { useTracks, useAlbums, useBlobUrl } from "@/lib/music-store";

export const Route = createFileRoute("/artist/")({
  head: () => ({
    meta: [
      { title: "Artist Profile — Dada Réseaux Artist" },
      { name: "description", content: "Profil d'artiste sur la plateforme Dada Hip Hop Academy." },
    ],
  }),
  component: ArtistPage,
});

const bio = "An artist who transforms simple ideas into expressive visual stories, blending emotion, texture, and modern aesthetics. Their work explores connection, identity, and the beauty hidden in everyday moments.";

const fallbackFeatured = [
  { img: album1, title: "Album name", subtitle: "album 2025" },
  { img: album2, title: "Track name", subtitle: "album 2025" },
  { img: album3, title: "Album name", subtitle: "album 2025" },
];


function ArtistPage() {
  const [tab, setTab] = useState<"home" | "music">("home");
  const tracks = useTracks();
  const albums = useAlbums();

  // Build featured items from user content; fallback to defaults if empty
  const userItems = [
    ...albums.map((a) => ({ id: a.id, img: a.cover, imgKey: a.coverKey, title: a.title, subtitle: `album ${a.year}`, link: undefined as string | undefined, linkKey: undefined as string | undefined })),
    ...tracks.map((t) => ({ id: t.id, img: t.cover, imgKey: t.coverKey, title: t.title, subtitle: t.genre, link: t.audioUrl, linkKey: t.audioKey })),
  ];
  const featured = userItems.length > 0 ? userItems.slice(0, 6) : fallbackFeatured.map((f, i) => ({ id: String(i), ...f, imgKey: undefined, link: undefined, linkKey: undefined }));


  return (
    <div className="min-h-screen bg-[#393939] text-white">
      {/* Top banner section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-[#393939] to-[#393939]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,oklch(0.75_0.12_195/0.4),transparent_70%)]" />
        <div className="relative max-w-6xl mx-auto px-6 pt-8 pb-12">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Tabs */}
            <div className="inline-flex bg-muted/60 backdrop-blur rounded-xl p-1.5 gap-1">
              <button
                onClick={() => setTab("home")}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
                  tab === "home" ? "bg-secondary text-secondary-foreground" : "text-white/70"
                }`}
              >
                Home
              </button>
              <Link
                to="/artist/discography"
                className="px-6 py-2 rounded-lg text-sm font-semibold text-white/70 hover:text-white transition"
              >
                Music
              </Link>
            </div>

            <Link
              to="/artist/edit"
              className="rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90 transition shadow-lg"
            >
              Edit profil
            </Link>
          </div>

          {/* Profile */}
          <div className="mt-8 grid md:grid-cols-[280px_1fr] gap-8 items-start">
            <div className="aspect-square w-full max-w-[280px] rounded-2xl overflow-hidden">
              <img src={artistPortrait} alt="Artist" width={560} height={560} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-4 text-foreground/90 leading-relaxed">
              <p>{bio}</p>
              <p>{bio}</p>
              <p>{bio}</p>
              <button className="text-secondary font-bold text-lg hover:underline">
                read full bio ...
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="bg-background py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black">{tab === "music" ? "Music" : "Featured"}</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((f) => (
              <FeaturedCard key={f.id} item={f} />
            ))}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/40 py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-black">Social media</h3>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <a className="flex items-center gap-3 hover:text-secondary transition"><Youtube className="w-5 h-5 text-primary" /> DADA_TN</a>
              <a className="flex items-center gap-3 hover:text-secondary transition"><Facebook className="w-5 h-5 text-secondary" /> DADA_TN</a>
              <a className="flex items-center gap-3 hover:text-secondary transition"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="oklch(0.7 0.18 150)"/></svg> DADA_TN</a>
              <a className="flex items-center gap-3 hover:text-secondary transition">🎵 DADA_TN</a>
              <a className="flex items-center gap-3 hover:text-secondary transition"><Instagram className="w-5 h-5 text-primary" /> DADA_TN</a>
            </div>
          </div>
          <div className="md:text-right">
            <h3 className="text-2xl font-black">Contact Information</h3>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-3 md:justify-end"><Mail className="w-5 h-5 text-primary" /> DADA_TN</div>
              <div className="flex items-center gap-3 md:justify-end"><Phone className="w-5 h-5 text-secondary" /> +216 22 222 222</div>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-border/50">
          <Link to="/" className="text-sm text-muted-foreground hover:text-secondary transition">← Back to home</Link>
        </div>
      </footer>
    </div>
  );
}

type FeaturedItem = {
  id: string;
  img?: string;
  imgKey?: string;
  title: string;
  subtitle: string;
  link?: string;
  linkKey?: string;
};

function FeaturedCard({ item }: { item: FeaturedItem }) {
  const img = useBlobUrl(item.imgKey, item.img);
  const audio = useBlobUrl(item.linkKey, item.link);
  return (
    <div className="group">
      <div className="aspect-square overflow-hidden rounded-2xl bg-card grid place-items-center">
        {img ? (
          <img src={img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <MusicIcon className="w-12 h-12 text-muted-foreground" />
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-2xl font-black">{item.title}</p>
          <p className="text-sm text-muted-foreground">{item.subtitle}</p>
        </div>
        {audio && (
          <a href={audio} target="_blank" rel="noreferrer" className="text-secondary hover:opacity-70 mt-2" aria-label="Listen">
            <ExternalLink className="w-5 h-5" />
          </a>
        )}
      </div>
    </div>
  );
}
