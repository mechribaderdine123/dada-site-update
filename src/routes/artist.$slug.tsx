import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Facebook,
  Instagram,
  Music2,
  Play,
  Share2,
  Twitter,
  User,
  Youtube,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signedMusicUrl } from "@/lib/music-url";

export const Route = createFileRoute("/artist/$slug")({ component: ArtistPublicProfile });
type Artist = {
  id: string;
  artist_name: string;
  slug: string;
  genre: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  accent_color: string | null;
  youtube: string | null;
  spotify: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  twitter: string | null;
};
type Track = {
  id: string;
  title: string;
  genre: string | null;
  cover_url: string | null;
  audio_url: string | null;
};
type Video = { id: string; title: string; youtube_url: string };

function youtubeEmbed(url: string) {
  const found = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return found ? `https://www.youtube-nocookie.com/embed/${found[1]}` : null;
}
function ArtistPublicProfile() {
  const { slug } = Route.useParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: publicData } = await supabase
        .from("public_profiles")
        .select(
          "id,artist_name,slug,genre,city,bio,avatar_url,cover_url,accent_color,youtube,spotify,facebook,instagram,tiktok,twitter",
        )
        .eq("slug", slug)
        .maybeSingle();
      // Admins can use this page for pending/rejected artists too, through existing profile RLS.
      const { data: privateData } = publicData
        ? { data: null }
        : await supabase
            .from("profiles")
            .select(
              "id,artist_name,slug,genre,city,bio,avatar_url,cover_url,accent_color,youtube,spotify,facebook,instagram,tiktok,twitter",
            )
            .eq("slug", slug)
            .maybeSingle();
      const data = publicData ?? privateData;
      if (!data || !alive) {
        setLoading(false);
        return;
      }
      const p = data as Artist;
      const isPublic = !!publicData;
      const [avatar_url, cover_url, trackResult, videoResult] = await Promise.all([
        signedMusicUrl(p.avatar_url),
        signedMusicUrl(p.cover_url),
        isPublic
          ? supabase
              .from("tracks")
              .select("id,title,genre,cover_url,audio_url")
              .eq("user_id", p.id)
              .eq("status", "approved")
              .order("created_at", { ascending: false })
          : supabase
              .from("tracks")
              .select("id,title,genre,cover_url,audio_url")
              .eq("user_id", p.id)
              .order("created_at", { ascending: false }),
        supabase
          .from("artist_videos")
          .select("id,title,youtube_url")
          .eq("user_id", p.id)
          .order("created_at", { ascending: false }),
      ]);
      const resolvedTracks = await Promise.all(
        ((trackResult.data ?? []) as Track[]).map(async (track) => ({
          ...track,
          cover_url: await signedMusicUrl(track.cover_url),
          audio_url: await signedMusicUrl(track.audio_url),
        })),
      );
      if (alive) {
        setArtist({ ...p, avatar_url, cover_url });
        setTracks(resolvedTracks);
        setVideos((videoResult.data ?? []) as Video[]);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);
  const accent = artist?.accent_color || "#6fffdc";
  const background = "#0e0e0e";
  const surface = "#1c1b1b";
  const text = "#e5e2e1";
  const socials = useMemo(
    () =>
      artist
        ? [
            { label: "YouTube", url: artist.youtube, Icon: Youtube },
            { label: "Instagram", url: artist.instagram, Icon: Instagram },
            { label: "Facebook", url: artist.facebook, Icon: Facebook },
            { label: "X", url: artist.twitter, Icon: Twitter },
            { label: "Spotify", url: artist.spotify, Icon: Music2 },
          ].filter((item) => item.url)
        : [],
    [artist],
  );
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: artist?.artist_name, url });
    else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1600);
    }
  };
  if (loading)
    return (
      <div className="min-h-screen bg-[#0e0e0e] grid place-items-center text-white/65">
        Chargement…
      </div>
    );
  if (!artist)
    return (
      <div className="min-h-screen bg-[#0e0e0e] grid place-items-center text-white">
        <div className="text-center">
          <p className="text-xl">Artiste introuvable.</p>
          <Link to="/dada-reseaux-artist" className="mt-4 inline-block text-[#6fffdc]">
            Voir les artistes
          </Link>
        </div>
      </div>
    );
  return (
    <div
      className="min-h-screen"
      style={
        {
          backgroundColor: background,
          color: text,
          "--artist-accent": accent,
          "--artist-surface": surface,
        } as React.CSSProperties
      }
    >
      <header
        className="relative z-20 flex h-20 items-center justify-between border-b border-white/5 px-5 md:px-8"
        style={{ backgroundColor: background }}
      >
        <Link
          to="/dada-reseaux-artist"
          className="font-display text-2xl tracking-wide"
          style={{ color: accent }}
        >
          DADAHIPHOP
        </Link>
        <nav className="hidden items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/55 sm:flex">
          <Link
            to="/dada-reseaux-artist"
            className="rounded px-3 py-2 hover:bg-white/5 hover:text-white"
          >
            Artistes
          </Link>
          <span className="rounded bg-white/5 px-3 py-2">Sons & playlists</span>
        </nav>
        <button
          onClick={share}
          className="rounded px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#00382d]"
          style={{ backgroundColor: accent }}
        >
          Partager
        </button>
      </header>
      <section
        className="relative h-[17rem] md:h-[23rem] overflow-hidden"
        style={{ backgroundColor: surface }}
      >
        {artist.cover_url && (
          <img src={artist.cover_url} alt="" className="h-full w-full object-cover opacity-75" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/35 to-black/25" />
        <div className="relative mx-auto max-w-7xl px-5 pt-6">
          <Link
            to="/dada-reseaux-artist"
            className="rounded-lg bg-black/35 px-3 py-2 text-xs uppercase tracking-wider text-white/80 backdrop-blur hover:text-white"
          >
            ← Artistes
          </Link>
        </div>
      </section>
      <div className="relative z-10 mx-auto -mt-24 max-w-7xl px-5 pb-16">
        <section
          className="rounded-xl border border-white/10 p-5 shadow-2xl backdrop-blur md:p-7"
          style={{ backgroundColor: surface }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-[#353534] md:h-40 md:w-40">
                {artist.avatar_url ? (
                  <img
                    src={artist.avatar_url}
                    alt={artist.artist_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="m-auto h-full w-14 text-white/35" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest">
                  <span
                    className="rounded px-2 py-1 text-[#00382d]"
                    style={{ backgroundColor: accent }}
                  >
                    Artiste officiel
                  </span>
                  {artist.genre && (
                    <span className="rounded bg-white/10 px-2 py-1 text-white/65">
                      {artist.genre}
                    </span>
                  )}
                </div>
                <h1 className="mt-3 font-display text-5xl uppercase leading-none md:text-7xl">
                  {artist.artist_name}
                </h1>
                <p className="mt-3 text-sm text-white/60">
                  {[artist.genre, artist.city].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={share}
                className="inline-flex h-11 items-center gap-2 rounded bg-white/10 px-4 text-sm font-bold hover:bg-white/15"
              >
                <Share2 className="w-4" />
                {shared ? "Lien copié" : "Partager"}
              </button>
            </div>
          </div>
        </section>
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <main className="min-w-0 lg:col-span-8">
            <Heading title="Musique" />
            <Link
              to="/artist/$slug/music"
              params={{ slug: artist.slug }}
              className="mt-4 flex items-center justify-between rounded-xl p-5 font-bold hover:brightness-110"
              style={{ backgroundColor: surface }}
            >
              <span>Listen to all music</span>
              <Music2 className="w-5" style={{ color: accent }} />
            </Link>
            <div className="mt-4 space-y-3">
              {tracks.length ? (
                tracks.map((track, index) => (
                  <article
                    key={track.id}
                    className="flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center"
                    style={{ backgroundColor: surface }}
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-[#353534] grid place-items-center">
                      {track.cover_url ? (
                        <img src={track.cover_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span style={{ color: accent }} className="font-bold">
                          0{index + 1}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl uppercase tracking-wide">
                        {track.title}
                      </h3>
                      <p className="text-xs text-white/55">
                        {track.genre || "Dada Hip Hop Academy"}
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
                <Empty text="Aucune musique publiée pour le moment." />
              )}
            </div>
            <div className="mt-10">
              <Heading title="Clips & performances" pink />{" "}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {videos.length ? (
                  videos.map((video) => {
                    const embed = youtubeEmbed(video.youtube_url);
                    return (
                      <article
                        key={video.id}
                        className="overflow-hidden rounded-xl"
                        style={{ backgroundColor: surface }}
                      >
                        <div className="aspect-video bg-black">
                          {embed ? (
                            <iframe
                              className="h-full w-full"
                              src={embed}
                              title={video.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <a
                              href={video.youtube_url}
                              target="_blank"
                              rel="noreferrer"
                              className="grid h-full place-items-center"
                              style={{ color: accent }}
                            >
                              <Play />
                            </a>
                          )}
                        </div>
                        <h3 className="p-4 font-display text-lg uppercase tracking-wide">
                          {video.title}
                        </h3>
                      </article>
                    );
                  })
                ) : (
                  <Empty text="Aucun clip ajouté pour le moment." />
                )}
              </div>
            </div>
          </main>
          <aside className="space-y-5 lg:col-span-4">
            <section className="rounded-xl p-6" style={{ backgroundColor: surface }}>
              <Heading title="À propos" />
              <p className="mt-4 whitespace-pre-wrap leading-relaxed text-white/65">
                {artist.bio || "Cet artiste n’a pas encore ajouté de biographie."}
              </p>
            </section>
            {socials.length > 0 && (
              <section className="rounded-xl p-6" style={{ backgroundColor: surface }}>
                <Heading title="Réseaux" />{" "}
                <div className="mt-4 space-y-2">
                  {socials.map(({ label, url, Icon }) => (
                    <a
                      key={label}
                      href={url!}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-lg bg-white/5 p-3 hover:bg-white/10"
                    >
                      <Icon className="w-5" style={{ color: accent }} />
                      <span className="flex-1 font-semibold">{label}</span>
                      <ExternalLink className="w-4 text-white/40" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
function Heading({ title, pink }: { title: string; pink?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-6 w-1 rounded"
        style={{ backgroundColor: pink ? "#ff4b89" : "var(--artist-accent)" }}
      />
      <h2 className="font-display text-2xl uppercase tracking-wide">{title}</h2>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="rounded-xl bg-[var(--artist-surface)] p-6 text-sm text-white/55">{text}</p>;
}
