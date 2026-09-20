import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Music2, Play } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { signedMusicUrl } from "@/lib/music-url";

export const Route = createFileRoute("/artist/my-music")({ component: MyMusicPage });
type Track = {
  id: string;
  title: string;
  genre: string | null;
  cover_url: string | null;
  audio_url: string | null;
  status: string;
};

function MyMusicPage() {
  const { profile } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  useEffect(() => {
    if (!profile) return;
    supabase
      .from("tracks")
      .select("id,title,genre,cover_url,audio_url,status")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .then(async ({ data }) =>
        setTracks(
          await Promise.all(
            ((data ?? []) as Track[]).map(async (track) => ({
              ...track,
              cover_url: await signedMusicUrl(track.cover_url),
              audio_url: await signedMusicUrl(track.audio_url),
            })),
          ),
        ),
      );
  }, [profile?.id]);
  if (!profile) return null;
  const accent = profile.accent_color || "#00e5bf",
    background = "#0b0b0b",
    surface = "#1c1c1c",
    text = "#e5e2e1";
  return (
    <div className="min-h-screen" style={{ backgroundColor: background, color: text }}>
      <header
        className="flex h-20 items-center justify-between border-b border-white/10 px-5 md:px-8"
        style={{ backgroundColor: background }}
      >
        <Link to="/artist" className="font-display text-2xl" style={{ color: accent }}>
          DADAHIPHOP
        </Link>
        <Link
          to="/artist/edit"
          className="rounded px-4 py-2 text-xs font-bold uppercase text-[#00382d]"
          style={{ backgroundColor: accent }}
        >
          Manage music
        </Link>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-10">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
          Artist profile
        </p>
        <h1 className="mt-2 font-display text-5xl uppercase">My music</h1>
        <p className="mt-2 text-sm text-white/60">
          All of your tracks, including tracks waiting for review.
        </p>
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
                  <p className="text-xs text-white/55">
                    {track.genre || "No genre"} ·{" "}
                    {track.status === "approved" ? "Published" : "Pending review"}
                  </p>
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
              <p className="mt-3">No music yet.</p>
              <Link
                to="/artist/edit"
                hash="music"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold"
                style={{ color: accent }}
              >
                <Play className="w-4" />
                Upload your first MP3
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
