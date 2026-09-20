import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Music2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signedMusicUrl } from "@/lib/music-url";

export const Route = createFileRoute("/artist/$slug/music")({ component: PublicMusicPage });
type Artist = { id: string; artist_name: string; slug: string; accent_color: string | null };
type Track = {
  id: string;
  title: string;
  genre: string | null;
  cover_url: string | null;
  audio_url: string | null;
};

function PublicMusicPage() {
  const { slug } = Route.useParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("public_profiles")
        .select("id,artist_name,slug,accent_color")
        .eq("slug", slug)
        .maybeSingle();
      if (!alive) return;
      if (!data) {
        setLoading(false);
        return;
      }
      const current = data as Artist;
      setArtist(current);
      const { data: list } = await supabase
        .from("tracks")
        .select("id,title,genre,cover_url,audio_url")
        .eq("user_id", current.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      const resolved = await Promise.all(
        ((list ?? []) as Track[]).map(async (track) => ({
          ...track,
          cover_url: await signedMusicUrl(track.cover_url),
          audio_url: await signedMusicUrl(track.audio_url),
        })),
      );
      if (!alive) return;
      setTracks(resolved);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [slug]);
  const accent = artist?.accent_color || "#00e5bf",
    background = "#0b0b0b",
    surface = "#1c1c1c",
    text = "#e5e2e1";
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center bg-[#0b0b0b] text-white/60">
        Chargement…
      </div>
    );
  if (!artist)
    return (
      <div className="grid min-h-screen place-items-center bg-[#0b0b0b] text-white/60">
        Artist not found.
      </div>
    );
  return (
    <div className="min-h-screen" style={{ backgroundColor: background, color: text }}>
      <header
        className="flex h-20 items-center justify-between border-b border-white/10 px-5 md:px-8"
        style={{ backgroundColor: background }}
      >
        <Link
          to="/artist/$slug"
          params={{ slug }}
          className="font-display text-2xl"
          style={{ color: accent }}
        >
          DADAHIPHOP
        </Link>
        <Link
          to="/artist/$slug"
          params={{ slug }}
          className="text-xs font-bold uppercase text-white/65"
        >
          Artist profile
        </Link>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-10">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
          {artist.artist_name}
        </p>
        <h1 className="mt-2 font-display text-5xl uppercase">Music</h1>
        <p className="mt-2 text-sm text-white/60">Official published releases.</p>
        <div className="mt-8 space-y-3">
          {tracks.length ? (
            tracks.map((track, index) => (
              <article
                key={track.id}
                className="flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center"
                style={{ backgroundColor: surface }}
              >
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded bg-black/20">
                  {track.cover_url ? (
                    <img src={track.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span style={{ color: accent }}>0{index + 1}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-2xl uppercase">{track.title}</h2>
                  <p className="text-xs text-white/55">{track.genre || "Dada Hip Hop Academy"}</p>
                  {track.audio_url && (
                    <audio
                      controls
                      preload="none"
                      src={track.audio_url}
                      className="mt-3 h-9 w-full"
                    />
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: surface }}>
              <Music2 className="mx-auto h-8 w-8" style={{ color: accent }} />
              <p className="mt-3">No music has been published yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
