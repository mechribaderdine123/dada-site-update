import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Trash2, Plus, Loader2, Upload, X, Pencil, Save, CheckCircle2, RotateCcw } from "lucide-react";
import PageEditor from "@/components/admin/PageEditor";
import {
  useWorkshops,
  addWorkshop,
  updateWorkshop,
  removeWorkshop,
  fileToDataUrl,
  WORKSHOP_CATEGORIES,
  type Workshop,
} from "@/lib/workshops";

export const Route = createFileRoute("/admin/workshops")({
  component: AdminWorkshops,
});

const empty = {
  name: "",
  category: WORKSHOP_CATEGORIES[0] as string,
  description: "",
  image_url: "",
  month: "",
  day: "",
  place: "",
  time: "",
};

function AdminWorkshops() {
  const { workshops, loading, reload } = useWorkshops();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Workshop | null>(null);
  const editFileRef = useRef<HTMLInputElement | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleFile = async (file: File, target: "new" | "edit") => {
    setError(null);
    if (file.size > 2 * 1024 * 1024) {
      setError("Image trop lourde (max 2 Mo).");
      return;
    }
    const url = await fileToDataUrl(file);
    if (target === "new") set("image_url", url);
    else setEdit((e) => (e ? { ...e, image_url: url } : e));
  };

  const canAdd = form.name.trim() && form.category && !saving;

  const submit = async () => {
    if (!canAdd) return;
    setSaving(true);
    setError(null);
    const { error: err } = await addWorkshop({
      name: form.name.trim(),
      category: form.category,
      description: form.description,
      image_url: form.image_url,
      month: form.month,
      day: form.day,
      place: form.place,
      time: form.time,
    });
    setSaving(false);
    if (err) return setError(err.message);
    setForm(empty);
    if (fileRef.current) fileRef.current.value = "";
    reload();
  };

  const startEdit = (w: Workshop) => {
    setEditingId(w.id);
    setEdit({ ...w });
  };

  const saveEdit = async () => {
    if (!edit) return;
    const { id, sort_order: _s, ...patch } = edit;
    void _s;
    const { error: err } = await updateWorkshop(id, patch);
    if (err) return setError(err.message);
    setEditingId(null);
    setEdit(null);
    reload();
  };

  const doRemove = async (id: string, n: string) => {
    if (!confirm(`Supprimer "${n}" ?`)) return;
    await removeWorkshop(id);
    reload();
  };

  const toggleFinished = async (w: Workshop) => {
    await updateWorkshop(w.id, { is_finished: !w.is_finished });
    reload();
  };

  return (
    <div className="space-y-8">
      <PageEditor pageId="workshops" />

      <div>
        <h1 className="font-display tracking-wide text-3xl">Workshops & événements</h1>
        <p className="text-sm text-muted-foreground">
          Ajoutez, modifiez ou supprimez les workshops affichés sur la page Workshops.
        </p>
      </div>

      {/* Add form */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Ajouter un workshop</h2>
        <div className="grid gap-4 md:grid-cols-[160px_1fr]">
          <div>
            <div className="w-full aspect-square rounded-lg overflow-hidden border border-border bg-muted grid place-items-center">
              {form.image_url ? (
                <img src={form.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">Aperçu</span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f, "new");
              }}
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-secondary text-secondary-foreground px-3 py-2 text-xs font-semibold hover:opacity-90"
              >
                <Upload className="w-3.5 h-3.5" /> {form.image_url ? "Changer" : "Image"}
              </button>
              {form.image_url && (
                <button
                  type="button"
                  onClick={() => {
                    set("image_url", "");
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="rounded-lg border border-border px-2 py-2 hover:bg-muted"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold">Nom</label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Ex : Urban Night Live"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Catégorie</label>
                <select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {WORKSHOP_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold">Mois (ex : Nov)</label>
                <input
                  value={form.month}
                  onChange={(e) => set("month", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Jour (ex : 12)</label>
                <input
                  value={form.day}
                  onChange={(e) => set("day", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Lieu</label>
                <input
                  value={form.place}
                  onChange={(e) => set("place", e.target.value)}
                  placeholder="Ex : Dada Studio"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Heure</label>
                <input
                  value={form.time}
                  onChange={(e) => set("time", e.target.value)}
                  placeholder="Ex : 08:00 pm"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
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
        <div className="space-y-3">
          {workshops.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun workshop pour le moment.</p>
          )}
          {workshops.map((w) => {
            const isEditing = editingId === w.id && edit;
            return (
              <div key={w.id} className="rounded-xl border border-border bg-card p-4">
                {isEditing && edit ? (
                  <div className="grid gap-3 md:grid-cols-[140px_1fr_auto]">
                    <div>
                      <div className="w-full aspect-square rounded-lg overflow-hidden border border-border bg-muted grid place-items-center">
                        {edit.image_url ? (
                          <img src={edit.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-muted-foreground">Aperçu</span>
                        )}
                      </div>
                      <input
                        ref={editFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFile(f, "edit");
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => editFileRef.current?.click()}
                        className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-secondary text-secondary-foreground px-3 py-1.5 text-xs font-semibold hover:opacity-90"
                      >
                        <Upload className="w-3.5 h-3.5" /> Image
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Nom" className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                        <select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm">
                          {WORKSHOP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input value={edit.month} onChange={(e) => setEdit({ ...edit, month: e.target.value })} placeholder="Mois" className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                        <input value={edit.day} onChange={(e) => setEdit({ ...edit, day: e.target.value })} placeholder="Jour" className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                        <input value={edit.place} onChange={(e) => setEdit({ ...edit, place: e.target.value })} placeholder="Lieu" className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                        <input value={edit.time} onChange={(e) => setEdit({ ...edit, time: e.target.value })} placeholder="Heure" className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                      </div>
                      <textarea value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} rows={3} placeholder="Description" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                    </div>
                    <div className="flex md:flex-col gap-2">
                      <button onClick={saveEdit} className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-semibold hover:opacity-90">
                        <Save className="w-4 h-4" /> Enregistrer
                      </button>
                      <button onClick={() => { setEditingId(null); setEdit(null); }} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted grid place-items-center shrink-0">
                      {w.image_url ? <img src={w.image_url} alt={w.name} className="w-full h-full object-cover" /> : <span className="text-[10px] text-muted-foreground">—</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{w.name}</div>
                      <div className="text-xs text-muted-foreground">{w.category}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {[w.month, w.day].filter(Boolean).join(" ")} · {w.place} · {w.time}
                      </div>
                    </div>
                    <button onClick={() => startEdit(w)} className="p-2 rounded-md hover:bg-muted" title="Modifier">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => doRemove(w.id, w.name)} className="p-2 rounded-md hover:bg-destructive/10 text-destructive" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
