import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, X, Upload, Music as MusicIcon, Trash2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { ArtistSidebar } from "@/components/ArtistSidebar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { signedMusicUrl, extractMusicPath } from "@/lib/music-url";

export const Route = createFileRoute("/artist/music")({
  head: () => ({ meta: [{ title: "Music Management — Dada Réseaux Artist" }] }),
  component: MusicPage,
});

type Track = {
  id: string; title: string; genre: string | null;
  cover_url: string | null; audio_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

function MusicPage() {
  const { profile } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [modal, setModal] = useState<Track | "new" | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("tracks")
      .select("id,title,genre,cover_url,audio_url,status,created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    setTracks((data as Track[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [profile?.id]);

  const remove = async (t: Track) => {
    if (!confirm(`Supprimer "${t.title}" ?`)) return;
    // Best-effort remove of storage files
    const stripPath = (url: string | null) => {
      if (!url) return null;
      const marker = "/object/public/music/";
      const i = url.indexOf(marker);
      return i > -1 ? url.slice(i + marker.length) : null;
    };
    const paths = [stripPath(t.cover_url), stripPath(t.audio_url)].filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from("music").remove(paths);
    await supabase.from("tracks").delete().eq("id", t.id);
    load();
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#393939] text-white flex">
      <ArtistSidebar />
      <main className="flex-1 p-8 md:p-12">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-secondary">Music management</h1>
            <p className="mt-2 text-white/80">Ajoutez vos morceaux. Chaque morceau doit être validé par un administrateur avant publication.</p>
          </div>
          <button onClick={() => setModal("new")} className="flex items-center gap-2 rounded-xl bg-secondary text-secondary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition">
            <Plus className="w-4 h-4" /> Ajouter un morceau
          </button>
        </div>

        <div className="mt-8">
          {loading ? (
            <p className="text-white/70">Chargement…</p>
          ) : tracks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/20 p-10 text-center text-white/70">
              Aucun morceau. Cliquez sur "Ajouter un morceau" pour commencer.
            </div>
          ) : (
            <div className="grid gap-3">
              {tracks.map((t) => (
                <div key={t.id} className="flex items-center gap-4 rounded-xl bg-white/10 border border-white/10 p-4">
                  <div className="w-16 h-16 rounded-lg bg-black/40 overflow-hidden shrink-0 grid place-items-center">
                    {t.cover_url ? <img src={t.cover_url} alt="" className="w-full h-full object-cover" /> : <MusicIcon className="w-6 h-6 text-white/50" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{t.title}</p>
                    <p className="text-sm text-white/60 truncate">{t.genre || "—"}</p>
                    {t.audio_url && <audio controls preload="none" src={t.audio_url} className="mt-1 h-8 max-w-full" />}
                  </div>
                  <StatusBadge status={t.status} />
                  <button onClick={() => remove(t)} className="p-2 rounded-lg hover:bg-white/10 text-red-300" aria-label="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {modal && (
        <TrackModal
          userId={profile.id}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Track["status"] }) {
  const map = {
    pending: { icon: <Clock className="w-3.5 h-3.5" />, text: "En attente", cls: "bg-yellow-500/20 text-yellow-200" },
    approved: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, text: "Publié", cls: "bg-green-500/20 text-green-300" },
    rejected: { icon: <XCircle className="w-3.5 h-3.5" />, text: "Refusé", cls: "bg-red-500/20 text-red-300" },
  }[status];
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${map.cls}`}>{map.icon} {map.text}</span>;
}

function TrackModal({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File, prefix: string) => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${userId}/${prefix}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("music").upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("music").getPublicUrl(path).data.publicUrl;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!title.trim()) { setErr("Le titre est requis."); return; }
    if (!audioFile) { setErr("Un fichier audio est requis."); return; }
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
      onSaved();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erreur d'upload.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-[#2d2d2d] border border-white/10 p-6 text-white">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Nouveau morceau</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-semibold">Titre *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1.5 w-full h-11 px-3 rounded-lg bg-white text-black" />
          </div>
          <div>
            <label className="text-sm font-semibold">Genre</label>
            <input value={genre} onChange={(e) => setGenre(e.target.value)} className="mt-1.5 w-full h-11 px-3 rounded-lg bg-white text-black" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold">Pochette</label>
              <button type="button" onClick={() => coverRef.current?.click()} className="mt-1.5 w-full h-24 rounded-lg border-2 border-dashed border-white/20 hover:border-secondary grid place-items-center overflow-hidden">
                {coverFile ? <img src={URL.createObjectURL(coverFile)} alt="" className="w-full h-full object-cover" /> : <Upload className="w-6 h-6 text-white/60" />}
              </button>
              <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
            </div>
            <div>
              <label className="text-sm font-semibold">Fichier audio *</label>
              <button type="button" onClick={() => audioRef.current?.click()} className="mt-1.5 w-full h-24 rounded-lg border-2 border-dashed border-white/20 hover:border-secondary grid place-items-center px-2 text-center text-xs">
                {audioFile ? <span className="truncate">{audioFile.name}</span> : <span className="text-white/60">Choisir un fichier .mp3/.wav</span>}
              </button>
              <input ref={audioRef} type="file" accept="audio/*" hidden onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          {err && <p className="text-sm text-red-300 bg-red-900/30 border border-red-400/30 rounded-lg px-3 py-2">{err}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-white/10 hover:bg-white/15 px-4 py-2 text-sm font-semibold">Annuler</button>
          <button type="submit" disabled={busy} className="rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 disabled:opacity-60 px-4 py-2 text-sm font-semibold">
            {busy ? "Envoi…" : "Envoyer pour validation"}
          </button>
        </div>
      </form>
    </div>
  );
}
