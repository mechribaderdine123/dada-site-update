import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Phone, Youtube, Instagram, Facebook, Music as MusicIcon, ExternalLink } from "lucide-react";
import artistPortrait from "@/assets/artist-portrait.jpg";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { signedMusicUrl } from "@/lib/music-url";

export const Route = createFileRoute("/artist/")({
  head: () => ({
    meta: [
      { title: "Artist Profile — Dada Réseaux Artist" },
      { name: "description", content: "Profil d'artiste sur la plateforme Dada Hip Hop Academy." },
    ],
  }),
  component: ArtistPage,
});

type Track = {
  id: string; title: string; genre: string | null;
  cover_url: string | null; audio_url: string | null; status: string;
};

function ArtistPage() {
  const { profile } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    signedMusicUrl(profile?.avatar_url ?? null).then(setAvatar);
  }, [profile?.avatar_url]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("tracks")
      .select("id,title,genre,cover_url,audio_url,status")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        const list = (data as Track[]) ?? [];
        const resolved = await Promise.all(
          list.map(async (t) => ({
            ...t,
            cover_url: await signedMusicUrl(t.cover_url),
            audio_url: await signedMusicUrl(t.audio_url),
          })),
        );
        setTracks(resolved);
      });
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#393939] text-white">
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-[#393939] to-[#393939]" />
        <div className="relative max-w-6xl mx-auto px-6 pt-8 pb-12">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="inline-flex bg-white/10 backdrop-blur rounded-xl p-1.5 gap-1">
              <span className="px-6 py-2 rounded-lg text-sm font-semibold bg-secondary text-secondary-foreground">Home</span>
              <Link to="/artist/music" className="px-6 py-2 rounded-lg text-sm font-semibold text-white/70 hover:text-white transition">Music</Link>
            </div>
            <Link to="/artist/edit" className="rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90 transition shadow-lg">
              Edit profil
            </Link>
          </div>

          <div className="mt-8 grid md:grid-cols-[280px_1fr] gap-8 items-start">
            <div className="aspect-square w-full max-w-[280px] rounded-2xl overflow-hidden bg-black/30">
              <img src={avatar || artistPortrait} alt={profile.artist_name} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-4 text-white/90 leading-relaxed">
              <h1 className="text-3xl md:text-4xl font-black text-white">{profile.artist_name}</h1>
              <div className="flex flex-wrap gap-2 text-sm">
                {profile.genre && <span className="rounded-full bg-white/10 px-3 py-1">{profile.genre}</span>}
                {profile.city && <span className="rounded-full bg-white/10 px-3 py-1">{profile.city}</span>}
              </div>
              <p className="whitespace-pre-wrap">{profile.bio || "Ajoutez votre biographie depuis Profil."}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#393939] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black">Ma musique</h2>
          {tracks.length === 0 ? (
            <p className="mt-6 text-white/70">Aucun morceau pour le moment. <Link to="/artist/music" className="text-secondary hover:underline">Ajouter un morceau →</Link></p>
          ) : (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {tracks.slice(0, 6).map((t) => (
                <div key={t.id} className="group">
                  <div className="aspect-square overflow-hidden rounded-2xl bg-[#4a4a4a] grid place-items-center">
                    {t.cover_url ? (
                      <img src={t.cover_url} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <MusicIcon className="w-12 h-12 text-white/50" />
                    )}
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-2xl font-black">{t.title}</p>
                      <p className="text-sm text-white/60">
                        {t.genre || "—"}
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                          t.status === "approved" ? "bg-green-500/20 text-green-300" :
                          t.status === "rejected" ? "bg-red-500/20 text-red-300" :
                          "bg-yellow-500/20 text-yellow-200"
                        }`}>
                          {t.status === "approved" ? "Publié" : t.status === "rejected" ? "Refusé" : "En attente"}
                        </span>
                      </p>
                    </div>
                    {t.audio_url && (
                      <a href={t.audio_url} target="_blank" rel="noreferrer" className="text-secondary hover:opacity-70 mt-2" aria-label="Listen">
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-[#2d2d2d] py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-black">Réseaux sociaux</h3>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-white/90">
              {profile.youtube && <a href={profile.youtube} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-secondary transition"><Youtube className="w-5 h-5 text-primary" /> YouTube</a>}
              {profile.facebook && <a href={profile.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-secondary transition"><Facebook className="w-5 h-5 text-secondary" /> Facebook</a>}
              {profile.instagram && <a href={profile.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-secondary transition"><Instagram className="w-5 h-5 text-primary" /> Instagram</a>}
              {profile.spotify && <a href={profile.spotify} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-secondary transition">🎵 Spotify</a>}
            </div>
          </div>
          <div className="md:text-right">
            <h3 className="text-2xl font-black">Contact</h3>
            <div className="mt-6 space-y-3 text-sm text-white/90">
              <div className="flex items-center gap-3 md:justify-end"><Mail className="w-5 h-5 text-primary" /> {profile.email}</div>
              {profile.phone && <div className="flex items-center gap-3 md:justify-end"><Phone className="w-5 h-5 text-secondary" /> {profile.phone}</div>}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
