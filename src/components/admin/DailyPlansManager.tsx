import { useRef, useState } from "react";
import { Trash2, Plus, Loader2, Upload, X, Pencil, Save } from "lucide-react";
import {
  PLAN_DAYS,
  isPlanDay,
  useDailyPlans,
  addDailyPlan,
  updateDailyPlan,
  removeDailyPlan,
  type DailyPlan,
} from "@/lib/daily-plans";
import { uploadSiteImage } from "@/lib/site-images";

const DAY_LABELS: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche",
};

export default function DailyPlansManager() {
  const { plans, loading, reload } = useDailyPlans();
  const [day, setDay] = useState<string>(PLAN_DAYS[0]);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ day: string; title: string; image_url: string } | null>(null);
  const editFileRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File, target: "new" | "edit") => {
    setError(null);
    if (file.size > 3 * 1024 * 1024) {
      setError("Image trop lourde (max 3 Mo).");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadSiteImage(file, "plans");
      if (target === "new") setImageUrl(url);
      else setEdit((e) => (e ? { ...e, image_url: url } : e));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  const canAdd = isPlanDay(day) && imageUrl.trim() && !saving && !uploading;

  const submit = async () => {
    if (!canAdd) return;
    setSaving(true);
    setError(null);
    const { error: err } = await addDailyPlan({
      day,
      title: title.trim(),
      image_url: imageUrl,
    });
    setSaving(false);
    if (err) return setError(err.message);
    setTitle("");
    setImageUrl("");
    if (fileRef.current) fileRef.current.value = "";
    reload();
  };

  const startEdit = (p: DailyPlan) => {
    setEditingId(p.id);
    setEdit({ day: p.day, title: p.title, image_url: p.image_url });
  };

  const saveEdit = async () => {
    if (!edit) return;
    const { error: err } = await updateDailyPlan(editingId!, edit);
    if (err) return setError(err.message);
    setEditingId(null);
    setEdit(null);
    reload();
  };

  const doRemove = async (p: DailyPlan) => {
    if (!confirm(`Supprimer ce plan de ${DAY_LABELS[p.day] ?? p.day} ?`)) return;
    const { error: err } = await removeDailyPlan(p.id);
    if (err) return setError(err.message);
    reload();
  };

  // Group by day in week order, keeping each day's own sort order.
  const grouped = PLAN_DAYS.map((d) => ({
    day: d,
    items: plans
      .filter((p) => p.day === d)
      .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)),
  })).filter((g) => g.items.length > 0);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-display tracking-wide text-3xl">Plans du semaine</h2>
        <p className="text-sm text-muted-foreground">
          Ajoutez les images de planning affichées sur la page Cours & Activités. Chaque jour peut
          contenir plusieurs plans.
        </p>
      </div>

      {/* Add form */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-semibold">Ajouter un plan</h3>
        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
          <div>
            <div className="w-full aspect-square rounded-lg overflow-hidden border border-border bg-muted grid place-items-center">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
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
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-secondary text-secondary-foreground px-3 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-40"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {uploading ? "Envoi…" : imageUrl ? "Changer" : "Image"}
              </button>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl("");
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
                <label className="text-xs font-semibold">Jour</label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {PLAN_DAYS.map((d) => (
                    <option key={d} value={d}>
                      {DAY_LABELS[d]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold">Légende (facultatif)</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex : Planning soir"
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun plan pour le moment.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.day} className="space-y-3">
              <h3 className="font-display text-xl tracking-wide">{DAY_LABELS[g.day]}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((p) => {
                  const isEditing = editingId === p.id && edit;
                  return (
                    <div key={p.id} className="rounded-xl border border-border bg-card p-3">
                      {isEditing && edit ? (
                        <div className="space-y-2">
                          <div className="w-full aspect-square rounded-lg overflow-hidden border border-border bg-muted grid place-items-center">
                            {edit.image_url ? (
                              <img
                                src={edit.image_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
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
                              if (editFileRef.current) editFileRef.current.value = "";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => editFileRef.current?.click()}
                            disabled={uploading}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-secondary text-secondary-foreground px-3 py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-40"
                          >
                            {uploading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            {uploading ? "Envoi…" : "Changer l'image"}
                          </button>
                          <select
                            value={edit.day}
                            onChange={(e) => setEdit({ ...edit, day: e.target.value })}
                            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                          >
                            {PLAN_DAYS.map((d) => (
                              <option key={d} value={d}>
                                {DAY_LABELS[d]}
                              </option>
                            ))}
                          </select>
                          <input
                            value={edit.title}
                            onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                            placeholder="Légende"
                            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-semibold hover:opacity-90"
                            >
                              <Save className="w-4 h-4" /> Enregistrer
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEdit(null);
                              }}
                              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted grid place-items-center">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.title || `Plan ${DAY_LABELS[p.day]}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground truncate">
                              {p.title || DAY_LABELS[p.day]}
                            </span>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => startEdit(p)}
                                className="p-1.5 rounded-md hover:bg-muted"
                                title="Modifier"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => doRemove(p)}
                                className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
