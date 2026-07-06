import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X, Clock, CheckCircle2, XCircle, Mail, MapPin, Music, Trash2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { signedMusicUrl } from "@/lib/music-url";
import { deleteArtistAccount } from "@/lib/api/admin-users.functions";
import type { Profile, ApprovalStatus } from "@/lib/auth";

export const Route = createFileRoute("/admin/accounts")({
  component: AdminAccounts,
});

function AdminAccounts() {
  const [filter, setFilter] = useState<ApprovalStatus>("pending");
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("status", filter)
      .order("created_at", { ascending: false });
    if (!error) {
      const list = (data as Profile[]) ?? [];
      const resolved = await Promise.all(
        list.map(async (p) => ({ ...p, avatar_url: await signedMusicUrl(p.avatar_url) })),
      );
      setRows(resolved);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const setStatus = async (id: string, status: ApprovalStatus) => {
    setBusy(id);
    await supabase.from("profiles").update({ status }).eq("id", id);
    setBusy(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display tracking-wide text-3xl">Comptes artistes</h1>
        <p className="text-sm text-muted-foreground">Approuvez ou refusez les nouveaux comptes.</p>
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
          Aucun compte {filter === "pending" ? "en attente" : filter === "approved" ? "approuvé" : "refusé"}.
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-muted overflow-hidden shrink-0 grid place-items-center text-lg font-bold text-muted-foreground">
                  {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : p.artist_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="font-bold text-lg">{p.artist_name}</p>
                  <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {p.email}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {p.genre && <span className="inline-flex items-center gap-1"><Music className="w-3 h-3" /> {p.genre}</span>}
                    {p.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.city}</span>}
                  </div>
                  {p.bio && <p className="mt-2 text-sm text-foreground/80 max-w-xl line-clamp-3">{p.bio}</p>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {filter !== "approved" && (
                  <button
                    disabled={busy === p.id}
                    onClick={() => setStatus(p.id, "approved")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" /> Approuver
                  </button>
                )}
                {filter !== "rejected" && (
                  <button
                    disabled={busy === p.id}
                    onClick={() => setStatus(p.id, "rejected")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                  >
                    <X className="w-4 h-4" /> Refuser
                  </button>
                )}
                {filter !== "pending" && (
                  <button
                    disabled={busy === p.id}
                    onClick={() => setStatus(p.id, "pending")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted"
                  >
                    <Clock className="w-4 h-4" /> Remettre en attente
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
