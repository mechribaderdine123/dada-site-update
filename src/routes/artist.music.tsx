import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Plus, Pencil, XCircle, Music as MusicIcon, X, Upload, Play } from "lucide-react";
import { ArtistSidebar } from "@/components/ArtistSidebar";
import {
  useTracks,
  useAlbums,
  tracksApi,
  albumsApi,
  idbPut,
  useBlobUrl,
  migrateLegacyStore,
  type Track,
  type Album,
} from "@/lib/music-store";

export const Route = createFileRoute("/artist/music")({
  head: () => ({
    meta: [{ title: "Music Management — Dada Réseaux Artist" }],
  }),
  component: MusicPage,
});

type View = "single" | "album";

function MusicPage() {
  useEffect(() => { migrateLegacyStore(); }, []);
  const [view, setView] = useState<View>("single");
  const [trackModal, setTrackModal] = useState<Track | "new" | null>(null);
  const [albumModal, setAlbumModal] = useState<Album | "new" | null>(null);
  const tracks = useTracks();
  const albums = useAlbums();

  // singles = tracks not attached to an album
  const singles = tracks.filter((t) => !t.albumId);

  return (
    <div className="min-h-screen bg-[#393939] text-white flex">
      <ArtistSidebar />

      <main className="flex-1 p-8 md:p-12">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-secondary">Music management</h1>
            <p className="mt-2 text-white/80">Upload new track and manage your discography</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setAlbumModal("new")}
              className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20 transition"
            >
              <Plus className="w-4 h-4" /> Add new album
            </button>
            <button
              onClick={() => setTrackModal("new")}
              className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20 transition"
            >
              <Plus className="w-4 h-4" /> Upload new track
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => setView("single")}
            className={`px-8 py-2.5 rounded-lg font-bold text-sm transition ${
              view === "single" ? "bg-secondary text-secondary-foreground" : "bg-muted text-foreground/70"
            }`}
          >
            SINGLE
          </button>
          <button
            onClick={() => setView("album")}
            className={`px-8 py-2.5 rounded-lg font-bold text-sm transition ${
              view === "album" ? "bg-secondary text-secondary-foreground" : "bg-muted text-foreground/70"
            }`}
          >
            ALBUM
          </button>
        </div>

        {/* List */}
        <div className="mt-8">
          {view === "single" ? (
            <TrackList tracks={singles} albums={albums} onEdit={setTrackModal} />
          ) : (
            <AlbumList albums={albums} tracks={tracks} onEdit={setAlbumModal} />
          )}
        </div>
      </main>

      {trackModal && (
        <TrackModal
          track={trackModal === "new" ? null : trackModal}
          albums={albums}
          onClose={() => setTrackModal(null)}
        />
      )}
      {albumModal && (
        <AlbumModal
          album={albumModal === "new" ? null : albumModal}
          onClose={() => setAlbumModal(null)}
        />
      )}
    </div>
  );
}

function TrackList({
  tracks,
  albums,
  onEdit,
}: {
  tracks: Track[];
  albums: Album[];
  onEdit: (t: Track) => void;
}) {
  if (tracks.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No singles yet. Click "Upload new track" to get started.
      </div>
    );
  }
  return (
    <div>
      <div className="grid grid-cols-[1fr_120px_180px_100px] gap-4 px-4 pb-3 text-sm font-bold">
        <div>track</div>
        <div>Genre</div>
        <div>Publish to album</div>
        <div>Action</div>
      </div>
      <div className="space-y-3">
        {tracks.map((t) => (
          <TrackRow key={t.id} t={t} albums={albums} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

function AlbumList({
  albums,
  tracks,
  onEdit,
}: {
  albums: Album[];
  tracks: Track[];
  onEdit: (a: Album) => void;
}) {
  if (albums.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No albums yet. Click "Add new album" to get started.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {albums.map((a) => {
        const count = tracks.filter((t) => t.albumId === a.id).length;
        return <AlbumTile key={a.id} a={a} count={count} onEdit={onEdit} />;
      })}
    </div>
  );
}

function TrackRow({ t, albums, onEdit }: { t: Track; albums: Album[]; onEdit: (t: Track) => void }) {
  const coverUrl = useBlobUrl(t.coverKey, t.cover);
  const audioUrl = useBlobUrl(t.audioKey, t.audioUrl);
  return (
    <div className="grid grid-cols-[1fr_120px_180px_100px] items-center gap-4 bg-muted/50 rounded-xl p-3">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-lg bg-background overflow-hidden shrink-0">
          {coverUrl ? (
            <img src={coverUrl} alt={t.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center"><MusicIcon className="w-5 h-5 text-muted-foreground" /></div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold truncate">{t.title}</p>
          {audioUrl && <audio src={audioUrl} controls className="h-7 mt-1 max-w-[260px]" />}
        </div>
      </div>
      <div className="text-foreground/80">{t.genre}</div>
      <div>
        <select
          value={t.albumId ?? ""}
          onChange={(e) => tracksApi.update(t.id, { albumId: e.target.value || null })}
          className="w-full rounded-lg bg-background border border-border px-2 py-1.5 text-xs"
          disabled={albums.length === 0}
        >
          <option value="">— Single —</option>
          {albums.map((a) => (<option key={a.id} value={a.id}>{a.title}</option>))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onEdit(t)} className="hover:text-secondary transition" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
        <button
          onClick={() => { if (confirm(`Delete "${t.title}"?`)) tracksApi.remove(t.id); }}
          className="text-primary hover:opacity-70 transition" aria-label="Delete"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function AlbumTile({ a, count, onEdit }: { a: Album; count: number; onEdit: (a: Album) => void }) {
  const coverUrl = useBlobUrl(a.coverKey, a.cover);
  return (
    <div className="bg-muted/40 rounded-xl overflow-hidden group">
      <Link to="/artist/album/$albumId" params={{ albumId: a.id }} className="block aspect-square bg-background overflow-hidden relative">
        {coverUrl && <img src={coverUrl} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition" />}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition grid place-items-center opacity-0 group-hover:opacity-100">
          <Play className="w-10 h-10 text-white" />
        </div>
      </Link>
      <div className="p-3">
        <Link to="/artist/album/$albumId" params={{ albumId: a.id }} className="font-bold truncate block hover:text-secondary">{a.title}</Link>
        <p className="text-sm text-muted-foreground">{a.year} · {count} track{count !== 1 ? "s" : ""}</p>
        <div className="mt-3 flex gap-3">
          <button onClick={() => onEdit(a)} className="hover:text-secondary"><Pencil className="w-4 h-4" /></button>
          <button
            onClick={() => { if (confirm(`Delete album "${a.title}"? Tracks will become singles.`)) albumsApi.remove(a.id); }}
            className="text-primary"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6 relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        <h2 className="text-xl font-black mb-5">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function TrackModal({
  track,
  albums,
  defaultAlbumId,
  onClose,
}: {
  track: Track | null;
  albums: Album[];
  defaultAlbumId?: string | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(track?.title ?? "");
  const [genre, setGenre] = useState(track?.genre ?? "Hip hop");
  const [coverKey, setCoverKey] = useState<string | undefined>(track?.coverKey);
  const [audioKey, setAudioKey] = useState<string | undefined>(track?.audioKey);
  const [audioName, setAudioName] = useState<string>("");
  const [albumId, setAlbumId] = useState<string | null>(track?.albumId ?? defaultAlbumId ?? null);
  const [uploading, setUploading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const coverPreview = useBlobUrl(coverKey, track?.cover);
  const audioPreview = useBlobUrl(audioKey, track?.audioUrl);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload = { title, genre, coverKey, audioKey, albumId };
    try {
      if (track) tracksApi.update(track.id, payload);
      else tracksApi.add(payload);
      onClose();
    } catch (err) {
      alert("Could not save. Storage is full — try removing some tracks first.");
      console.error(err);
    }
  };

  return (
    <ModalShell title={track ? "Edit track" : "Upload new track"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full rounded-lg bg-background border border-border px-4 py-2.5 text-sm outline-none focus:border-secondary" />
        </Field>
        <Field label="Genre">
          <select value={genre} onChange={(e) => setGenre(e.target.value)}
            className="w-full rounded-lg bg-background border border-border px-4 py-2.5 text-sm outline-none focus:border-secondary">
            <option>Hip hop</option><option>Trap</option><option>R&B</option><option>Rap</option><option>Drill</option>
          </select>
        </Field>

        <Field label="Audio file (mp3)">
          <button
            type="button"
            onClick={() => audioRef.current?.click()}
            className="w-full rounded-lg border-2 border-dashed border-border hover:border-secondary px-4 py-4 bg-background flex flex-col items-center gap-1 text-sm"
          >
            {uploading ? (
              <span className="text-muted-foreground">Uploading…</span>
            ) : audioPreview ? (
              <>
                <span className="font-semibold">{audioName || "Audio attached"}</span>
                <span className="text-xs text-muted-foreground">Click to replace</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">Upload mp3 file</span>
              </>
            )}
          </button>
          {audioPreview && <audio src={audioPreview} controls className="w-full mt-2" />}
          <input
            ref={audioRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setUploading(true);
              try {
                const key = await idbPut(f);
                setAudioKey(key);
                setAudioName(f.name);
              } catch (err) {
                console.error(err);
                alert("Could not store audio file.");
              } finally {
                setUploading(false);
              }
            }}
          />
        </Field>

        <Field label="Album">
          <select
            value={albumId ?? ""}
            onChange={(e) => setAlbumId(e.target.value || null)}
            className="w-full rounded-lg bg-background border border-border px-4 py-2.5 text-sm outline-none focus:border-secondary"
          >
            <option value="">Publish as single</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
        </Field>

        <Field label="Cover image">
          <button
            type="button"
            onClick={() => coverRef.current?.click()}
            className="w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-secondary flex items-center justify-center overflow-hidden bg-background"
          >
            {coverPreview ? <img src={coverPreview} alt="" className="w-full h-full object-cover" /> : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground"><Upload className="w-5 h-5" /> Upload cover</div>
            )}
          </button>
          <input ref={coverRef} type="file" accept="image/*" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCoverKey(await idbPut(f)); }} />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">Cancel</button>
          <button type="submit" className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold hover:opacity-90">
            {track ? "Save" : "Publish"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function AlbumModal({ album, onClose }: { album: Album | null; onClose: () => void }) {
  const [title, setTitle] = useState(album?.title ?? "");
  const [year, setYear] = useState(album?.year ?? String(new Date().getFullYear()));
  const [coverKey, setCoverKey] = useState<string | undefined>(album?.coverKey);
  const coverPreview = useBlobUrl(coverKey, album?.cover);
  const coverRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      if (album) albumsApi.update(album.id, { title, year, coverKey });
      else albumsApi.add({ title, year, coverKey });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Could not save album.");
    }
  };

  return (
    <ModalShell title={album ? "Edit album" : "Add new album"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Album title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full rounded-lg bg-background border border-border px-4 py-2.5 text-sm outline-none focus:border-secondary" />
        </Field>
        <Field label="Year">
          <input value={year} onChange={(e) => setYear(e.target.value)} required
            className="w-full rounded-lg bg-background border border-border px-4 py-2.5 text-sm outline-none focus:border-secondary" />
        </Field>
        <Field label="Cover image">
          <button
            type="button"
            onClick={() => coverRef.current?.click()}
            className="w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-secondary flex items-center justify-center overflow-hidden bg-background"
          >
            {coverPreview ? <img src={coverPreview} alt="" className="w-full h-full object-cover" /> : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground"><Upload className="w-5 h-5" /> Upload cover</div>
            )}
          </button>
          <input ref={coverRef} type="file" accept="image/*" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCoverKey(await idbPut(f)); }} />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">Cancel</button>
          <button type="submit" className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold hover:opacity-90">
            {album ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>
      {children}
    </div>
  );
}
