import { useEffect, useMemo, useRef, useState } from "react";
import { PAGE_SCHEMAS, type EditableField } from "@/lib/content-schema";
import { setContent, useContent } from "@/lib/site-content";
import { uploadSiteImage } from "@/lib/site-images";
import { Save, RotateCcw, Upload, Check, Loader2 } from "lucide-react";

export default function PageEditor({ pageId }: { pageId: string }) {
  const page = useMemo(() => PAGE_SCHEMAS.find((p) => p.id === pageId), [pageId]);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  if (!page) return <p>Page introuvable.</p>;

  const notifySaved = (key: string) => {
    setSavedKey(key);
    setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display tracking-wide text-3xl">{page.label}</h1>
          <p className="text-sm text-muted-foreground">
            Modifier les textes et images de la page {page.path}
          </p>
        </div>
        <a
          href={page.path}
          target="_blank"
          rel="noreferrer"
          className="text-sm rounded-lg border border-border px-3 py-2 hover:bg-muted"
        >
          Ouvrir la page ↗
        </a>
      </div>

      <div className="grid gap-4">
        {page.fields.map((f) => (
          <FieldRow
            key={f.key}
            field={f}
            saved={savedKey === f.key}
            onSaved={() => notifySaved(f.key)}
          />
        ))}
      </div>
    </div>
  );
}

function FieldRow({
  field,
  saved,
  onSaved,
}: {
  field: EditableField;
  saved: boolean;
  onSaved: () => void;
}) {
  const current = useContent(field.key, field.default);
  const [value, setValue] = useState(current);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setValue(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const dirty = value !== current;

  const save = () => {
    setContent(field.key, value === field.default ? "" : value);
    onSaved();
  };

  const reset = () => {
    setContent(field.key, "");
    setValue(field.default);
    onSaved();
  };

  const handleFile = async (file: File) => {
    if (file.size > 3 * 1024 * 1024) {
      alert("Image trop lourde (max 3 Mo). Compressez-la avant de l'importer.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await uploadSiteImage(file, "pages");
      setValue(url);
      await setContent(field.key, url);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold">{field.label}</label>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs text-secondary">
              <Check className="w-3 h-3" /> Enregistré
            </span>
          )}
          <button
            onClick={reset}
            title="Restaurer par défaut"
            className="inline-flex items-center gap-1 text-xs rounded-md border border-border px-2 py-1 hover:bg-muted"
          >
            <RotateCcw className="w-3 h-3" /> Défaut
          </button>
          {field.type !== "image" && (
            <button
              onClick={save}
              disabled={!dirty}
              className="inline-flex items-center gap-1 text-xs rounded-md bg-primary text-primary-foreground px-3 py-1 disabled:opacity-40"
            >
              <Save className="w-3 h-3" /> Enregistrer
            </button>
          )}
        </div>
      </div>

      {field.type === "text" && (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      )}

      {field.type === "textarea" && (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed"
        />
      )}

      {field.type === "image" && (
        <div className="flex items-center gap-4">
          <div className="w-32 h-24 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
            {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : null}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 text-sm rounded-lg bg-primary text-primary-foreground px-3 py-2 hover:opacity-90 disabled:opacity-40"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? "Envoi…" : "Changer l'image"}
            </button>
            <p className="mt-2 text-xs text-muted-foreground">PNG / JPG — max 3 Mo</p>
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
