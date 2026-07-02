import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Pencil, Play, SkipBack, SkipForward, Music as MusicIcon } from "lucide-react";
import { useTracks, useAlbums, useBlobUrl, resetMusicStore, type Track, type Album } from "@/lib/music-store";
import { DEMO_ALBUMS, DEMO_TRACKS, DEMO_ALBUM_TRACK_COUNT } from "@/lib/demo-music";

export const Route = createFileRoute("/artist/discography")({
  validateSearch: (s: Record<string, unknown>) => ({
    view: s.view === "public" ? ("public" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Music — Dada Réseaux Artist" },
      { name: "description", content: "Explore the full discography of the artist." },
    ],
  }),
  component: DiscographyPage,
});

type Filter = "all" | "albums" | "single";

function DiscographyPage() {
  useEffect(() => { resetMusicStore(); }, []);
  const userTracks = useTracks();
  const userAlbums = useAlbums();

  // Show demo content while the user hasn't added anything yet.
  const usingDemo = userAlbums.length === 0 && userTracks.length === 0;
  const albums = usingDemo ? DEMO_ALBUMS : userAlbums;
  const tracks = usingDemo ? DEMO_TRACKS : userTracks;

  const [filter, setFilter] = useState<Filter>("all");
  const [playing, setPlaying] = useState<Track | null>(null);

  const latest = albums[0];
  const latestTrackCount = useMemo(() => {
    if (!latest) return 0;
    if (usingDemo) return DEMO_ALBUM_TRACK_COUNT[latest.id] ?? 0;
    return tracks.filter((t) => t.albumId === latest.id).length;
  }, [latest, tracks, usingDemo]);


  const singles = useMemo(() => tracks.filter((t) => !t.albumId), [tracks]);
  const showAlbums = filter !== "single";
  const showSingles = filter !== "albums";

  return (
    <div className="min-h-screen bg-[#393939] text-white pb-28">
      {/* Top nav */}
      <header className="max-w-6xl mx-auto px-6 pt-6 flex items-center justify-between">
        <div className="inline-flex bg-white/10 backdrop-blur rounded-xl p-1.5 gap-1">
          <Link
            to="/artist"
            className="px-6 py-2 rounded-lg text-sm font-semibold text-white/70 hover:text-white"
          >
            Home
          </Link>
          <span className="px-6 py-2 rounded-lg text-sm font-semibold bg-secondary text-secondary-foreground">
            Music
          </span>
        </div>
        <Link
          to="/artist/edit"
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
        >
          <Pencil className="w-4 h-4 text-secondary" /> Edit
        </Link>
      </header>

      {/* Title */}
      <div className="max-w-6xl mx-auto px-6 mt-8 text-center">
        <h1 className="text-5xl md:text-6xl font-black">Music</h1>
        <p className="mt-3 text-secondary text-xl font-bold">
          Explore the full discography of the artist
        </p>
      </div>

      {/* Latest album hero */}
      {latest && (
        <section className="max-w-4xl mx-auto px-6 mt-12">
          <LatestAlbumHero album={latest} trackCount={latestTrackCount} />
        </section>
      )}

      {/* All music */}
      <section className="max-w-6xl mx-auto px-6 mt-16">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h2 className="text-3xl font-black">All Music</h2>
          <div className="inline-flex bg-white/10 rounded-xl p-1.5 gap-1">
            {(["all", "albums", "single"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                  filter === f
                    ? "bg-secondary text-secondary-foreground"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {showAlbums && (
          <div className="mt-8">
            {albums.length === 0 ? (
              <EmptyState label="No albums yet" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {albums.map((a) => (
                  <AlbumCard key={a.id} album={a} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Singles */}
      {showSingles && (
        <section className="max-w-6xl mx-auto px-6 mt-16">
          <h2 className="text-3xl font-black">Singles</h2>
          {singles.length === 0 ? (
            <div className="mt-6"><EmptyState label="No singles yet" /></div>
          ) : (
            <div className="mt-6 space-y-3">
              {singles.map((t, i) => (
                <SingleRow
                  key={t.id}
                  t={t}
                  index={i + 1}
                  isPlaying={playing?.id === t.id}
                  onPlay={() => setPlaying(t)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Sticky player */}
      {playing && <Player track={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}

function LatestAlbumHero({ album, trackCount }: { album: Album; trackCount: number }) {
  const cover = useBlobUrl(album.coverKey, album.cover);
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-8 items-center">
      <div className="aspect-square rounded-2xl overflow-hidden bg-[#4a4a4a] shadow-2xl">
        {cover ? (
          <img src={cover} alt={album.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-white/50">
            <MusicIcon className="w-16 h-16" />
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-black">Lastest Album</p>
        <p className="mt-1 text-3xl md:text-4xl font-black text-secondary">{album.title}</p>
        <p className="mt-2 text-white/80">{trackCount} track{trackCount !== 1 ? "s" : ""}</p>
        <div className="mt-5 flex gap-3 flex-wrap">
          <Link
            to="/artist/album/$albumId"
            params={{ albumId: album.id }}
            className="inline-flex items-center gap-2 rounded-xl bg-secondary text-secondary-foreground px-5 py-2.5 text-sm font-bold hover:opacity-90"
          >
            <Play className="w-4 h-4" /> Listen know
          </Link>
          <Link
            to="/artist/album/$albumId"
            params={{ albumId: album.id }}
            className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/20"
          >
            View tracklist
          </Link>
        </div>
      </div>
    </div>
  );
}

function AlbumCard({ album }: { album: Album }) {
  const cover = useBlobUrl(album.coverKey, album.cover);
  return (
    <Link
      to="/artist/album/$albumId"
      params={{ albumId: album.id }}
      className="group block"
    >
      <div className="aspect-square rounded-2xl overflow-hidden bg-[#4a4a4a]">
        {cover ? (
          <img
            src={cover}
            alt={album.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-white/50">
            <MusicIcon className="w-12 h-12" />
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-black truncate text-white">{album.title}</p>
      <p className="text-sm text-white/60">album {album.year}</p>
    </Link>
  );
}

function SingleRow({
  t,
  index,
  isPlaying,
  onPlay,
}: {
  t: Track;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const cover = useBlobUrl(t.coverKey, t.cover);
  return (
    <button
      onClick={onPlay}
      className={`w-full grid grid-cols-[32px_56px_1fr_auto] items-center gap-4 rounded-xl px-4 py-3 text-left transition ${
        isPlaying ? "bg-secondary/20 ring-1 ring-secondary" : "bg-white/10 hover:bg-white/20"
      }`}
    >
      <span className="text-sm text-white/60">{index}</span>
      <div className="w-14 h-14 rounded-lg bg-[#4a4a4a] overflow-hidden">
        {cover ? (
          <img src={cover} alt={t.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center">
            <MusicIcon className="w-5 h-5 text-white/50" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-bold truncate text-white">{t.title}</p>
        <p className="text-sm text-white/60 truncate">{t.genre}</p>
      </div>
      <span className="text-sm text-white/60 tabular-nums">—:—</span>
    </button>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/20 py-16 text-center text-white/60">
      {label}
    </div>
  );
}

function formatTime(s: number) {
  if (!isFinite(s)) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function Player({ track, onClose }: { track: Track; onClose: () => void }) {
  const audioUrl = useBlobUrl(track.audioKey, track.audioUrl);
  const cover = useBlobUrl(track.coverKey, track.cover);
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(true);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !audioUrl) return;
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [audioUrl]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) { el.play(); setPlaying(true); }
    else { el.pause(); setPlaying(false); }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#2d2d2d]/95 backdrop-blur border-t border-white/10 text-white">
      <div className="max-w-6xl mx-auto px-4 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-lg bg-[#4a4a4a] overflow-hidden shrink-0">
            {cover && <img src={cover} alt={track.title} className="w-full h-full object-cover" />}
          </div>
          <div className="min-w-0">
            <p className="font-bold truncate">{track.title}</p>
            <p className="text-xs text-white/60 truncate">{track.genre}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-white/60 hover:text-white" aria-label="Previous"><SkipBack className="w-5 h-5" /></button>
          <button
            onClick={toggle}
            className="w-11 h-11 grid place-items-center rounded-full border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground transition"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button className="text-white/60 hover:text-white" aria-label="Next"><SkipForward className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 rounded bg-white/10 overflow-hidden">
            <div
              className="h-full bg-secondary transition-[width]"
              style={{ width: dur > 0 ? `${(cur / dur) * 100}%` : "0%" }}
            />
          </div>
          <span className="text-xs text-white/60 tabular-nums whitespace-nowrap">
            {formatTime(cur)} / {formatTime(dur)}
          </span>
          <button onClick={onClose} className="text-xs text-white/60 hover:text-white ml-2">Close</button>
        </div>
      </div>
      {audioUrl && (
        <audio
          ref={ref}
          src={audioUrl}
          onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}

