import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Trash2, Plus, Loader2, Upload, X } from "lucide-react";
import { useSponsors, addSponsor, removeSponsor, updateSponsor } from "@/lib/sponsors";
import { uploadSiteImage } from "@/lib/site-images";

export const Route = createFileRoute("/admin/sponsors")({
  component: AdminSponsors,
});

function AdminSponsors() {
  const { sponsors, loading, reload } = useSponsors();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (file.size > 1.5 * 1024 * 1024) {
      setError("Image trop lourde (max 1,5 Mo). Compressez-la avant de l'importer.");
      return;
    }
    setUploading(true);
    try {
      setImage(await uploadSiteImage(file, "sponsors"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  const canAdd = name.trim() && image && !saving && !uploading;

  const submit = async () => {
    if (!canAdd) return;
    setSaving(true);
    setError(null);
    const { error: err } = await addSponsor({
      name: name.trim(),
      image_url: image,
      link_url: url.trim() || null,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setName("");
    setUrl("");
    setImage("");
    if (fileRef.current) fileRef.current.value = "";
    reload();
  };

  const doRemove = async (id: string, n: string) => {
    if (!confirm(`Supprimer "${n}" ?`)) return;
    await removeSponsor(id);
    reload();
  };

  const doUpdate = async (id: string, patch: Parameters<typeof updateSponsor>[1]) => {
    await updateSponsor(id, patch);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display tracking-wide text-3xl">Sponsors & partenaires</h1>
        <p className="text-sm text-muted-foreground">
          Les logos sont enregistrés sur le serveur et affichés à tous les visiteurs, sous l'image d'accueil.
        </p>
      </div>

      {/* Add form */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Ajouter un sponsor</h2>
        <div className="grid gap-4 md:grid-cols-[120px_1fr]">
          <div className="w-28 h-28 rounded-lg overflow-hidden border border-border bg-muted grid place-items-center">
            {image ? <img src={image} alt="" className="w-full h-full object-contain p-2" /> : <span className="text-xs text-muted-foreground">Aperçu</span>}
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Logo (PNG/JPG/SVG, max 1,5 Mo)</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-lg bg-secondary text-secondary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Envoi…" : image ? "Changer le logo" : "Choisir un logo"}
                </button>
                {image && (
                  <button
                    type="button"
                    onClick={() => {
                      setImage("");
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                  >
                    <X className="w-4 h-4" /> Retirer
                  </button>
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold">Nom</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : EU4Youth"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Lien (facultatif)</label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              onClick={submit}
              disabled={!canAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun sponsor pour le moment.</p>
          )}
          {sponsors.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden grid place-items-center shrink-0">
                <img src={s.image_url} alt={s.name} className="w-full h-full object-contain p-1.5" />
              </div>
              <div className="flex-1 min-w-0">
                <input
                  defaultValue={s.name}
                  onBlur={(e) => e.target.value !== s.name && doUpdate(s.id, { name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm font-semibold"
                />
                <input
                  defaultValue={s.link_url ?? ""}
                  onBlur={(e) => (e.target.value || null) !== s.link_url && doUpdate(s.id, { link_url: e.target.value || null })}
                  placeholder="Lien (facultatif)"
                  className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
                />
              </div>
              <button
                onClick={() => doRemove(s.id, s.name)}
                className="p-2 rounded-md hover:bg-destructive/10 text-destructive"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
