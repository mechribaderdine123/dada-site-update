import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X, Clock, CheckCircle2, XCircle, Music as MusicIcon, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ApprovalStatus } from "@/lib/auth";

type TrackRow = {
  id: string;
  user_id: string;
  title: string;
  genre: string | null;
  cover_url: string | null;
  audio_url: string | null;
  status: ApprovalStatus;
  created_at: string;
  profiles?: { artist_name: string; email: string } | null;
};

export const Route = createFileRoute("/admin/tracks")({
  component: AdminTracks,
});

function AdminTracks() {
  const [filter, setFilter] = useState<ApprovalStatus>("pending");
  const [rows, setRows] = useState<TrackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tracks")
      .select("*, profiles!inner(artist_name, email)")
      .eq("status", filter)
      .order("created_at", { ascending: false });
    setRows((data as TrackRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const setStatus = async (id: string, status: ApprovalStatus) => {
    setBusy(id);
    await supabase.from("tracks").update({ status }).eq("id", id);
    setBusy(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer définitivement ce morceau ?")) return;
    setBusy(id);
    await supabase.from("tracks").delete().eq("id", id);
    setBusy(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display tracking-wide text-3xl">Musiques</h1>
        <p className="text-sm text-muted-foreground">Approuvez, refusez ou supprimez les morceaux soumis.</p>
      </div>

      <div className="flex gap-2">
        {(["pending", "approved", "rejected"] as ApprovalStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 border ${
              filter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted border-border"
            }`}
          >
            {s === "pending" && <Clock className="w-4 h-4" />}
            {s === "approved" && <CheckCircle2 className="w-4 h-4" />}
            {s === "rejected" && <XCircle className="w-4 h-4" />}
            {s === "pending" ? "En attente" : s === "approved" ? "Approuvés" : "Refusés"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Aucun morceau {filter === "pending" ? "en attente" : filter === "approved" ? "approuvé" : "refusé"}.
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-5 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0 grid place-items-center">
                  {t.cover_url ? (
                    <img src={t.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <MusicIcon className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-lg">{t.title}</p>
                  <p className="text-sm text-muted-foreground">
                    par <span className="font-semibold text-foreground">{t.profiles?.artist_name ?? "—"}</span>
                    {t.genre && <> · {t.genre}</>}
                  </p>
                  {t.audio_url && (
                    <audio controls src={t.audio_url} className="mt-2 h-9" preload="none" />
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {filter !== "approved" && (
                  <button
                    disabled={busy === t.id}
                    onClick={() => setStatus(t.id, "approved")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" /> Approuver
                  </button>
                )}
                {filter !== "rejected" && (
                  <button
                    disabled={busy === t.id}
                    onClick={() => setStatus(t.id, "rejected")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                  >
                    <X className="w-4 h-4" /> Refuser
                  </button>
                )}
                <button
                  disabled={busy === t.id}
                  onClick={() => remove(t.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted"
                >
                  <Trash2 className="w-4 h-4" /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
