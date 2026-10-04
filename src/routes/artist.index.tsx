import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink, Music2, Play, Share2, User, Youtube } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { signedMusicUrl } from "@/lib/music-url";
import logo from "@/assets/dada-logo.png";

export const Route = createFileRoute("/artist/")({ component: ArtistPage });
type Track = {
  id: string;
  title: string;
  genre: string | null;
  cover_url: string | null;
  audio_url: string | null;
  status: string;
};
type Video = { id: string; title: string; youtube_url: string };
const youtubeEmbed = (url: string) => {
  const id = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/)?.[1];
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
};

function ArtistPage() {
  const { profile } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!profile) return;
    Promise.all([
      signedMusicUrl(profile.avatar_url),
      signedMusicUrl(profile.cover_url),
      supabase
        .from("tracks")
        .select("id,title,genre,cover_url,audio_url,status")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("artist_videos")
        .select("id,title,youtube_url")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false }),
    ]).then(async ([a, c, tracksResult, videosResult]) => {
      setAvatar(a);
      setCover(c);
      setVideos((videosResult.data ?? []) as Video[]);
      setTracks(
        await Promise.all(
          ((tracksResult.data ?? []) as Track[]).map(async (track) => ({
            ...track,
            cover_url: await signedMusicUrl(track.cover_url),
            audio_url: await signedMusicUrl(track.audio_url),
          })),
        ),
      );
    });
  }, [profile]);
  if (!profile) return null;
  const accent = profile.accent_color || "#6fffdc";
  const background = "#0e0e0e";
  const surface = "#1c1b1b";
  const text = "#e5e2e1";
  const publicUrl = `${window.location.origin}/artist/${profile.slug}`;
  const copy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
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
        <Link to="/artist" className="flex items-center">
          <img
            src={logo}
            alt="Dada Hip Hop Academy"
            className="h-9 w-auto md:h-11"
            fetchPriority="high"
          />
        </Link>
        <Link
          to="/artist/edit"
          className="rounded px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#00382d]"
          style={{ backgroundColor: accent }}
        >
          Edit profile
        </Link>
      </header>
      <section
        className="relative h-64 overflow-hidden md:h-80"
        style={{ backgroundColor: surface }}
      >
        {cover && <img src={cover} alt="" className="h-full w-full object-cover opacity-75" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/35 to-black/25" />
        <div className="relative mx-auto flex max-w-7xl justify-end px-5 pt-6">
          <Link
            to="/artist/edit"
            className="rounded-lg bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-white/15"
          >
            Edit profile
          </Link>
        </div>
      </section>
      <div className="relative z-10 mx-auto -mt-20 max-w-7xl px-5 pb-16">
        <section
          className="rounded-xl border border-white/10 p-5 shadow-2xl backdrop-blur md:p-7"
          style={{ backgroundColor: surface }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="h-28 w-28 overflow-hidden rounded-xl bg-[#353534] md:h-36 md:w-36">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={profile.artist_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="m-auto h-full w-12 text-white/30" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-widest">
                  <span
                    className="rounded px-2 py-1 text-[#00382d]"
                    style={{ backgroundColor: accent }}
                  >
                    Mon profil
                  </span>
                  {profile.genre && (
                    <span className="rounded bg-white/10 px-2 py-1 text-white/65">
                      {profile.genre}
                    </span>
                  )}
                </div>
                <h1 className="mt-3 font-display text-5xl uppercase leading-none md:text-6xl">
                  {profile.artist_name}
                </h1>
                <p className="mt-2 text-sm text-white/60">
                  {[profile.genre, profile.city].filter(Boolean).join(" · ") ||
                    "Complétez votre profil"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={copy}
                className="inline-flex h-11 items-center gap-2 rounded bg-white/10 px-4 text-sm font-bold hover:bg-white/15"
              >
                <Share2 className="w-4" />
                {copied ? "Link copied" : "Share"}
              </button>
            </div>
          </div>
        </section>
        {/* On phones the grid below stacks, which would drop About to the very
            bottom of a long page. Render it here instead so it sits directly
            under the avatar and cover; lg keeps the original sidebar copy. */}
        <div className="mt-5 lg:hidden">
          <AboutCard
            bio={profile.bio ?? ""}
            slug={profile.slug}
            publicUrl={publicUrl}
            accent={accent}
            surface={surface}
          />
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <main className="lg:col-span-8">
            <Title>My music</Title>
            <div className="mt-4 space-y-3">
              {/* Inline track list is temporarily disabled; the link below is shown instead. */}
              {/* eslint-disable-next-line no-constant-condition */}
              {false ? (
                tracks.map((track, i) => (
                  <article
                    key={track.id}
                    className="flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center"
                    style={{ backgroundColor: surface }}
                  >
                    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded bg-[#353534]">
                      {track.cover_url ? (
                        <img src={track.cover_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span style={{ color: accent }}>0{i + 1}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl uppercase">{track.title}</h3>
                      <p className="text-xs text-white/50">
                        {track.genre || "Dada Hip Hop Academy"} ·{" "}
                        {track.status === "approved" ? "Published" : "Pending review"}
                      </p>
                      {track.audio_url && (
                        <audio
                          controls
                          src={track.audio_url}
                          preload="none"
                          className="mt-3 h-9 w-full"
                        />
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <Link
                  to="/artist/edit"
                  hash="music"
                  className="flex items-center justify-between rounded-xl p-5 font-bold hover:brightness-110"
                  style={{ backgroundColor: surface }}
                >
                  <span>Add and listen to your tracks in Edit profile.</span>
                  <Music2 className="w-5" style={{ color: accent }} />
                </Link>
              )}
            </div>
            <div className="mt-10">
              <Title pink>Clips</Title>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {videos.length ? (
                  videos.map((video) => (
                    <article
                      key={video.id}
                      className="overflow-hidden rounded-xl"
                      style={{ backgroundColor: surface }}
                    >
                      <div className="aspect-video bg-black">
                        {youtubeEmbed(video.youtube_url) ? (
                          <iframe
                            className="h-full w-full"
                            src={youtubeEmbed(video.youtube_url)!}
                            title={video.title}
                            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <a
                            href={video.youtube_url}
                            target="_blank"
                            rel="noreferrer"
                            className="grid h-full place-items-center"
                          >
                            <Play style={{ color: accent }} />
                          </a>
                        )}
                      </div>
                      <h3 className="p-4 font-display text-lg uppercase">{video.title}</h3>
                    </article>
                  ))
                ) : (
                  <Empty>Add YouTube clips from Music.</Empty>
                )}
              </div>
            </div>
          </main>
          <aside className="hidden lg:col-span-4 lg:block">
            <AboutCard
              bio={profile.bio ?? ""}
              slug={profile.slug}
              publicUrl={publicUrl}
              accent={accent}
              surface={surface}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
function AboutCard({
  bio,
  slug,
  publicUrl,
  accent,
  surface,
}: {
  bio: string;
  slug: string;
  publicUrl: string;
  accent: string;
  surface: string;
}) {
  return (
    <section className="rounded-xl p-6" style={{ backgroundColor: surface }}>
      <Title>About</Title>
      <p className="mt-4 whitespace-pre-wrap leading-relaxed text-white/65">
        {bio || "Add your artist biography from Edit profile."}
      </p>
      <a
        href={publicUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center gap-2 text-sm hover:underline"
        style={{ color: accent }}
      >
        <ExternalLink className="w-4" /> dadahiphop.com/artist/{slug}
      </a>
    </section>
  );
}
function Title({ children, pink }: { children: React.ReactNode; pink?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-6 w-1 rounded"
        style={{ backgroundColor: pink ? "#ff4b89" : "var(--artist-accent)" }}
      />
      <h2 className="font-display text-2xl uppercase tracking-wide">{children}</h2>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-[var(--artist-surface)] p-6 text-sm text-white/55">{children}</p>
  );
}
