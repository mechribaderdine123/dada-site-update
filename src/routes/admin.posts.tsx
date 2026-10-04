import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X, Clock, CheckCircle2, XCircle, Image as ImageIcon, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/music-url";
import type { ApprovalStatus } from "@/lib/auth";

type PostRow = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  status: ApprovalStatus;
  created_at: string;
  profiles?: { artist_name: string; email: string } | null;
};

export const Route = createFileRoute("/admin/posts")({
  component: AdminPosts,
});

function AdminPosts() {
  const [filter, setFilter] = useState<ApprovalStatus>("pending");
  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: posts } = await supabase
      .from("feed_posts")
      .select("*")
      .eq("status", filter)
      .order("created_at", { ascending: false });
    const list = (posts as Omit<PostRow, "profiles">[]) ?? [];
    const ids = Array.from(new Set(list.map((p) => p.user_id)));
    let byId = new Map<string, { artist_name: string; email: string }>();
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, artist_name, email")
        .in("id", ids);
      byId = new Map(
        (profs ?? []).map((p: { id: string; artist_name: string; email: string }) => [
          p.id,
          { artist_name: p.artist_name, email: p.email },
        ]),
      );
    }
    const enriched = await Promise.all(
      list.map(async (p) => ({
        ...p,
        image_url: (await signedUrl("feed-images", p.image_url)) ?? "",
        profiles: byId.get(p.user_id) ?? null,
      })),
    );
    setRows(enriched);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const setStatus = async (id: string, status: ApprovalStatus) => {
    setBusy(id);
    await supabase.from("feed_posts").update({ status }).eq("id", id);
    setBusy(null);
    load();
  };

  const remove = async (row: PostRow) => {
    if (!confirm("Supprimer définitivement ce post ?")) return;
    setBusy(row.id);
    await supabase.storage.from("feed-images").remove([row.image_url]);
    await supabase.from("feed_posts").delete().eq("id", row.id);
    setBusy(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display tracking-wide text-3xl">Posts & images</h1>
        <p className="text-sm text-muted-foreground">
          Chaque post reste privé jusqu'à votre approbation.
        </p>
      </div>

      <div className="flex gap-2">
        {(["pending", "approved", "rejected"] as ApprovalStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 border ${
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-muted border-border"
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
          Aucun post{" "}
          {filter === "pending" ? "en attente" : filter === "approved" ? "approuvé" : "refusé"}.
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-card p-5 flex flex-col md:flex-row gap-4 md:items-center md:justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden shrink-0 grid place-items-center">
                  <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-lg">{p.profiles?.artist_name ?? "—"}</p>
                  {p.caption && <p className="text-sm text-muted-foreground">{p.caption}</p>}
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
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
                <button
                  disabled={busy === p.id}
                  onClick={() => remove(p)}
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
