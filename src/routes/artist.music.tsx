import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Plus, Pencil, XCircle, Music as MusicIcon, X, Upload } from "lucide-react";
import { ArtistSidebar } from "@/components/ArtistSidebar";
import {
  useTracks,
  useAlbums,
  tracksApi,
  albumsApi,
  fileToDataUrl,
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
  const [view, setView] = useState<View>("single");
  const [trackModal, setTrackModal] = useState<Track | "new" | null>(null);
  const [albumModal, setAlbumModal] = useState<Album | "new" | null>(null);

  const tracks = useTracks();
  const albums = useAlbums();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <ArtistSidebar />

      <main className="flex-1 p-8 md:p-12">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-secondary">Music management</h1>
            <p className="mt-2 text-foreground/80">Upload new track and manage your discography</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setAlbumModal("new")}
              className="flex items-center gap-2 rounded-xl bg-background border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition"
            >
              <Plus className="w-4 h-4" /> Add new album
            </button>
            <button
              onClick={() => setTrackModal("new")}
              className="flex items-center gap-2 rounded-xl bg-background border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition"
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
            <TrackList tracks={tracks} onEdit={setTrackModal} />
          ) : (
            <AlbumList albums={albums} onEdit={setAlbumModal} />
          )}
        </div>
      </main>

      {trackModal && (
        <TrackModal
          track={trackModal === "new" ? null : trackModal}
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

function TrackList({ tracks, onEdit }: { tracks: Track[]; onEdit: (t: Track) => void }) {
  if (tracks.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No tracks yet. Click "Upload new track" to get started.
      </div>
    );
  }
  return (
    <div>
      <div className="grid grid-cols-[1fr_120px_100px] gap-4 px-4 pb-3 text-sm font-bold">
        <div>track</div>
        <div>Genre</div>
        <div>Action</div>
      </div>
      <div className="space-y-3">
        {tracks.map((t) => (
          <div
            key={t.id}
            className="grid grid-cols-[1fr_120px_100px] items-center gap-4 bg-muted/50 rounded-xl p-3"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-lg bg-background overflow-hidden shrink-0">
                {t.cover ? (
                  <img src={t.cover} alt={t.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center"><MusicIcon className="w-5 h-5 text-muted-foreground" /></div>
                )}
              </div>
              <p className="font-bold truncate">{t.title}</p>
            </div>
            <div className="text-foreground/80">{t.genre}</div>
            <div className="flex items-center gap-3">
              <button onClick={() => onEdit(t)} className="hover:text-secondary transition" aria-label="Edit">
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${t.title}"?`)) tracksApi.remove(t.id);
                }}
                className="text-primary hover:opacity-70 transition"
                aria-label="Delete"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlbumList({ albums, onEdit }: { albums: Album[]; onEdit: (a: Album) => void }) {
  if (albums.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No albums yet. Click "Add new album" to get started.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {albums.map((a) => (
        <div key={a.id} className="bg-muted/40 rounded-xl overflow-hidden">
          <div className="aspect-square bg-background overflow-hidden">
            {a.cover && <img src={a.cover} alt={a.title} className="w-full h-full object-cover" />}
          </div>
          <div className="p-3">
            <p className="font-bold truncate">{a.title}</p>
            <p className="text-sm text-muted-foreground">{a.year}</p>
            <div className="mt-3 flex gap-3">
              <button onClick={() => onEdit(a)} className="hover:text-secondary"><Pencil className="w-4 h-4" /></button>
              <button
                onClick={() => {
                  if (confirm(`Delete album "${a.title}"?`)) albumsApi.remove(a.id);
                }}
                className="text-primary"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        <h2 className="text-xl font-black mb-5">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function TrackModal({ track, onClose }: { track: Track | null; onClose: () => void }) {
  const [title, setTitle] = useState(track?.title ?? "");
  const [genre, setGenre] = useState(track?.genre ?? "Hip hop");
  const [cover, setCover] = useState<string>(track?.cover ?? "");
  const [audioUrl, setAudioUrl] = useState(track?.audioUrl ?? "");
  const coverRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (track) {
      tracksApi.update(track.id, { title, genre, cover, audioUrl });
    } else {
      tracksApi.add({ title, genre, cover, audioUrl, albumId: null });
    }
    onClose();
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
        <Field label="Audio URL (YouTube, Spotify, mp3...)">
          <input value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} type="url" placeholder="https://..."
            className="w-full rounded-lg bg-background border border-border px-4 py-2.5 text-sm outline-none focus:border-secondary" />
        </Field>
        <Field label="Cover image">
          <button
            type="button"
            onClick={() => coverRef.current?.click()}
            className="w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-secondary flex items-center justify-center overflow-hidden bg-background"
          >
            {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground"><Upload className="w-5 h-5" /> Upload cover</div>
            )}
          </button>
          <input ref={coverRef} type="file" accept="image/*" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCover(await fileToDataUrl(f)); }} />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">Cancel</button>
          <button type="submit" className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold hover:opacity-90">
            {track ? "Save" : "Upload"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function AlbumModal({ album, onClose }: { album: Album | null; onClose: () => void }) {
  const [title, setTitle] = useState(album?.title ?? "");
  const [year, setYear] = useState(album?.year ?? String(new Date().getFullYear()));
  const [cover, setCover] = useState<string>(album?.cover ?? "");
  const coverRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (album) {
      albumsApi.update(album.id, { title, year, cover });
    } else {
      albumsApi.add({ title, year, cover });
    }
    onClose();
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
            {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground"><Upload className="w-5 h-5" /> Upload cover</div>
            )}
          </button>
          <input ref={coverRef} type="file" accept="image/*" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCover(await fileToDataUrl(f)); }} />
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
