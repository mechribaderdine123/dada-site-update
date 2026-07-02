import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Music as MusicIcon, Trash2, Pencil } from "lucide-react";
import { ArtistSidebar } from "@/components/ArtistSidebar";
import { useTracks, useAlbums, tracksApi, useBlobUrl, type Track } from "@/lib/music-store";
import { TrackModal } from "./artist.music";

export const Route = createFileRoute("/artist/album/$albumId")({
  validateSearch: (s: Record<string, unknown>) => ({
    view: s.view === "public" ? ("public" as const) : undefined,
  }),
  head: () => ({ meta: [{ title: "Album — Dada Réseaux Artist" }] }),
  component: AlbumDetailPage,
});

function AlbumDetailPage() {
  const { albumId } = Route.useParams();
  const { view } = Route.useSearch();
  const isPublic = view === "public";
  const albums = useAlbums();
  const tracks = useTracks();

  const album = useMemo(() => albums.find((a) => a.id === albumId), [albums, albumId]);
  const albumTracks = useMemo(() => tracks.filter((t) => t.albumId === albumId), [tracks, albumId]);
  const availableSingles = useMemo(() => tracks.filter((t) => !t.albumId), [tracks]);

  const [trackModal, setTrackModal] = useState<Track | "new" | null>(null);
  const [addExisting, setAddExisting] = useState(false);

  const backTo = isPublic ? "/artist/discography" : "/artist/music";
  const backSearch = isPublic ? { view: "public" as const } : {};

  if (!album && albums.length > 0) {
    return (
      <div className="min-h-screen bg-[#393939] text-white flex">
        {!isPublic && <ArtistSidebar />}
        <main className="flex-1 p-12">
          <p className="text-white/60">Album not found.</p>
          <Link to={backTo} search={backSearch} className="text-secondary underline">Back to music</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#393939] text-white flex">
      {!isPublic && <ArtistSidebar />}

      <main className="flex-1 p-8 md:p-12">
        <Link
          to={backTo}
          search={backSearch}
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to music
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AlbumCover album={album} />

          <div className="flex-1">
            <p className="text-sm uppercase tracking-widest text-white/60">Album</p>
            <h1 className="mt-1 text-4xl md:text-5xl font-black text-secondary">{album?.title}</h1>
            <p className="mt-2 text-white/80">{album?.year} · {albumTracks.length} track{albumTracks.length !== 1 ? "s" : ""}</p>
            {!isPublic && (
              <div className="mt-5 flex gap-3 flex-wrap">
                <button
                  onClick={() => setTrackModal("new")}
                  className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold hover:opacity-90"
                >
                  <Plus className="w-4 h-4" /> Add new track
                </button>
                {availableSingles.length > 0 && (
                  <button
                    onClick={() => setAddExisting((v) => !v)}
                    className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20"
                  >
                    <Plus className="w-4 h-4" /> Add existing single
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add existing singles panel */}
        {!isPublic && addExisting && availableSingles.length > 0 && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/10 p-4">
            <p className="text-sm font-bold mb-3 text-white">Pick singles to add to this album</p>
            <div className="space-y-2">
              {availableSingles.map((s) => (
                <SingleAddRow key={s.id} s={s} onAdd={() => tracksApi.update(s.id, { albumId })} />
              ))}
            </div>
          </div>
        )}

        {/* Tracks */}
        <div className="mt-10">
          <h2 className="text-xl font-black mb-4 text-white">Tracks</h2>
          {albumTracks.length === 0 ? (
            <div className="text-center py-12 text-white/60 rounded-xl border border-dashed border-white/20">
              {isPublic ? "No tracks in this album yet." : "No tracks in this album yet. Add a new track or attach an existing single."}
            </div>
          ) : (
            <div className="space-y-3">
              {albumTracks.map((t, i) => (
                <AlbumTrackRow key={t.id} t={t} index={i} isPublic={isPublic} onEdit={() => setTrackModal(t)} />
              ))}
            </div>
          )}
        </div>
      </main>

      {!isPublic && trackModal && (
        <TrackModal
          track={trackModal === "new" ? null : trackModal}
          albums={albums}
          defaultAlbumId={albumId}
          onClose={() => setTrackModal(null)}
        />
      )}
    </div>
  );
}


function AlbumCover({ album }: { album: { title?: string; cover?: string; coverKey?: string } | undefined }) {
  const url = useBlobUrl(album?.coverKey, album?.cover);
  return (
    <div className="w-48 h-48 rounded-2xl overflow-hidden bg-[#4a4a4a] shrink-0">
      {url ? (
        <img src={url} alt={album?.title ?? ""} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full grid place-items-center text-white/50"><MusicIcon className="w-10 h-10" /></div>
      )}
    </div>
  );
}

function SingleAddRow({ s, onAdd }: { s: Track; onAdd: () => void }) {
  const cover = useBlobUrl(s.coverKey, s.cover);
  return (
    <div className="flex items-center justify-between gap-3 bg-[#4a4a4a] rounded-lg p-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded bg-white/10 overflow-hidden shrink-0">
          {cover && <img src={cover} alt={s.title} className="w-full h-full object-cover" />}
        </div>
        <p className="font-semibold truncate text-white">{s.title}</p>
      </div>
      <button onClick={onAdd} className="rounded-lg bg-secondary text-secondary-foreground px-3 py-1.5 text-xs font-bold hover:opacity-90">Add</button>
    </div>
  );
}

function AlbumTrackRow({ t, index, isPublic, onEdit }: { t: Track; index: number; isPublic: boolean; onEdit: () => void }) {
  const cover = useBlobUrl(t.coverKey, t.cover);
  const audio = useBlobUrl(t.audioKey, t.audioUrl);
  return (
    <div className="flex items-center gap-4 bg-white/10 rounded-xl p-3">
      <span className="w-6 text-center text-white/60 font-bold">{index + 1}</span>
      <div className="w-12 h-12 rounded-lg bg-[#4a4a4a] overflow-hidden shrink-0">
        {cover ? <img src={cover} alt={t.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full grid place-items-center"><MusicIcon className="w-5 h-5 text-white/50" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate text-white">{t.title}</p>
        <p className="text-xs text-white/60">{t.genre}</p>
        {audio && <audio src={audio} controls className="h-7 mt-1 max-w-full" />}
      </div>
      {!isPublic && (
        <>
          <button onClick={onEdit} className="hover:text-secondary text-white" aria-label="Edit track"><Pencil className="w-4 h-4" /></button>
          <button
            onClick={() => tracksApi.update(t.id, { albumId: null })}
            className="text-white/70 hover:text-white text-xs font-semibold border border-white/10 rounded-lg px-2 py-1"
            title="Remove from album (keeps as single)"
          >
            Remove
          </button>
          <button
            onClick={() => { if (confirm(`Delete "${t.title}" permanently?`)) tracksApi.remove(t.id); }}
            className="text-primary hover:opacity-70" aria-label="Delete track"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
