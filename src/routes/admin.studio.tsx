import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Plus, Loader2, Save } from "lucide-react";
import { Mic, Music2, SlidersHorizontal, Building2, Video, GraduationCap } from "lucide-react";
import PageEditor from "@/components/admin/PageEditor";
import {
  useStudioServices,
  addStudioService,
  updateStudioService,
  removeStudioService,
  STUDIO_SERVICE_ICONS,
  type StudioService,
  type StudioServiceIcon,
} from "@/lib/studio-services";
import {
  useStudioTags,
  addStudioTag,
  updateStudioTag,
  removeStudioTag,
  type StudioTag,
} from "@/lib/studio-tags";

export const Route = createFileRoute("/admin/studio")({
  component: AdminStudio,
});

const ICON_MAP: Record<StudioServiceIcon, React.ReactNode> = {
  mic: <Mic className="w-4 h-4" />,
  music: <Music2 className="w-4 h-4" />,
  sliders: <SlidersHorizontal className="w-4 h-4" />,
  building: <Building2 className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  graduation: <GraduationCap className="w-4 h-4" />,
};

const ICON_LABELS: Record<StudioServiceIcon, string> = {
  mic: "Micro",
  music: "Musique",
  sliders: "Mixage",
  building: "Bâtiment",
  video: "Vidéo",
  graduation: "Coaching",
};

function AdminStudio() {
  return (
    <div className="space-y-8">
      <PageEditor pageId="studio" />
      <StudioServicesPanel />
      <StudioTagsPanel />
    </div>
  );
}

function StudioServicesPanel() {
  const { services, loading, reload } = useStudioServices();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<StudioServiceIcon>("mic");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<StudioService | null>(null);

  const canAdd = title.trim() && !saving;

  const submit = async () => {
    if (!canAdd) return;
    setSaving(true);
    setError(null);
    const { error: err } = await addStudioService({ title: title.trim(), description, icon });
    setSaving(false);
    if (err) return setError(err.message);
    setTitle("");
    setDescription("");
    setIcon("mic");
    reload();
  };

  const startEdit = (s: StudioService) => {
    setEditingId(s.id);
    setEdit({ ...s });
  };

  const saveEdit = async () => {
    if (!edit) return;
    const { id, sort_order: _s, ...patch } = edit;
    void _s;
    const { error: err } = await updateStudioService(id, patch);
    if (err) {
      setError(err.message);
      return;
    }
    setEditingId(null);
    setEdit(null);
    reload();
  };

  const doRemove = async (id: string, n: string) => {
    if (!confirm(`Supprimer le service "${n}" ?`)) return;
    await removeStudioService(id);
    reload();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display tracking-wide text-2xl">Services du studio</h2>
        <p className="text-sm text-muted-foreground">
          Ajoutez, modifiez ou supprimez les cartes affichées dans "Nos Services".
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-sm">Ajouter un service</h3>
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <select
            value={icon}
            onChange={(e) => setIcon(e.target.value as StudioServiceIcon)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {STUDIO_SERVICE_ICONS.map((i) => (
              <option key={i} value={i}>
                {ICON_LABELS[i]}
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du service"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Description"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          onClick={submit}
          disabled={!canAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}{" "}
          Ajouter
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div className="space-y-3">
          {services.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun service pour le moment.</p>
          )}
          {services.map((s) => {
            const isEditing = editingId === s.id && edit;
            return (
              <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                {isEditing && edit ? (
                  <div className="grid gap-3 md:grid-cols-[160px_1fr_auto]">
                    <select
                      value={edit.icon}
                      onChange={(e) =>
                        setEdit({ ...edit, icon: e.target.value as StudioServiceIcon })
                      }
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    >
                      {STUDIO_SERVICE_ICONS.map((i) => (
                        <option key={i} value={i}>
                          {ICON_LABELS[i]}
                        </option>
                      ))}
                    </select>
                    <div className="space-y-2">
                      <input
                        value={edit.title}
                        onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      />
                      <textarea
                        value={edit.description}
                        onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                        rows={2}
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div className="flex md:flex-col gap-2">
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
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                      {ICON_MAP[s.icon]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{s.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.description}</div>
                    </div>
                    <button
                      onClick={() => startEdit(s)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => doRemove(s.id, s.title)}
                      className="p-2 rounded-md hover:bg-destructive/10 text-destructive"
                      title="Supprimer"
                    >
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

function StudioTagsPanel() {
  const { tags, loading, reload } = useStudioTags();
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const canAdd = label.trim() && !saving;

  const submit = async () => {
    if (!canAdd) return;
    setSaving(true);
    setError(null);
    const { error: err } = await addStudioTag({ label: label.trim() });
    setSaving(false);
    if (err) return setError(err.message);
    setLabel("");
    reload();
  };

  const startEdit = (t: StudioTag) => {
    setEditingId(t.id);
    setEditLabel(t.label);
  };

  const saveEdit = async (id: string) => {
    if (!editLabel.trim()) return;
    const { error: err } = await updateStudioTag(id, { label: editLabel.trim() });
    if (err) {
      setError(err.message);
      return;
    }
    setEditingId(null);
    reload();
  };

  const doRemove = async (id: string, n: string) => {
    if (!confirm(`Supprimer le profil "${n}" ?`)) return;
    await removeStudioTag(id);
    reload();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display tracking-wide text-2xl">Profils ("Pour qui ?")</h2>
        <p className="text-sm text-muted-foreground">
          Ajoutez, modifiez ou supprimez les profils affichés dans "Pour qui ?".
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex : Chorégraphes"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={submit}
            disabled={!canAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}{" "}
            Ajouter
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun profil pour le moment.</p>
          )}
          {tags.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 rounded-full border border-border bg-card pl-4 pr-2 py-1.5"
            >
              {editingId === t.id ? (
                <>
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(t.id)}
                    autoFocus
                    className="w-32 rounded-md border border-border bg-background px-2 py-0.5 text-sm"
                  />
                  <button
                    onClick={() => saveEdit(t.id)}
                    className="p-1 rounded hover:bg-muted"
                    title="Enregistrer"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(t)} className="text-sm font-semibold">
                    {t.label}
                  </button>
                  <button
                    onClick={() => doRemove(t.id, t.label)}
                    className="p-1 rounded hover:bg-destructive/10 text-destructive"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
