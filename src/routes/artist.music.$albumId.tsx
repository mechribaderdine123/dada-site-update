import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Music as MusicIcon, Trash2, Pencil } from "lucide-react";
import { ArtistSidebar } from "@/components/ArtistSidebar";
import { useTracks, useAlbums, tracksApi, useBlobUrl, type Track } from "@/lib/music-store";
import { TrackModal } from "./artist.music";

export const Route = createFileRoute("/artist/music/$albumId")({
  head: () => ({ meta: [{ title: "Album — Dada Réseaux Artist" }] }),
  component: AlbumDetailPage,
});

function AlbumDetailPage() {
  const { albumId } = Route.useParams();
  const albums = useAlbums();
  const tracks = useTracks();

  const album = useMemo(() => albums.find((a) => a.id === albumId), [albums, albumId]);
  const albumTracks = useMemo(() => tracks.filter((t) => t.albumId === albumId), [tracks, albumId]);
  const availableSingles = useMemo(() => tracks.filter((t) => !t.albumId), [tracks]);

  const [trackModal, setTrackModal] = useState<Track | "new" | null>(null);
  const [addExisting, setAddExisting] = useState(false);

  if (!album && albums.length > 0) {
    return (
      <div className="min-h-screen bg-background text-foreground flex">
        <ArtistSidebar />
        <main className="flex-1 p-12">
          <p className="text-muted-foreground">Album not found.</p>
          <Link to="/artist/music" className="text-secondary underline">Back to music</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <ArtistSidebar />

      <main className="flex-1 p-8 md:p-12">
        <Link
          to="/artist/music"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to music
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AlbumCover album={album} />

          <div className="flex-1">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Album</p>
            <h1 className="mt-1 text-4xl md:text-5xl font-black text-secondary">{album?.title}</h1>
            <p className="mt-2 text-foreground/80">{album?.year} · {albumTracks.length} track{albumTracks.length !== 1 ? "s" : ""}</p>
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
                  className="flex items-center gap-2 rounded-xl bg-background border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
                >
                  <Plus className="w-4 h-4" /> Add existing single
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Add existing singles panel */}
        {addExisting && availableSingles.length > 0 && (
          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-bold mb-3">Pick singles to add to this album</p>
            <div className="space-y-2">
              {availableSingles.map((s) => (
                <SingleAddRow key={s.id} s={s} onAdd={() => tracksApi.update(s.id, { albumId })} />
              ))}
            </div>
          </div>
        )}

        {/* Tracks */}
        <div className="mt-10">
          <h2 className="text-xl font-black mb-4">Tracks</h2>
          {albumTracks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground rounded-xl border border-dashed border-border">
              No tracks in this album yet. Add a new track or attach an existing single.
            </div>
          ) : (
            <div className="space-y-3">
              {albumTracks.map((t, i) => (
                <AlbumTrackRow key={t.id} t={t} index={i} onEdit={() => setTrackModal(t)} />
              ))}
            </div>
          )}
        </div>
      </main>

      {trackModal && (
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
