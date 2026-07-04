import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Upload, Trash2, RotateCcw, Plus } from "lucide-react";
import { useSponsors, addSponsor, removeSponsor, updateSponsor, resetSponsors } from "@/lib/sponsors";
import { fileToDataUrl } from "@/lib/site-content";

export const Route = createFileRoute("/admin/sponsors")({
  component: AdminSponsors,
});

function AdminSponsors() {
  const sponsors = useSponsors();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    if (file.size > 3 * 1024 * 1024) {
      alert("Image trop lourde (max 3 Mo).");
      return;
    }
    setImage(await fileToDataUrl(file));
  };

  const canAdd = name.trim() && image;

  const submit = () => {
    if (!canAdd) return;
    addSponsor({ name: name.trim(), image, url: url.trim() || undefined });
    setName("");
    setUrl("");
    setImage("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display tracking-wide text-3xl">Sponsors & partenaires</h1>
          <p className="text-sm text-muted-foreground">
            Ajoutez ou supprimez les logos affichés sur la page d'accueil (sous l'image hero).
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm("Restaurer les sponsors par défaut ?")) resetSponsors();
          }}
          className="inline-flex items-center gap-2 text-sm rounded-lg border border-border px-3 py-2 hover:bg-muted"
        >
          <RotateCcw className="w-4 h-4" /> Réinitialiser
        </button>
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
              <label className="text-xs font-semibold">Logo (PNG/JPG, max 3 Mo)</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                className="mt-1 block w-full text-sm"
              />
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
            <button
              onClick={submit}
              disabled={!canAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sponsors.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun sponsor pour le moment.</p>
        )}
        {sponsors.map((s) => (
          <div key={s.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden grid place-items-center shrink-0">
              <img src={s.image} alt={s.name} className="w-full h-full object-contain p-1.5" />
            </div>
            <div className="flex-1 min-w-0">
              <input
                value={s.name}
                onChange={(e) => updateSponsor(s.id, { name: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm font-semibold"
              />
              <input
                value={s.url ?? ""}
                onChange={(e) => updateSponsor(s.id, { url: e.target.value })}
                placeholder="Lien (facultatif)"
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
              />
            </div>
            <button
              onClick={() => {
                if (confirm(`Supprimer "${s.name}" ?`)) removeSponsor(s.id);
              }}
              className="p-2 rounded-md hover:bg-destructive/10 text-destructive"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
        <Upload className="w-3 h-3" /> Les logos sont enregistrés localement dans votre navigateur.
      </p>
    </div>
  );
}
