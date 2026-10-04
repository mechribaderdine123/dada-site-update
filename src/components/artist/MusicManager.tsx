import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Music2,
  Plus,
  Trash2,
  Upload,
  X,
  XCircle,
  Youtube,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { extractMusicPath, signedMusicUrl } from "@/lib/music-url";
import { TrackPlayer } from "@/components/artist/TrackPlayer";

type Track = {
  id: string;
  title: string;
  genre: string | null;
  cover_url: string | null;
  audio_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};
type Video = { id: string; title: string; youtube_url: string };

export function MusicManager({
  userId,
  accent,
  surface,
}: {
  userId: string;
  accent: string;
  surface: string;
}) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [modal, setModal] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const load = async () => {
    const [trackResult, videoResult] = await Promise.all([
      supabase
        .from("tracks")
        .select("id,title,genre,cover_url,audio_url,status,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("artist_videos")
        .select("id,title,youtube_url")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);
    setTracks(
      await Promise.all(
        ((trackResult.data ?? []) as Track[]).map(async (track) => ({
          ...track,
          cover_url: await signedMusicUrl(track.cover_url),
          audio_url: await signedMusicUrl(track.audio_url),
        })),
      ),
    );
    setVideos((videoResult.data ?? []) as Video[]);
  };
  useEffect(() => {
    load();
  }, [userId]);
  const removeTrack = async (track: Track) => {
    if (!confirm(`Delete "${track.title}"?`)) return;
    const paths = [extractMusicPath(track.cover_url), extractMusicPath(track.audio_url)].filter(
      Boolean,
    ) as string[];
    if (paths.length) await supabase.storage.from("music").remove(paths);
    await supabase.from("tracks").delete().eq("id", track.id);
    load();
  };
  const addVideo = async () => {
    if (!videoTitle.trim() || !/(youtube\.com|youtu\.be)/i.test(videoUrl)) {
      setNotice("Enter a title and valid YouTube URL.");
      return;
    }
    const { data, error } = await supabase
      .from("artist_videos")
      .insert({ user_id: userId, title: videoTitle.trim(), youtube_url: videoUrl.trim() })
      .select("id,title,youtube_url")
      .single();
    if (error) setNotice(error.message);
    else if (data) {
      setVideos((old) => [data, ...old]);
      setVideoTitle("");
      setVideoUrl("");
      setNotice(null);
    }
  };
  return (
    <section id="music" className="rounded-xl p-5 md:p-6" style={{ backgroundColor: surface }}>
      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>
        Artist studio · music & clips
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl uppercase md:text-5xl">Music management</h2>
          <p className="mt-1 text-sm text-white/55">
            Upload MP3 tracks and manage clips imported from YouTube.
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="inline-flex items-center gap-2 rounded px-4 py-3 text-xs font-bold uppercase text-[#00382d]"
          style={{ backgroundColor: accent }}
        >
          <Plus className="w-4" />
          Upload MP3
        </button>
      </div>
      {notice && (
        <p className="mt-5 rounded bg-red-400/10 px-4 py-3 text-sm text-red-200">{notice}</p>
      )}
      <div className="mt-7">
        <Title icon={<Music2 />} text="Your music" accent={accent} />
        <div className="mt-5 space-y-3">
          {tracks.length ? (
            tracks.map((track, index) => (
              <article
                key={track.id}
                className="flex flex-col gap-4 rounded-lg bg-black/15 p-3 sm:flex-row sm:items-center"
              >
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded bg-black/25">
                  {track.cover_url ? (
                    <img src={track.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span style={{ color: accent }}>0{index + 1}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-xl uppercase">{track.title}</h3>
                  <p className="text-xs text-white/50">
                    {track.genre || "No genre"} · <Status status={track.status} />
                  </p>
                  {track.audio_url && (
                    <TrackPlayer
                      url={track.audio_url}
                      title={track.title}
                      accent={accent}
                      className="mt-3"
                    />
                  )}
                </div>
                <button
                  onClick={() => removeTrack(track)}
                  className="rounded p-2 text-red-300 hover:bg-white/5"
                  aria-label="Delete track"
                >
                  <Trash2 className="w-4" />
                </button>
              </article>
            ))
          ) : (
            <Empty>There are no tracks yet. Upload an MP3 to begin.</Empty>
          )}
        </div>
      </div>
      <div className="mt-8 border-t border-white/10 pt-6">
        <Title icon={<Youtube />} text="YouTube clips" accent={accent} />
        <p className="mt-2 text-sm text-white/55">
          Paste a YouTube link. Videos remain hosted on YouTube.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            placeholder="Clip title"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            className="h-11 rounded bg-black/15 px-3 text-sm outline-none"
          />
          <input
            placeholder="YouTube URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="h-11 rounded bg-black/15 px-3 text-sm outline-none"
          />
          <button
            onClick={addVideo}
            className="inline-flex h-11 items-center justify-center gap-2 rounded px-4 text-xs font-bold uppercase text-[#00382d]"
            style={{ backgroundColor: accent }}
          >
            <Plus className="w-4" />
            Add clip
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {videos.length ? (
            videos.map((video) => (
              <div key={video.id} className="flex items-center gap-3 rounded bg-black/15 px-3 py-3">
                <Youtube className="w-5 text-red-400" />
                <a
                  href={video.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate text-sm hover:underline"
                >
                  {video.title}
                </a>
                <button
                  onClick={async () => {
                    await supabase.from("artist_videos").delete().eq("id", video.id);
                    setVideos((old) => old.filter((item) => item.id !== video.id));
                  }}
                  className="p-1 text-red-300"
                >
                  <Trash2 className="w-4" />
                </button>
              </div>
            ))
          ) : (
            <Empty>No clips added yet.</Empty>
          )}
        </div>
      </div>
      {modal && (
        <TrackModal
          userId={userId}
          accent={accent}
          close={() => setModal(false)}
          saved={() => {
            setModal(false);
            load();
          }}
        />
      )}
    </section>
  );
}

function TrackModal({
  userId,
  accent,
  close,
  saved,
}: {
  userId: string;
  accent: string;
  close: () => void;
  saved: () => void;
}) {
  const [title, setTitle] = useState(""),
    [genre, setGenre] = useState(""),
    [coverFile, setCoverFile] = useState<File | null>(null),
    [audioFile, setAudioFile] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null),
    audioRef = useRef<HTMLInputElement>(null);
  const upload = async (file: File, kind: string) => {
    const path = `${userId}/${kind}-${crypto.randomUUID()}.${file.name.split(".").pop() || "bin"}`;
    // MP3s go to the music folder, cover art to the covers folder.
    const bucket = kind === "cover" ? "covers" : "music";
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type,
    });
    if (error) throw error;
    return path;
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !audioFile) {
      setError("Title and MP3 file are required.");
      return;
    }
    if (!audioFile.name.toLowerCase().endsWith(".mp3") && audioFile.type !== "audio/mpeg") {
      setError("Please choose an MP3 file.");
      return;
    }
    setBusy(true);
    try {
      const audio_url = await upload(audioFile, "audio");
      const cover_url = coverFile ? await upload(coverFile, "cover") : null;
      const { error } = await supabase.from("tracks").insert({
        user_id: userId,
        title: title.trim(),
        genre: genre.trim() || null,
        audio_url,
        cover_url,
      });
      if (error) throw error;
      saved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-xl border border-white/10 bg-[#1c1c1c] p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl uppercase">Upload MP3</h2>
          <button type="button" onClick={close}>
            <X />
          </button>
        </div>
        <div className="mt-5 space-y-4">
          <Field label="Track title" value={title} onChange={setTitle} />
          <Field label="Genre" value={genre} onChange={setGenre} />
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => coverRef.current?.click()}
              className="aspect-square rounded border border-dashed border-white/20 bg-[#222]"
            >
              {coverFile ? (
                <img
                  src={URL.createObjectURL(coverFile)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>
                  <Upload className="mx-auto" />
                  Cover
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => audioRef.current?.click()}
              className="rounded border border-dashed border-white/20 bg-[#222] p-3 text-sm"
            >
              {audioFile ? audioFile.name : "Choose MP3 file"}
            </button>
          </div>
          <input
            ref={coverRef}
            hidden
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
          />
          <input
            ref={audioRef}
            hidden
            type="file"
            accept="audio/mpeg,.mp3"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={close} className="rounded bg-white/10 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            disabled={busy}
            className="rounded px-4 py-2 text-sm font-bold text-[#00382d]"
            style={{ backgroundColor: accent }}
          >
            {busy ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
}
function Title({ icon, text, accent }: { icon: React.ReactNode; text: string; accent: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: accent }}>
      {icon}
      <h3 className="font-display text-2xl uppercase text-[#e5e2e1]">{text}</h3>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded bg-black/15 p-5 text-sm text-white/50">{children}</p>;
}
function Status({ status }: { status: Track["status"] }) {
  const config =
    status === "approved"
      ? { text: "Published", Icon: CheckCircle2, color: "text-emerald-300" }
      : status === "rejected"
        ? { text: "Rejected", Icon: XCircle, color: "text-red-300" }
        : { text: "Pending review", Icon: Clock, color: "text-yellow-200" };
  return (
    <span className={`inline-flex items-center gap-1 ${config.color}`}>
      <config.Icon className="w-3" />
      {config.text}
    </span>
  );
}
function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-bold uppercase text-white/60">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded bg-[#222] px-3 text-sm font-normal text-white outline-none"
      />
    </label>
  );
}
