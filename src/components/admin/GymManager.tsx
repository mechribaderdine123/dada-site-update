import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Dumbbell,
  Users,
  ListChecks,
  TicketPercent,
  CalendarCheck,
  Plus,
  Pencil,
  RefreshCw,
  Trash2,
  Printer,
  Download,
  Upload,
  Pause,
  Ban,
  Play,
  History,
  Maximize2,
  Minimize2,
  Eye,
  Receipt,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import {
  DEFAULT_PROMOS,
  type GymBackup,
  type GymImportPreview,
  importGymBackup,
  parseGymBackup,
  previewGymImport,
  assStatus,
  daysLeft,
  fd,
  getAssFin,
  getCoursInfo,
  getFin,
  insertCours,
  insertInscription,
  deleteCours,
  deleteInscription,
  getPromoByCode,
  payeStatus,
  pd,
  GYM_PERIODS,
  inBucket,
  inPeriod,
  inPrevPeriod,
  periodBuckets,
  periodLabel,
  periodTrend,
  type GymPeriod,
  setPresence,
  subStatus,
  todayISO,
  updateCours,
  updateInscription,
  useGymData,
  type GymCours,
  type GymInscription,
  type GymInscriptionInput,
  type GymPromo,
} from "@/lib/gym";

type Tab = "dash" | "membres" | "cours" | "promos" | "presence";

const COULEURS = ["#00e5d4", "#ff3b3b", "#00d68f", "#ffb800", "#9d7cf4", "#f97316", "#333333"];

function badgeColor(status: string): string {
  switch (status) {
    case "active":
    case "P":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "soon":
    case "Pa":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "expired":
    case "N":
    case "np":
      return "bg-red-500/10 text-red-400 border-red-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function Badge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badgeColor(status)}`}
    >
      {label}
    </span>
  );
}

export default function GymManager() {
  const { cours, inscriptions, presences, loading, error, reload } = useGymData();
  const [tab, setTab] = useState<Tab>("dash");
  const [importOpen, setImportOpen] = useState(false);
  const gymRef = useRef<HTMLDivElement | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const sync = () =>
      setFullscreen(!!gymRef.current && document.fullscreenElement === gymRef.current);
    document.addEventListener("fullscreenchange", sync);
    sync();
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  // Leaving the module must not trap the browser in fullscreen: once its
  // container is detached from the document, fullscreen is released.
  useEffect(
    () => () => {
      const el = document.fullscreenElement;
      if (el && !document.body.contains(el)) void document.exitFullscreen().catch(() => {});
    },
    [],
  );

  // Opening the module goes fullscreen; requests are honoured thanks to the
  // click that led here and simply ignored when the browser refuses. The
  // container only exists once the data has loaded, hence the `loading` guard.
  const autoFullscreenTried = useRef(false);
  useEffect(() => {
    if (loading || autoFullscreenTried.current) return;
    autoFullscreenTried.current = true;
    if (!document.fullscreenEnabled || document.fullscreenElement) return;
    void gymRef.current?.requestFullscreen().catch(() => {});
  }, [loading]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === gymRef.current) {
        await document.exitFullscreen();
        return;
      }
      if (document.fullscreenElement) await document.exitFullscreen();
      await gymRef.current?.requestFullscreen();
    } catch {
      /* the browser may refuse (no user gesture) — the UI stays usable */
    }
  };

  const stats = useMemo(() => {
    const total = inscriptions.length;
    const attendu = inscriptions.reduce((a, r) => a + r.mt, 0);
    const encaisse = inscriptions.reduce((a, r) => a + r.ac, 0);
    const actifs = inscriptions.filter((r) => subStatus(r, cours) === "active").length;
    const bientot = inscriptions.filter((r) => subStatus(r, cours) === "soon").length;
    const expires = inscriptions.filter((r) => subStatus(r, cours) === "expired").length;
    const assKo = inscriptions.filter((r) => {
      const s = assStatus(r);
      return s === "expired" || s === "np";
    }).length;
    return { total, attendu, encaisse, actifs, bientot, expires, assKo };
  }, [inscriptions, cours]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-[#050506] p-16 text-sm text-zinc-400">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Chargement de la salle de sport…
      </div>
    );
  }

  return (
    <div
      ref={gymRef}
      className={`space-y-4 ${fullscreen ? "h-full overflow-y-auto bg-[#050506] p-4 md:p-6" : ""}`}
    >
      <div>
        <h1 className="flex items-center gap-2 font-display text-3xl tracking-wide">
          <Dumbbell className="h-7 w-7 text-primary" /> Gestion salle de sport
        </h1>
        <p className="text-sm text-muted-foreground">
          Inscriptions, abonnements, assurances, présences et tarifs — données stockées dans la base
          locale du serveur.
        </p>
      </div>
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}
      <div className="rounded-2xl border border-white/10 bg-[#050506] text-zinc-200 shadow-2xl">
        {/* App topbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#0e0e12] px-4 py-3">
          {(
            [
              ["dash", "Tableau de bord", BarChart3],
              ["membres", "Adhérents", Users],
              ["cours", "Cours & tarifs", ListChecks],
              ["promos", "Réductions", TicketPercent],
              ["presence", "Présences", CalendarCheck],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === id ? "bg-[#00e5d4] text-black" : "text-zinc-400 hover:bg-white/5"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-300 hover:bg-white/5 hover:text-[#00e5d4]"
              title={
                fullscreen ? "Quitter le plein écran (Échap)" : "Afficher la gestion en plein écran"
              }
            >
              {fullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
              {fullscreen ? "Quitter" : "Plein écran"}
            </button>
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-300 hover:bg-white/5 hover:text-[#00e5d4]"
              title="Importer une sauvegarde JSON de l'ancienne application"
            >
              <Upload className="h-3.5 w-3.5" /> Importer
            </button>
          </div>
          <span className="text-[11px] text-zinc-500">
            {stats.total} inscrit(s) · {stats.actifs} abonnement(s) actif(s)
          </span>
        </div>

        <div className="p-4">
          {tab === "dash" && (
            <DashTab
              stats={stats}
              inscriptions={inscriptions}
              cours={cours}
              onOpenMember={() => setTab("membres")}
            />
          )}
          {tab === "membres" && (
            <MembresTab
              inscriptions={inscriptions}
              cours={cours}
              promos={DEFAULT_PROMOS}
              reload={reload}
            />
          )}
          {tab === "cours" && <CoursTab cours={cours} reload={reload} />}
          {tab === "promos" && <PromosTab inscriptions={inscriptions} />}{" "}
          {tab === "presence" && (
            <PresenceTab
              inscriptions={inscriptions}
              cours={cours}
              presences={presences}
              reload={reload}
            />
          )}
        </div>
      </div>{" "}
      {importOpen && (
        <ImportModal
          existingCours={cours}
          onClose={() => {
            setImportOpen(false);
            // Refresh after the modal closes so its result banner stays visible.
            reload();
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ shared -- */

type Stats = {
  total: number;
  attendu: number;
  encaisse: number;
  actifs: number;
  bientot: number;
  expires: number;
  assKo: number;
};

function Kpi({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#14141a] p-3.5">
      <div className="text-[9px] font-semibold uppercase tracking-widest text-zinc-500">
        {label}
      </div>
      <div className="font-display text-2xl tracking-wide" style={{ color }}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-zinc-500">{sub}</div>}
    </div>
  );
}

function fmtDT(n: number): string {
  return `${n.toLocaleString("fr-FR")} DT`;
}

/* ------------------------------------------------------------ period stats -- */

function PeriodCard({
  icon,
  label,
  value,
  trend,
  trendTone,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  trendTone: "up" | "down" | "eq";
  color: string;
  bg: string;
}) {
  const tone =
    trendTone === "up"
      ? "text-emerald-400"
      : trendTone === "down"
        ? "text-red-400"
        : "text-zinc-600";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#14141a] p-3.5">
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-base"
        style={{ background: bg }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[9px] font-semibold uppercase tracking-widest text-zinc-500">
          {label}
        </div>
        <div className="font-display text-xl leading-tight" style={{ color }}>
          {value}
        </div>
        <div className={`text-[10px] font-semibold ${tone}`}>{trend}</div>
      </div>
    </div>
  );
}

function Bars({
  values,
  labels,
  color,
  tooltip,
}: {
  values: number[];
  labels: string[];
  color: string;
  tooltip: (v: number) => string;
}) {
  const max = Math.max(...values, 1);
  const last = values.length - 1;
  return (
    <div className="flex h-[110px] items-end gap-1 pb-5">
      {values.map((v, i) => {
        const isCur = i === last;
        return (
          <div
            key={`${labels[i]}-${i}`}
            className="group relative flex h-full flex-1 flex-col justify-end"
          >
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-[#1c1c24] px-1.5 py-0.5 text-[9px] opacity-0 transition-opacity group-hover:opacity-100">
              {tooltip(v)}
            </span>
            <div
              className={`w-full rounded-t-[3px] transition-opacity ${isCur ? "" : "opacity-40 group-hover:opacity-75"}`}
              style={{
                height: `${Math.round((v / max) * 90)}px`,
                background: color,
                boxShadow: isCur ? `0 0 10px ${color}40` : undefined,
              }}
            >
              {v > 0 && (
                <span className="absolute -top-3.5 left-0 w-full text-center font-mono text-[8px] text-zinc-500">
                  {v}
                </span>
              )}
            </div>
            <span className="absolute bottom-4 left-0 w-full text-center text-[8px] text-zinc-600">
              {labels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PeriodStats({ inscriptions }: { inscriptions: GymInscription[] }) {
  const [period, setPeriod] = useState<GymPeriod>("day");

  const data = useMemo(() => {
    const buckets = periodBuckets(period);
    const counts = buckets.map(
      (b) => inscriptions.filter((r) => inBucket(r, b.key, period)).length,
    );
    const sums = buckets.map((b) =>
      inscriptions
        .filter((r) => inBucket(r, b.key, period))
        .reduce((a, r) => a + Number(r.ac || 0), 0),
    );
    const cur = inscriptions.filter((r) => inPeriod(r, period));
    const prev = inscriptions.filter((r) => inPrevPeriod(r, period));
    const encaissé = cur.reduce((a, r) => a + Number(r.ac || 0), 0);
    const prevEncaisse = prev.reduce((a, r) => a + Number(r.ac || 0), 0);
    return {
      buckets,
      counts,
      sums,
      inscrits: cur.length,
      prevInscrits: prev.length,
      encaissé,
      prevEncaisse,
      payes: cur.filter((r) => payeStatus(r) === "P").length,
      mineurs: cur.filter((r) => r.statut === "Mineur").length,
      totalInscrits: counts.reduce((a, b) => a + b, 0),
      totalEncaisse: sums.reduce((a, b) => a + b, 0),
    };
  }, [inscriptions, period]);

  const label = periodLabel(period);
  const nb = data.inscrits;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-4 w-[3px] rounded bg-[#00e5d4]" />
          <span className="font-display text-base tracking-[2px] uppercase">
            Statistiques par période
          </span>
        </div>
        <div className="flex gap-1 rounded-lg border border-white/10 bg-[#14141a] p-[3px]">
          {GYM_PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition ${
                period === p.id ? "bg-[#00e5d4] text-black" : "text-zinc-400 hover:bg-white/5"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <PeriodCard
          icon={<Users className="h-4 w-4 text-[#00e5d4]" />}
          label={`Inscrits — ${label}`}
          value={String(data.inscrits)}
          trend={periodTrend(data.inscrits, data.prevInscrits).text}
          trendTone={periodTrend(data.inscrits, data.prevInscrits).tone}
          color="#00e5d4"
          bg="rgba(0,229,212,0.08)"
        />
        <PeriodCard
          icon={<span className="text-emerald-400">💰</span>}
          label={`Encaissé — ${label}`}
          value={fmtDT(data.encaissé)}
          trend={periodTrend(data.encaissé, data.prevEncaisse).text}
          trendTone={periodTrend(data.encaissé, data.prevEncaisse).tone}
          color="#00d68f"
          bg="rgba(0,214,143,0.08)"
        />
        <PeriodCard
          icon={<span className="text-amber-400">✅</span>}
          label={`Dossiers payés — ${label}`}
          value={String(data.payes)}
          trend={`sur ${nb} inscrits`}
          trendTone="eq"
          color="#ffb800"
          bg="rgba(255,184,0,0.08)"
        />
        <PeriodCard
          icon={<span className="text-violet-400">👦</span>}
          label={`Mineurs — ${label}`}
          value={String(data.mineurs)}
          trend={`parmi ${nb} inscrits`}
          trendTone="eq"
          color="#9d7cf4"
          bg="rgba(157,124,244,0.08)"
        />
      </div>

      <div className="grid gap-2.5 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#14141a] p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Inscriptions — {label}
            </span>
            <span className="font-display text-lg text-[#00e5d4]">{data.totalInscrits}</span>
          </div>
          <Bars
            values={data.counts}
            labels={data.buckets.map((b) => b.label)}
            color="#00e5d4"
            tooltip={(v) => `${v} inscription(s)`}
          />
        </div>
        <div className="rounded-xl border border-white/10 bg-[#14141a] p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Encaissements — {label}
            </span>
            <span className="font-display text-lg text-[#00e5d4]">{fmtDT(data.totalEncaisse)}</span>
          </div>
          <Bars
            values={data.sums}
            labels={data.buckets.map((b) => b.label)}
            color="#00d68f"
            tooltip={(v) => fmtDT(v)}
          />
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- dashboard -- */

function DashTab({
  stats,
  inscriptions,
  cours,
  onOpenMember,
}: {
  stats: Stats;
  inscriptions: GymInscription[];
  cours: GymCours[];
  onOpenMember: () => void;
}) {
  const alerts = useMemo(() => {
    const list: Array<{
      r: GymInscription;
      kind: "abo" | "ass";
      fin: Date | null;
      dl: number | null;
      s: string;
    }> = [];
    inscriptions.forEach((r) => {
      const abo = subStatus(r, cours);
      if (abo === "expired" || abo === "soon")
        list.push({
          r,
          kind: "abo",
          fin: getFin(r, cours),
          dl: daysLeft(getFin(r, cours)),
          s: abo,
        });
      const ass = assStatus(r);
      if (ass === "expired" || ass === "soon")
        list.push({ r, kind: "ass", fin: getAssFin(r), dl: daysLeft(getAssFin(r)), s: ass });
    });
    return list.sort((a, b) => (a.dl ?? -9999) - (b.dl ?? -9999));
  }, [inscriptions, cours]);

  const recouvrement = stats.attendu > 0 ? Math.round((stats.encaisse / stats.attendu) * 100) : 0;

  const parCours = useMemo(() => {
    const map = new Map<string, number>();
    inscriptions.forEach((r) => map.set(r.cn, (map.get(r.cn) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [inscriptions]);

  return (
    <div className="space-y-4">
      <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi
          label="Total inscrits"
          value={String(stats.total)}
          color="#00e5d4"
          sub={`${inscriptions.filter((r) => r.statut === "Mineur").length} mineur(s)`}
        />
        <Kpi
          label="Encaissé"
          value={fmtDT(stats.encaisse)}
          color="#00d68f"
          sub={`/ ${fmtDT(stats.attendu)} attendus`}
        />
        <Kpi
          label="Reste"
          value={fmtDT(stats.attendu - stats.encaisse)}
          color="#ffb800"
          sub={`${recouvrement}% recouvré`}
        />
        <Kpi
          label="Abonnements actifs"
          value={String(stats.actifs)}
          color="#00d68f"
          sub={`${stats.bientot} expirent bientôt`}
        />
        <Kpi
          label="Abos expirés"
          value={String(stats.expires)}
          color="#ff3b3b"
          sub="à renouveler"
        />
        <Kpi
          label="Assurances KO"
          value={String(stats.assKo)}
          color="#9d7cf4"
          sub="expirées ou non payées"
        />
      </div>

      {alerts.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="border-b border-white/5 px-4 py-2 font-display text-xs tracking-widest text-amber-400">
            ⚠ {alerts.length} renouvellement(s) nécessaire(s)
          </div>
          {alerts.slice(0, 6).map((a, i) => (
            <div
              key={`${a.r.id}-${a.kind}-${i}`}
              className="flex items-center gap-3 border-t border-white/5 px-4 py-2 text-xs"
            >
              <span>{a.s === "expired" ? "❌" : "⚠️"}</span>
              <div className="flex-1">
                <b>{a.r.nom}</b>
                <span className="ml-2 text-zinc-500">
                  {a.kind === "ass" ? "[Assurance]" : "[Abonnement]"} {a.r.cn}
                </span>
              </div>
              <span className="text-zinc-500">{fd(a.fin)}</span>
              <Badge status={a.s} label={a.dl !== null && a.dl >= 0 ? `${a.dl}j` : "expiré"} />
            </div>
          ))}
        </div>
      )}

      <PeriodStats inscriptions={inscriptions} />

      <div className="grid gap-2.5 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#14141a] p-4">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Paiements global
          </div>
          {(
            [
              ["Payé", inscriptions.filter((r) => payeStatus(r) === "P").length, "bg-emerald-500"],
              [
                "Partiel",
                inscriptions.filter((r) => payeStatus(r) === "Pa").length,
                "bg-amber-500",
              ],
              ["Non payé", inscriptions.filter((r) => payeStatus(r) === "N").length, "bg-red-500"],
            ] as const
          ).map(([label, count, bar]) => {
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div key={label} className="mb-2.5 last:mb-0">
                <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                  <span>{label}</span>
                  <span>
                    {count} ({pct}%)
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          <button
            onClick={onOpenMember}
            className="mt-3 text-[11px] font-semibold text-[#00e5d4] hover:underline"
          >
            Voir les adhérents →
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#14141a] p-4">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Répartition par cours
          </div>
          {parCours.length === 0 ? (
            <p className="text-xs text-zinc-500">Aucune donnée</p>
          ) : (
            <div className="space-y-2">
              {parCours.map(([nom, count]) => {
                const c = getCoursInfo(cours, nom);
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={nom}>
                    <div className="mb-1 flex justify-between text-[11px]">
                      <span className="text-zinc-300">{nom}</span>
                      <span style={{ color: c?.couleur ?? "#666" }}>{count}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: c?.couleur ?? "#666" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {cours
          .filter((c) => c.tarif > 0)
          .map((c) => (
            <div key={c.id} className="rounded-xl border border-white/10 bg-[#14141a] p-3.5">
              <div className="mb-1.5 h-1.5 w-1.5 rounded-full" style={{ background: c.couleur }} />
              <div className="font-display text-sm tracking-wide">{c.nom}</div>
              <div className="text-[9px] text-zinc-500">
                {c.pub} — {c.duree_mois} mois
              </div>
              <div className="font-display text-xl text-[#00e5d4]">
                {c.tarif} <span className="text-[9px] text-zinc-500">DT</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- action menu -- */

type ActMenuItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
  tone?: "cyan" | "amber" | "green" | "red";
  highlight?: boolean;
  badge?: number;
  disabled?: boolean;
};

const ACT_TONE: Record<NonNullable<ActMenuItem["tone"]>, string> = {
  cyan: "hover:bg-[rgba(0,229,212,0.08)] hover:text-[#00e5d4]",
  amber: "hover:bg-amber-500/10 hover:text-amber-300",
  green: "hover:bg-emerald-500/10 hover:text-emerald-300",
  red: "hover:bg-red-500/10 hover:text-red-400",
};

function ActionMenu({ items, label = "Actions" }: { items: ActMenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menu = menuRef.current;
    const h = menu?.offsetHeight ?? 320;
    const w = menu?.offsetWidth ?? 200;
    const openUp = rect.bottom + h + 8 > window.innerHeight && rect.top > h;
    setPos({
      top: openUp ? Math.max(8, rect.top - h - 4) : rect.bottom + 4,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - w - 8)),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, place]);

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#1c1c24] px-2.5 py-1.5 text-[11px] font-semibold text-zinc-200 transition hover:border-[#00e5d4] hover:text-[#00e5d4]"
      >
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: pos?.top ?? -9999,
            left: pos?.left ?? -9999,
            minWidth: 210,
          }}
          className="z-[9999] overflow-hidden rounded-lg border border-[#00e5d4] bg-[#14141a] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
        >
          {items.map((it, i) => {
            if (it.key.startsWith("#sep"))
              return <div key={`${it.key}-${i}`} className="my-1 h-px bg-white/10" />;
            return (
              <button
                key={it.key}
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onSelect();
                }}
                className={`flex w-full items-center gap-2 border-t border-white/5 px-3.5 py-2 text-left text-xs transition disabled:opacity-40 ${
                  it.highlight ? "text-red-400 " : "text-zinc-400 "
                }${it.tone ? ACT_TONE[it.tone] : "hover:bg-white/5 hover:text-zinc-100"}`}
              >
                <span className="w-4 shrink-0 text-center">{it.icon}</span>
                <span className="flex-1 whitespace-nowrap">{it.label}</span>
                {it.badge !== undefined && it.badge > 0 && (
                  <span className="rounded-full bg-[#00e5d4] px-1.5 py-0.5 text-[8px] font-bold text-black">
                    {it.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- membres -- */

function MembresTab({
  inscriptions,
  cours,
  promos,
  reload,
}: {
  inscriptions: GymInscription[];
  cours: GymCours[];
  promos: GymPromo[];
  reload: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [filterCours, setFilterCours] = useState("");
  const [filterPay, setFilterPay] = useState("");
  const [filterAbo, setFilterAbo] = useState("");
  const [editing, setEditing] = useState<GymInscription | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<GymInscription | null>(null);
  const [renewing, setRenewing] = useState<GymInscription | null>(null);
  const [suspensionTarget, setSuspensionTarget] = useState<GymInscription | null>(null);
  const [historyTarget, setHistoryTarget] = useState<GymInscription | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = inscriptions.filter((r) => {
    if (filterCours && r.cn !== filterCours) return false;
    if (filterPay && payeStatus(r) !== filterPay) return false;
    if (filterAbo && subStatus(r, cours) !== filterAbo) return false;
    if (search) {
      const hay = `${r.nom} ${r.email} ${r.tel} ${r.cin}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const doDelete = async (r: GymInscription) => {
    if (!confirm(`Supprimer définitivement ${r.nom} ? Cette action est irréversible.`)) return;
    setBusy(true);
    try {
      await deleteInscription(r.id);
      await reload();
    } catch (e) {
      alert(`Erreur: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="min-w-[180px] flex-1 rounded-lg border border-white/10 bg-[#0e0e12] px-3 py-2 text-xs outline-none placeholder:text-zinc-600 focus:border-[#00e5d4]"
        />
        <select
          value={filterCours}
          onChange={(e) => setFilterCours(e.target.value)}
          className="rounded-lg border border-white/10 bg-[#0e0e12] px-2 py-2 text-xs"
        >
          <option value="">Tous cours</option>
          {cours.map((c) => (
            <option key={c.id} value={c.nom}>
              {c.nom}
            </option>
          ))}
        </select>
        <select
          value={filterPay}
          onChange={(e) => setFilterPay(e.target.value)}
          className="rounded-lg border border-white/10 bg-[#0e0e12] px-2 py-2 text-xs"
        >
          <option value="">Tous paiements</option>
          <option value="P">Payé</option>
          <option value="Pa">Partiel</option>
          <option value="N">Non payé</option>
        </select>
        <select
          value={filterAbo}
          onChange={(e) => setFilterAbo(e.target.value)}
          className="rounded-lg border border-white/10 bg-[#0e0e12] px-2 py-2 text-xs"
        >
          <option value="">Tous abonnements</option>
          <option value="active">Actifs</option>
          <option value="soon">Bientôt</option>
          <option value="expired">Expirés</option>
        </select>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#00e5d4] px-3 py-2 text-xs font-bold text-black hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> Nouveau
        </button>
        <button
          onClick={() => exportCsv(inscriptions, cours)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5"
        >
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead>
            <tr className="bg-black/60 text-[9px] uppercase tracking-widest text-[#00e5d4]">
              <th className="px-2.5 py-2">Adhérent</th>
              <th className="px-2.5 py-2">Cours</th>
              <th className="px-2.5 py-2">Début</th>
              <th className="px-2.5 py-2">Fin abo.</th>
              <th className="px-2.5 py-2">Abonnement</th>
              <th className="px-2.5 py-2">Paiement</th>
              <th className="px-2.5 py-2">Encaissé</th>
              <th className="px-2.5 py-2">Assurance</th>
              <th className="px-2.5 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-zinc-500">
                  Aucun adhérent.
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              const fin = getFin(r, cours);
              const ss = subStatus(r, cours);
              const ps = payeStatus(r);
              const as = assStatus(r);
              return (
                <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-2.5 py-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-white/10 bg-gradient-to-br from-red-950 to-cyan-950 text-[9px] font-bold text-[#00e5d4]">
                        {r.nom
                          .split(" ")
                          .map((x) => x[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                      <div>
                        <div className="font-semibold text-zinc-100">
                          {r.nom}
                          {r.statut === "Mineur" && (
                            <span className="ml-1.5 rounded bg-cyan-500/10 px-1 text-[8px] font-bold text-[#00e5d4]">
                              MIN
                            </span>
                          )}
                          {r.abonnement_suspendu && (
                            <span className="ml-1.5 rounded bg-amber-500/10 px-1 text-[8px] font-bold text-amber-400">
                              SUSPENDU
                            </span>
                          )}
                          {r.abonnement_arrete && (
                            <span className="ml-1.5 rounded bg-zinc-500/10 px-1 text-[8px] font-bold text-zinc-400">
                              ARRÊTÉ
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-zinc-500">{r.email || r.tel || "-"}</div>
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-2.5 py-2 font-semibold"
                    style={{ color: getCoursInfo(cours, r.cn)?.couleur ?? "#00e5d4" }}
                  >
                    {r.cn}
                  </td>
                  <td className="px-2.5 py-2 text-zinc-400">{fd(pd(r.dd))}</td>
                  <td className="px-2.5 py-2">
                    <div
                      className="font-semibold"
                      style={{
                        color: ss === "expired" ? "#ff3b3b" : ss === "soon" ? "#ffb800" : "#8888a0",
                      }}
                    >
                      {fd(fin)}
                    </div>
                    {r.nb_renouvellements > 0 && (
                      <div className="text-[9px] text-zinc-500">{r.nb_renouvellements} renouv.</div>
                    )}
                  </td>
                  <td className="px-2.5 py-2">
                    {r.abonnement_arrete ? (
                      <Badge status="np" label="Arrêté" />
                    ) : r.abonnement_suspendu ? (
                      <Badge status="Pa" label="Suspendu" />
                    ) : (
                      <Badge
                        status={ss}
                        label={
                          ss === "active" ? "Actif" : ss === "soon" ? `${daysLeft(fin)}j` : "Expiré"
                        }
                      />
                    )}
                  </td>
                  <td className="px-2.5 py-2">
                    <Badge
                      status={ps}
                      label={ps === "P" ? "Payé" : ps === "Pa" ? "Partiel" : "Non payé"}
                    />
                    {r.promo_code && (
                      <div className="mt-0.5 text-[9px] text-emerald-400">{r.promo_code}</div>
                    )}
                  </td>
                  <td className="px-2.5 py-2 font-semibold text-emerald-400">
                    {r.ac > 0 ? fmtDT(r.ac) : "-"}
                  </td>
                  <td className="px-2.5 py-2">
                    <Badge
                      status={as}
                      label={
                        as === "active"
                          ? "Active"
                          : as === "soon"
                            ? "Bientôt"
                            : as === "expired"
                              ? "Expirée"
                              : "Non payée"
                      }
                    />
                  </td>
                  <td className="px-2.5 py-2">
                    <ActionMenu
                      items={[
                        {
                          key: "view",
                          label: "Voir la fiche",
                          icon: <Eye className="h-3.5 w-3.5" />,
                          tone: "cyan",
                          onSelect: () => setViewing(r),
                        },
                        {
                          key: "edit",
                          label: "Modifier",
                          icon: <Pencil className="h-3.5 w-3.5" />,
                          tone: "amber",
                          onSelect: () => setEditing(r),
                        },
                        {
                          key: "renew",
                          label: "Renouveler",
                          icon: <RefreshCw className="h-3.5 w-3.5" />,
                          tone: "green",
                          badge: r.nb_renouvellements,
                          onSelect: () => setRenewing(r),
                        },
                        {
                          key: "history",
                          label: "Historique renouvellements",
                          icon: <History className="h-3.5 w-3.5" />,
                          onSelect: () => setHistoryTarget(r),
                        },
                        { key: "#sep1", label: "", icon: null, onSelect: () => {} },
                        {
                          key: "suspend",
                          label: r.abonnement_suspendu
                            ? "Reprendre abonnement"
                            : "Suspendre abonnement",
                          icon: r.abonnement_suspendu ? (
                            <Play className="h-3.5 w-3.5" />
                          ) : (
                            <Pause className="h-3.5 w-3.5" />
                          ),
                          tone: r.abonnement_suspendu ? "amber" : undefined,
                          highlight: r.abonnement_suspendu,
                          onSelect: () => toggleSuspension(r, reload),
                        },
                        {
                          key: "stop",
                          label: r.abonnement_arrete ? "Reprendre (arret)" : "Arrêter abonnement",
                          icon: r.abonnement_arrete ? (
                            <Play className="h-3.5 w-3.5" />
                          ) : (
                            <Ban className="h-3.5 w-3.5" />
                          ),
                          tone: r.abonnement_arrete ? "green" : "red",
                          onSelect: () => toggleArret(r, reload),
                        },
                        { key: "#sep2", label: "", icon: null, onSelect: () => {} },
                        {
                          key: "card",
                          label: "Imprimer carte ID",
                          icon: <CreditCard className="h-3.5 w-3.5" />,
                          onSelect: () => printCarteId(r, cours),
                        },
                        {
                          key: "fiche",
                          label: "Imprimer fiche",
                          icon: <Printer className="h-3.5 w-3.5" />,
                          onSelect: () => printFiche(r, cours),
                        },
                        {
                          key: "recu",
                          label: "Imprimer reçu",
                          icon: <Receipt className="h-3.5 w-3.5" />,
                          tone: "green",
                          onSelect: () => printRecu(r, cours),
                        },
                        { key: "#sep3", label: "", icon: null, onSelect: () => {} },
                        {
                          key: "delete",
                          label: "Supprimer",
                          icon: <Trash2 className="h-3.5 w-3.5" />,
                          tone: "red",
                          disabled: busy,
                          onSelect: () => doDelete(r),
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="text-[10px] text-zinc-500">{filtered.length} adhérent(s)</div>

      {creating && (
        <InscriptionModal
          cours={cours}
          promos={promos}
          onClose={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false);
            await reload();
          }}
        />
      )}
      {editing && (
        <InscriptionModal
          existing={editing}
          cours={cours}
          promos={promos}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      )}
      {viewing && (
        <ViewModal
          r={viewing}
          cours={cours}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setViewing(null);
            setEditing(viewing);
          }}
        />
      )}
      {renewing && (
        <RenewModal
          r={renewing}
          cours={cours}
          onClose={() => setRenewing(null)}
          onSaved={async () => {
            setRenewing(null);
            await reload();
          }}
        />
      )}
      {historyTarget && (
        <HistoryModal
          r={historyTarget}
          cours={cours}
          reload={reload}
          onClose={() => setHistoryTarget(null)}
        />
      )}
      {suspensionTarget && <div />}
    </div>
  );
}

async function toggleSuspension(r: GymInscription, reload: () => Promise<void>) {
  if (r.abonnement_suspendu) {
    if (!confirm("Reprendre l'abonnement ?")) return;
    await updateInscription(r.id, {
      abonnement_suspendu: false,
      suspension_motif: "",
      suspension_date: "",
      suspension_note: "",
    });
  } else {
    const motif = prompt("Motif de suspension (Blessure, Voyage, Autre…):", "Autre");
    if (motif === null) return;
    await updateInscription(r.id, {
      abonnement_suspendu: true,
      suspension_motif: motif,
      suspension_date: todayISO(),
    });
  }
  await reload();
}

async function toggleArret(r: GymInscription, reload: () => Promise<void>) {
  if (r.abonnement_arrete) {
    if (!confirm("Reprendre l'abonnement ?")) return;
    await updateInscription(r.id, {
      abonnement_arrete: false,
      arret_motif: "",
      arret_date: "",
      arret_note: "",
    });
  } else {
    const motif = prompt("Motif d'arrêt (Demande de l'adhérent, Non-paiement, Autre…):", "Autre");
    if (motif === null) return;
    await updateInscription(r.id, {
      abonnement_arrete: true,
      arret_motif: motif,
      arret_date: todayISO(),
    });
  }
  await reload();
}

/* ---------------------------------------------------- inscription modal ---- */

function InscriptionModal({
  existing,
  cours,
  promos,
  onClose,
  onSaved,
}: {
  existing?: GymInscription;
  cours: GymCours[];
  promos: GymPromo[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const r = existing;
  const [f, setF] = useState<GymInscriptionInput>({
    nom: r?.nom ?? "",
    ddn: r?.ddn ?? "",
    cin: r?.cin ?? "",
    adresse: r?.adresse ?? "",
    tel: r?.tel ?? "",
    email: r?.email ?? "",
    statut: r?.statut ?? "Majeur",
    np: r?.np ?? "",
    tp: r?.tp ?? "",
    cin_parent: r?.cin_parent ?? "",
    adresse_parent: r?.adresse_parent ?? "",
    cn: r?.cn ?? cours[0]?.nom ?? "",
    dd: r?.dd ?? todayISO(),
    mt: r?.mt ?? cours[0]?.tarif ?? 0,
    mt_original: r?.mt_original ?? cours[0]?.tarif ?? 0,
    ac: r?.ac ?? 0,
    mp: r?.mp ?? "Especes",
    ap: r?.ap ?? "",
    di: r?.di ?? "Oui",
    obs: r?.obs ?? "",
    ass_payee: r?.ass_payee ?? "",
    ass_date: r?.ass_date ?? "",
    med_groupe_sanguin: r?.med_groupe_sanguin ?? "",
    med_autorisation_sport: r?.med_autorisation_sport ?? "Oui",
    med_maladies: r?.med_maladies ?? "",
    med_allergies: r?.med_allergies ?? "",
    med_medicaments: r?.med_medicaments ?? "",
    med_urgence_nom: r?.med_urgence_nom ?? "",
    med_urgence_tel: r?.med_urgence_tel ?? "",
    med_remarques: r?.med_remarques ?? "",
    promo_code: r?.promo_code ?? "",
    promo_type: r?.promo_type ?? "",
    promo_valeur: r?.promo_valeur ?? 0,
    abonnement_suspendu: r?.abonnement_suspendu ?? false,
    abonnement_arrete: r?.abonnement_arrete ?? false,
    ne_pas_renouveler: r?.ne_pas_renouveler ?? false,
    suspension_motif: r?.suspension_motif ?? "",
    suspension_date: r?.suspension_date ?? "",
    suspension_note: r?.suspension_note ?? "",
    arret_motif: r?.arret_motif ?? "",
    arret_date: r?.arret_date ?? "",
    arret_note: r?.arret_note ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof GymInscriptionInput>(key: K, value: GymInscriptionInput[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  const applyPromo = (code: string) => {
    if (!code) {
      setF((prev) => ({
        ...prev,
        promo_code: "",
        promo_type: "",
        promo_valeur: 0,
        mt: prev.mt_original,
      }));
      return;
    }
    const promo = getPromoByCode(promos, code);
    if (!promo) return;
    const custom = code === "PERSONNALISE";
    setF((prev) => {
      const base = prev.mt_original || prev.mt;
      const valeur = custom ? 0 : promo.valeur;
      const mt = custom
        ? base
        : promo.type === "pct"
          ? Math.round(base * (1 - valeur / 100))
          : Math.max(0, base - valeur);
      return {
        ...prev,
        promo_code: code,
        promo_type: promo.type,
        promo_valeur: valeur,
        mt_original: base,
        mt,
      };
    });
  };

  const onCoursChange = (nom: string) => {
    const c = getCoursInfo(cours, nom);
    setF((prev) => ({
      ...prev,
      cn: nom,
      mt_original: c?.tarif ?? prev.mt_original,
      mt: c?.tarif ?? prev.mt,
      promo_code: "",
      promo_type: "",
      promo_valeur: 0,
    }));
  };

  const save = async () => {
    if (!f.nom.trim()) {
      setError("Le nom est obligatoire.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: GymInscriptionInput = {
        ...f,
        nom: f.nom.trim(),
        mt_original: f.mt_original || f.mt,
      };
      if (existing) {
        await updateInscription(existing.id, payload);
      } else {
        await insertInscription(payload);
      }
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const fin = (() => {
    if (!f.dd) return null;
    const c = getCoursInfo(cours, f.cn);
    const d = pd(f.dd);
    if (!d) return null;
    const end = new Date(d);
    end.setMonth(end.getMonth() + (c?.duree_mois ?? 3));
    return end;
  })();

  return (
    <ModalFrame
      title={existing ? "Modifier l'inscription" : "Nouvelle inscription"}
      onClose={onClose}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <SectionTitle>Identité de l'adhérent</SectionTitle>
        <Field label="Nom & prénom *">
          <input className={inputCls} value={f.nom} onChange={(e) => set("nom", e.target.value)} />
        </Field>
        <Field label="Date naissance">
          <input
            className={inputCls}
            placeholder="JJ/MM/AAAA"
            value={f.ddn}
            onChange={(e) => set("ddn", e.target.value)}
          />
        </Field>
        <Field label="CIN">
          <input className={inputCls} value={f.cin} onChange={(e) => set("cin", e.target.value)} />
        </Field>
        <Field label="Téléphone">
          <input className={inputCls} value={f.tel} onChange={(e) => set("tel", e.target.value)} />
        </Field>
        <Field label="Email">
          <input
            className={inputCls}
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="Adresse">
          <input
            className={inputCls}
            value={f.adresse}
            onChange={(e) => set("adresse", e.target.value)}
          />
        </Field>
        <Field label="Statut">
          <select
            className={inputCls}
            value={f.statut}
            onChange={(e) => set("statut", e.target.value as "Majeur" | "Mineur")}
          >
            <option value="Majeur">Majeur</option>
            <option value="Mineur">Mineur</option>
          </select>
        </Field>

        {f.statut === "Mineur" && (
          <>
            <SectionTitle>Parent / tuteur</SectionTitle>
            <Field label="Nom parent">
              <input
                className={inputCls}
                value={f.np}
                onChange={(e) => set("np", e.target.value)}
              />
            </Field>
            <Field label="Tél. parent">
              <input
                className={inputCls}
                value={f.tp}
                onChange={(e) => set("tp", e.target.value)}
              />
            </Field>
            <Field label="CIN parent">
              <input
                className={inputCls}
                value={f.cin_parent}
                onChange={(e) => set("cin_parent", e.target.value)}
              />
            </Field>
          </>
        )}

        <SectionTitle>Cours & abonnement</SectionTitle>
        <Field label="Cours *">
          <select className={inputCls} value={f.cn} onChange={(e) => onCoursChange(e.target.value)}>
            {cours.map((c) => (
              <option key={c.id} value={c.nom}>
                {c.nom} ({c.tarif} DT)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date de début *">
          <input
            type="date"
            className={inputCls}
            value={f.dd ?? ""}
            onChange={(e) => set("dd", e.target.value || null)}
          />
        </Field>
        <Field label="Date de fin (auto)">
          <input className={`${inputCls} text-[#00e5d4]`} readOnly value={fin ? fd(fin) : "-"} />
        </Field>

        <SectionTitle>Réduction</SectionTitle>
        <Field label="Formule">
          <select
            className={inputCls}
            value={f.promo_code}
            onChange={(e) => applyPromo(e.target.value)}
          >
            <option value="">-- Aucune réduction --</option>
            {promos.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label}{" "}
                {p.type === "pct" ? `(-${p.valeur}%)` : p.valeur > 0 ? `(-${p.valeur} DT)` : ""}
              </option>
            ))}
          </select>
        </Field>
        {f.promo_code === "PERSONNALISE" && (
          <Field label="Montant réduction personnalisé (DT)">
            <input
              type="number"
              className={inputCls}
              onChange={(e) => {
                const remise = parseFloat(e.target.value) || 0;
                setF((prev) => ({
                  ...prev,
                  promo_valeur: remise,
                  mt: Math.max(0, (prev.mt_original || prev.mt) - remise),
                }));
              }}
            />
          </Field>
        )}
        <Field label="Tarif original (DT)">
          <input
            type="number"
            className={inputCls}
            value={f.mt_original}
            onChange={(e) => set("mt_original", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Montant à payer (DT)">
          <input
            type="number"
            className={`${inputCls} text-emerald-400`}
            value={f.mt}
            onChange={(e) => set("mt", parseFloat(e.target.value) || 0)}
          />
        </Field>

        <SectionTitle>Paiement</SectionTitle>
        <Field label="Acompte versé (DT)">
          <input
            type="number"
            className={inputCls}
            value={f.ac}
            onChange={(e) => set("ac", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Mode de paiement">
          <select className={inputCls} value={f.mp} onChange={(e) => set("mp", e.target.value)}>
            <option value="">-</option>
            <option value="Especes">Espèces</option>
            <option value="Cheque">Chèque</option>
            <option value="Virement">Virement</option>
          </select>
        </Field>

        <SectionTitle>Assurance</SectionTitle>
        <Field label="Assurance payée">
          <select
            className={inputCls}
            value={f.ass_payee}
            onChange={(e) => set("ass_payee", e.target.value)}
          >
            <option value="">-</option>
            <option value="Oui">Oui</option>
            <option value="Non">Non</option>
          </select>
        </Field>
        <Field label="Date paiement assurance">
          <input
            type="date"
            className={inputCls}
            value={f.ass_date ?? ""}
            onChange={(e) => set("ass_date", e.target.value || null)}
          />
        </Field>

        <SectionTitle>Situation médicale</SectionTitle>
        <Field label="Groupe sanguin">
          <select
            className={inputCls}
            value={f.med_groupe_sanguin}
            onChange={(e) => set("med_groupe_sanguin", e.target.value)}
          >
            <option value="">-</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Autorisation sport">
          <select
            className={inputCls}
            value={f.med_autorisation_sport}
            onChange={(e) => set("med_autorisation_sport", e.target.value)}
          >
            <option value="Oui">Oui — Apte</option>
            <option value="Non">Non — Contre-indiqué</option>
            <option value="">En attente</option>
          </select>
        </Field>
        <Field label="Maladies / antécédents">
          <input
            className={inputCls}
            value={f.med_maladies}
            onChange={(e) => set("med_maladies", e.target.value)}
          />
        </Field>
        <Field label="Allergies">
          <input
            className={inputCls}
            value={f.med_allergies}
            onChange={(e) => set("med_allergies", e.target.value)}
          />
        </Field>
        <Field label="Médicaments en cours">
          <input
            className={inputCls}
            value={f.med_medicaments}
            onChange={(e) => set("med_medicaments", e.target.value)}
          />
        </Field>
        <Field label="Contact urgence">
          <input
            className={inputCls}
            value={f.med_urgence_nom}
            onChange={(e) => set("med_urgence_nom", e.target.value)}
          />
        </Field>
        <Field label="Tél. urgence">
          <input
            className={inputCls}
            value={f.med_urgence_tel}
            onChange={(e) => set("med_urgence_tel", e.target.value)}
          />
        </Field>

        <SectionTitle>Autorisations & observations</SectionTitle>
        <Field label="Autorisation parentale">
          <select className={inputCls} value={f.ap} onChange={(e) => set("ap", e.target.value)}>
            <option value="">-</option>
            <option value="Oui">Oui</option>
            <option value="Non">Non</option>
          </select>
        </Field>
        <Field label="Droit à l'image">
          <select className={inputCls} value={f.di} onChange={(e) => set("di", e.target.value)}>
            <option value="">-</option>
            <option value="Oui">Oui</option>
            <option value="Non">Non</option>
          </select>
        </Field>
        <Field label="Observations">
          <input className={inputCls} value={f.obs} onChange={(e) => set("obs", e.target.value)} />
        </Field>
      </div>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-300 hover:bg-white/5"
        >
          Annuler
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-[#00e5d4] px-4 py-2 text-xs font-bold text-black hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </ModalFrame>
  );
}

const inputCls =
  "w-full rounded-md border border-white/10 bg-[#0e0e12] px-2.5 py-1.5 text-xs text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#00e5d4]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full mt-1 border-t border-white/10 pt-2 font-display text-[11px] tracking-widest text-[#ff3b3b]">
      {children}
    </div>
  );
}

function ModalFrame({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#00e5d4]/40 bg-[#14141a] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg tracking-widest text-[#00e5d4]">{title}</h3>
          <button
            onClick={onClose}
            className="rounded border border-white/10 px-2 py-0.5 text-sm text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- view --- */

function ViewModal({
  r,
  cours,
  onClose,
  onEdit,
}: {
  r: GymInscription;
  cours: GymCours[];
  onClose: () => void;
  onEdit: () => void;
}) {
  const fin = getFin(r, cours);
  const ss = subStatus(r, cours);
  const as = assStatus(r);
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-3 border-b border-white/5 py-1.5 text-xs">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-200">{value || "-"}</span>
    </div>
  );
  return (
    <ModalFrame title={r.nom} onClose={onClose}>
      <div className="space-y-1">
        <SectionTitle>Abonnement</SectionTitle>
        {row("Cours", r.cn)}
        {row("Début", fd(pd(r.dd)))}
        {row(
          "Fin",
          <span style={{ color: ss === "expired" ? "#ff3b3b" : "#00d68f" }}>{fd(fin)}</span>,
        )}
        {row("Statut", <Badge status={ss} label={ss} />)}
        {row("Renouvellements", String(r.nb_renouvellements))}
        <SectionTitle>Paiement</SectionTitle>
        {row("Montant", fmtDT(r.mt))}
        {row("Encaissé", fmtDT(r.ac))}
        {row("Reste", fmtDT(r.mt - r.ac))}
        {row("Mode", r.mp)}
        {r.promo_code && row("Réduction", r.promo_code)}
        <SectionTitle>Assurance</SectionTitle>
        {row("Payée", r.ass_payee || "-")}
        {row("Date paiement", fd(pd(r.ass_date)))}
        {row("Expiration", fd(getAssFin(r)))}
        {row("Statut", <Badge status={as} label={as} />)}
        <SectionTitle>Médical</SectionTitle>
        {row("Groupe sanguin", r.med_groupe_sanguin || "-")}
        {row(
          "Autorisation sport",
          r.med_autorisation_sport === "Oui"
            ? "Apte"
            : r.med_autorisation_sport === "Non"
              ? "Contre-indiqué"
              : "En attente",
        )}
        {r.med_maladies && row("Maladies", r.med_maladies)}
        {r.med_allergies && row("Allergies", r.med_allergies)}
        {(r.med_urgence_nom || r.med_urgence_tel) &&
          row("Urgence", `${r.med_urgence_nom} ${r.med_urgence_tel}`)}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-300 hover:bg-white/5"
        >
          Fermer
        </button>
        <button
          onClick={onEdit}
          className="rounded-lg bg-[#00e5d4] px-4 py-2 text-xs font-bold text-black hover:opacity-90"
        >
          Modifier
        </button>
      </div>
    </ModalFrame>
  );
}

/* ---------------------------------------------------------------- renew ----- */

function RenewModal({
  r,
  cours,
  onClose,
  onSaved,
}: {
  r: GymInscription;
  cours: GymCours[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const c = getCoursInfo(cours, r.cn);
  const fin = getFin(r, cours);
  const [dd, setDd] = useState(() => {
    const base = fin && fin.getTime() > Date.now() ? new Date(fin) : new Date();
    base.setDate(base.getDate() + 1);
    const y = base.getFullYear();
    const m = String(base.getMonth() + 1).padStart(2, "0");
    const d = String(base.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [mt, setMt] = useState(r.mt);
  const [ac, setAc] = useState(r.mt);
  const [mp, setMp] = useState(r.mp || "Especes");
  const [assRenewed, setAssRenewed] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newFin = (() => {
    const d = pd(dd);
    if (!d) return null;
    const end = new Date(d);
    end.setMonth(end.getMonth() + (c?.duree_mois ?? 3));
    return end;
  })();

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const hist = [...(r.historique ?? [])];
      hist.push({
        date_renouvellement: new Date().toLocaleDateString("fr-FR"),
        dd: r.dd ?? "",
        df: fin
          ? `${fin.getFullYear()}-${String(fin.getMonth() + 1).padStart(2, "0")}-${String(fin.getDate()).padStart(2, "0")}`
          : "",
        mt: r.mt,
        ac: r.ac,
      });
      await updateInscription(r.id, {
        dd,
        mt,
        ac,
        mp,
        ass_payee: assRenewed ? "Oui" : r.ass_payee,
        ass_date: assRenewed ? dd : r.ass_date,
        abonnement_arrete: false,
        abonnement_suspendu: false,
        nb_renouvellements: (r.nb_renouvellements ?? 0) + 1,
        historique: hist,
      });
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalFrame title="Renouveler l'abonnement" onClose={onClose}>
      <div className="mb-4 rounded-lg border border-white/10 bg-[#0e0e12] p-3 text-xs text-zinc-300">
        <b className="text-zinc-100">{r.nom}</b> — {r.cn} ({c?.duree_mois ?? 3} mois)
        <div className="mt-1 text-zinc-500">
          Actuel : {fd(pd(r.dd))} → {fd(fin)} · {r.nb_renouvellements} renouvellement(s)
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nouvelle date de début">
          <input
            type="date"
            className={inputCls}
            value={dd}
            onChange={(e) => setDd(e.target.value)}
          />
        </Field>
        <Field label="Date de fin (auto)">
          <input
            className={`${inputCls} text-[#00e5d4]`}
            readOnly
            value={newFin ? fd(newFin) : "-"}
          />
        </Field>
        <Field label="Montant (DT)">
          <input
            type="number"
            className={inputCls}
            value={mt}
            onChange={(e) => setMt(parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Acompte versé (DT)">
          <input
            type="number"
            className={inputCls}
            value={ac}
            onChange={(e) => setAc(parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Mode de paiement">
          <select className={inputCls} value={mp} onChange={(e) => setMp(e.target.value)}>
            <option value="Especes">Espèces</option>
            <option value="Cheque">Chèque</option>
            <option value="Virement">Virement</option>
          </select>
        </Field>
        <Field label="Assurance renouvelée">
          <select
            className={inputCls}
            value={assRenewed ? "Oui" : "Non"}
            onChange={(e) => setAssRenewed(e.target.value === "Oui")}
          >
            <option value="Oui">Oui</option>
            <option value="Non">Non</option>
          </select>
        </Field>
      </div>
      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-300 hover:bg-white/5"
        >
          Annuler
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-black hover:opacity-90 disabled:opacity-50"
        >
          Confirmer
        </button>
      </div>
    </ModalFrame>
  );
}

/* --------------------------------------------------------------- history ---- */

function HistoryModal({
  r,
  cours,
  reload,
  onClose,
}: {
  r: GymInscription;
  cours: GymCours[];
  reload: () => Promise<void>;
  onClose: () => void;
}) {
  return (
    <ModalFrame title={`Historique — ${r.nom}`} onClose={onClose}>
      {(r.historique ?? []).length === 0 ? (
        <p className="py-6 text-center text-xs text-zinc-500">Aucun renouvellement enregistré.</p>
      ) : (
        <div className="space-y-2">
          {r.historique.map((h, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-[#0e0e12] p-3 text-xs"
            >
              <div>
                <div className="font-semibold text-zinc-100">Renouvellement n°{i + 1}</div>
                <div className="mt-0.5 text-zinc-400">
                  Du {fd(pd(h.dd))} au {fd(pd(h.df))} — {h.mt} DT
                </div>
                <div className="mt-0.5 text-[10px] text-zinc-600">{h.date_renouvellement}</div>
              </div>
              <button
                onClick={async () => {
                  if (!confirm("Supprimer ce renouvellement de l'historique ?")) return;
                  const hist = r.historique.filter((_, idx) => idx !== i);
                  await updateInscription(r.id, {
                    historique: hist,
                    nb_renouvellements: hist.length,
                  });
                  await reload();
                  onClose();
                }}
                className="rounded border border-white/10 p-1.5 text-zinc-400 hover:text-red-400"
                title="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-300 hover:bg-white/5"
        >
          Fermer
        </button>
      </div>
    </ModalFrame>
  );
}

/* ------------------------------------------------------------------ cours --- */

function CoursTab({ cours, reload }: { cours: GymCours[]; reload: () => Promise<void> }) {
  const [editing, setEditing] = useState<GymCours | null>(null);
  const [creating, setCreating] = useState(false);

  const save = async (c: Omit<GymCours, "id">, id?: string) => {
    if (id) await updateCours(id, c);
    else await insertCours(c);
    await reload();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{cours.length} cours</span>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#00e5d4] px-3 py-2 text-xs font-bold text-black hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> Nouveau cours
        </button>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {cours.map((c) => (
          <div key={c.id} className="rounded-xl border border-white/10 bg-[#14141a] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-base tracking-wide">{c.nom}</span>
              <span className="h-2 w-2 rounded-full" style={{ background: c.couleur }} />
            </div>
            <div className="flex justify-between border-t border-white/5 py-1 text-[11px] text-zinc-400">
              <span>Public</span>
              <span>{c.pub || "-"}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 py-1 text-[11px] text-zinc-400">
              <span>Durée</span>
              <span>{c.duree_mois} mois</span>
            </div>
            <div className="flex justify-between border-t border-white/5 py-1 text-[11px] text-zinc-400">
              <span>Tarif</span>
              <span className="font-display text-base text-[#00e5d4]">{c.tarif} DT</span>
            </div>
            <div className="mt-2.5 flex gap-1.5">
              <button
                onClick={() => setEditing(c)}
                className="flex-1 rounded-lg border border-white/10 py-1.5 text-[11px] text-zinc-300 hover:bg-white/5"
              >
                Modifier
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`Supprimer le cours "${c.nom}" ?`)) return;
                  await deleteCours(c.id);
                  await reload();
                }}
                className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {(creating || editing) && (
        <CoursModal
          existing={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={async (data) => {
            await save(data, editing?.id);
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function CoursModal({
  existing,
  onClose,
  onSave,
}: {
  existing?: GymCours;
  onClose: () => void;
  onSave: (data: Omit<GymCours, "id">) => void | Promise<void>;
}) {
  const [f, setF] = useState<Omit<GymCours, "id">>({
    nom: existing?.nom ?? "",
    pub: existing?.pub ?? "",
    duree_mois: existing?.duree_mois ?? 3,
    tarif: existing?.tarif ?? 0,
    couleur: existing?.couleur ?? "#00e5d4",
    sort_order: existing?.sort_order ?? 0,
  });
  return (
    <ModalFrame title={existing ? "Modifier le cours" : "Nouveau cours"} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nom du cours *">
          <input
            className={inputCls}
            value={f.nom}
            onChange={(e) => setF({ ...f, nom: e.target.value })}
          />
        </Field>
        <Field label="Public cible">
          <input
            className={inputCls}
            placeholder="ex: Tous ages"
            value={f.pub}
            onChange={(e) => setF({ ...f, pub: e.target.value })}
          />
        </Field>
        <Field label="Durée">
          <select
            className={inputCls}
            value={f.duree_mois}
            onChange={(e) => setF({ ...f, duree_mois: parseInt(e.target.value) || 3 })}
          >
            <option value="1">1 mois</option>
            <option value="3">3 mois</option>
            <option value="6">6 mois</option>
            <option value="12">12 mois (1 an)</option>
          </select>
        </Field>
        <Field label="Tarif (DT) *">
          <input
            type="number"
            className={inputCls}
            value={f.tarif}
            onChange={(e) => setF({ ...f, tarif: parseFloat(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Couleur">
          <select
            className={inputCls}
            value={f.couleur}
            onChange={(e) => setF({ ...f, couleur: e.target.value })}
          >
            {COULEURS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-300 hover:bg-white/5"
        >
          Annuler
        </button>
        <button
          onClick={() => f.nom.trim() && onSave({ ...f, nom: f.nom.trim() })}
          className="rounded-lg bg-[#00e5d4] px-4 py-2 text-xs font-bold text-black hover:opacity-90"
        >
          Enregistrer
        </button>
      </div>
    </ModalFrame>
  );
}

/* ------------------------------------------------------------------ promos -- */

function PromosTab({ inscriptions }: { inscriptions: GymInscription[] }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {DEFAULT_PROMOS.map((p) => {
        const used = inscriptions.filter((r) => r.promo_code === p.code).length;
        const eco = inscriptions
          .filter((r) => r.promo_code === p.code)
          .reduce((a, r) => a + Math.max(0, (r.mt_original || r.mt) - r.mt), 0);
        return (
          <div
            key={p.code}
            className="rounded-xl border border-white/10 border-t-2 bg-[#14141a] p-4"
            style={{ borderTopColor: p.type === "pct" ? "#00d68f" : "#00e5d4" }}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <div className="font-display text-sm tracking-wide">{p.label}</div>
                <div className="mt-0.5 text-[10px] text-zinc-500">{p.desc}</div>
              </div>
              <span className="rounded border border-white/10 bg-black/30 px-2 py-0.5 font-mono text-[10px] font-bold text-[#00e5d4]">
                {p.code}
              </span>
            </div>
            <div className="flex justify-between border-t border-white/5 py-1 text-[11px] text-zinc-400">
              <span>Type</span>
              <span className="font-semibold">
                {p.type === "pct" ? "Pourcentage" : "Montant fixe"}
              </span>
            </div>
            <div className="flex justify-between border-t border-white/5 py-1 text-[11px] text-zinc-400">
              <span>Valeur</span>
              <span className="font-display text-base text-[#00e5d4]">
                {p.code === "PERSONNALISE"
                  ? "Personnalisée"
                  : p.type === "pct"
                    ? `${p.valeur}%`
                    : `${p.valeur} DT`}
              </span>
            </div>
            <div className="flex justify-between border-t border-white/5 py-1 text-[11px] text-zinc-400">
              <span>Utilisée</span>
              <span className="font-semibold">{used} fois</span>
            </div>
            <div className="flex justify-between border-t border-white/5 py-1 text-[11px] text-zinc-400">
              <span>Économies générées</span>
              <span className="font-bold text-emerald-400">{fmtDT(eco)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- presence -- */

function PresenceTab({
  inscriptions,
  cours,
  presences,
  reload,
}: {
  inscriptions: GymInscription[];
  cours: GymCours[];
  presences: Awaited<ReturnType<typeof import("@/lib/gym").listPresences>>;
  reload: () => Promise<void>;
}) {
  const [date, setDate] = useState(todayISO());
  const [session, setSession] = useState("Session 1");
  const [coursFilter, setCoursFilter] = useState("");
  const [saving, setSaving] = useState(false);

  const dayPresences = presences.filter((p) => p.pres_date === date);
  const sessionKey = (p: { session: string }) => p.session;
  const sessions = [...new Set(presences.filter((p) => p.pres_date === date).map(sessionKey))];
  const allSessions = [...new Set([...sessions, session])];

  const statusFor = (id: string): string | null =>
    dayPresences.find((p) => p.session === session && p.inscription_id === id)?.statut ?? null;

  const filtered = inscriptions.filter((r) => !coursFilter || r.cn === coursFilter);

  const mark = async (id: string, statut: "present" | "absent" | "justifie" | null) => {
    setSaving(true);
    try {
      await setPresence(date, session, id, statut);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const summary = {
    present: filtered.filter((r) => statusFor(r.id) === "present").length,
    absent: filtered.filter((r) => statusFor(r.id) === "absent").length,
    justifie: filtered.filter((r) => statusFor(r.id) === "justifie").length,
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-white/10 bg-[#0e0e12] px-2.5 py-2 text-xs"
        />
        <select
          value={coursFilter}
          onChange={(e) => setCoursFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-[#0e0e12] px-2 py-2 text-xs"
        >
          <option value="">Tous les cours</option>
          {cours.map((c) => (
            <option key={c.id} value={c.nom}>
              {c.nom}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-zinc-500">Sessions :</span>
          {allSessions.map((s) => {
            const count = dayPresences.filter((p) => p.session === s).length;
            return (
              <button
                key={s}
                onClick={() => setSession(s)}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${
                  session === s
                    ? "border-[#00e5d4] bg-[#00e5d4] text-black"
                    : "border-white/10 text-zinc-400 hover:bg-white/5"
                }`}
              >
                {s} ({count})
              </button>
            );
          })}
          <button
            onClick={() => {
              const name = prompt(
                "Nom de la nouvelle session :",
                `Session ${allSessions.length + 1}`,
              );
              if (name) setSession(name);
            }}
            className="rounded-lg border border-dashed border-white/20 px-2.5 py-1.5 text-[11px] text-zinc-400 hover:bg-white/5"
          >
            +
          </button>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        <Kpi label="Présents" value={String(summary.present)} color="#00d68f" />
        <Kpi label="Absents" value={String(summary.absent)} color="#ff3b3b" />
        <Kpi label="Justifiés" value={String(summary.justifie)} color="#ffb800" />
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-xs text-zinc-500">Aucun adhérent pour ce filtre.</p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const st = statusFor(r.id);
            const totalSessions = presences.length;
            const presents = presences.filter(
              (p) => p.inscription_id === r.id && p.statut === "present",
            ).length;
            const taux = totalSessions > 0 ? Math.round((presents / totalSessions) * 100) : 0;
            return (
              <div
                key={r.id}
                className="overflow-hidden rounded-xl border bg-[#14141a]"
                style={{
                  borderColor:
                    st === "present"
                      ? "rgba(0,214,143,.4)"
                      : st === "absent"
                        ? "rgba(255,59,59,.3)"
                        : st === "justifie"
                          ? "rgba(255,184,0,.3)"
                          : "rgba(255,255,255,.1)",
                }}
              >
                <div className="flex items-center gap-2.5 border-b border-white/5 p-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/10 bg-gradient-to-br from-red-950 to-cyan-950 text-[10px] font-bold text-[#00e5d4]">
                    {r.nom
                      .split(" ")
                      .map((x) => x[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold">{r.nom}</div>
                    <div className="text-[10px] text-zinc-500">{r.cn}</div>
                  </div>
                  <div className="text-right text-[9px] text-zinc-500">
                    {taux}%<br />
                    présence
                  </div>
                </div>
                <div className="flex items-center justify-between p-2.5">
                  <div className="flex gap-1.5">
                    {(
                      [
                        ["present", "✓ Présent", "#00d68f"],
                        ["absent", "✗ Absent", "#ff3b3b"],
                        ["justifie", "⏳ Justifié", "#ffb800"],
                      ] as const
                    ).map(([value, label, color]) => (
                      <button
                        key={value}
                        disabled={saving}
                        onClick={() => mark(r.id, st === value ? null : value)}
                        className="rounded border px-2 py-1 text-[10px] font-bold transition disabled:opacity-50"
                        style={{
                          borderColor: st === value ? color : "rgba(255,255,255,.12)",
                          color: st === value ? color : "#8888a0",
                          background: st === value ? `${color}1a` : "transparent",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {totalSessions > 0 && (
                  <div className="px-3 pb-2.5">
                    <div className="h-[3px] overflow-hidden rounded bg-white/10">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${taux}%`,
                          background: taux >= 75 ? "#00d68f" : taux >= 50 ? "#ffb800" : "#ff3b3b",
                        }}
                      />
                    </div>
                    <div className="mt-1 text-[9px] text-zinc-500">
                      {presents} présents /{" "}
                      {presences.filter((p) => p.inscription_id === r.id).length} sessions marquées
                    </div>
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

/* ------------------------------------------------------------------ print --- */

function printHtml(html: string, size = "width=820,height=900") {
  const w = window.open("", "_blank", size);
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 250);
}
const PRINT_HEAD =
  "font-family:'DM Sans',Arial,Helvetica,sans-serif;color:#111;margin:0;padding:18px 24px;";

/** Google Fonts identical to the old app so the printed documents look the same. */
const PRINT_FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap" rel="stylesheet">';

const PRINT_PAGE_CSS =
  "@media print{@page{size:A4 portrait;margin:0}body{padding:10mm 12mm}" +
  "*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}";

/** Document wrapper shared by the printed fiche and receipt. */
function printDocument(title: string, body: string, width = "width=900,height=1100") {
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${title}</title>${PRINT_FONTS}
  <style>body{${PRINT_HEAD}}${PRINT_PAGE_CSS}</style></head><body>${body}</body></html>`;
  printHtml(html, width);
}

/** Numéro lisible d'un adhérent (les 4 premiers caractères de l'uuid). */
function memberNo(r: GymInscription): string {
  return r.id.slice(0, 4).toUpperCase();
}

/** Carte d'adhérent — reproduction du modèle .card-id de l'ancien app. */
function printCarteId(r: GymInscription, cours: GymCours[]) {
  const fin = getFin(r, cours);
  const dd = pd(r.dd);
  const logo = document.querySelector<HTMLImageElement>("header img")?.src ?? "";
  const annee = new Date().getFullYear();
  const numero = memberNo(r);

  const makeCard = (isParent: boolean) => {
    const name = isParent ? r.np || "-" : r.nom;
    const cin = isParent ? r.cin_parent || "-" : r.cin || "-";
    const tel = isParent ? r.tp || "-" : r.tel || "-";
    const initiales = name
      .split(" ")
      .map((x) => x[0] || "")
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const typeLbl = isParent
      ? "PARENT / TUTEUR"
      : r.statut === "Mineur"
        ? "ADHERENT MINEUR"
        : "ADHERENT MAJEUR";
    const bgc = isParent ? "#f97316" : "#00e5d4";
    const row = (lbl: string, val: string) =>
      `<div class="ci-row"><span class="ci-lbl">${lbl}</span><span class="ci-val">${val}</span></div>`;
    return `<div class="card-id">
      <div class="cih">${logo ? `<img src="${logo}" class="ci-logo">` : ""}<div class="ci-ac"><div class="ci-t">HIP HOP ACADEMY</div><div class="ci-s">Carte adherent</div></div></div>
      <div class="cib">
        <div class="ci-av">${initiales}</div>
        <div class="ci-n">${name}</div>
        <div class="ci-num">N° ${numero} - ${annee}</div>
        <span class="ci-bdg" style="background:${bgc}">${typeLbl}</span>
        <div style="clear:both;margin-top:8px">
          ${
            !isParent && r.med_groupe_sanguin
              ? `<div class="ci-blood">&#128197; ${r.med_groupe_sanguin}</div>`
              : ""
          }
          ${row("CIN", cin)}${row("Tel.", tel)}
          ${isParent ? "" : row("Cours", r.cn) + row("Debut", fd(dd)) + row("Fin", fd(fin))}
        </div>
        ${
          isParent
            ? ""
            : `<div class="ci-renew">
                 <div class="ci-renew-t">&#128260; Renouvellements</div>
                 <div class="ci-renew-g"><b>${r.nb_renouvellements}</b> — ${
                   r.nb_renouvellements === 0
                     ? "Jamais renouvele"
                     : `${r.nb_renouvellements} renouvellement${r.nb_renouvellements > 1 ? "s" : ""} effectue${r.nb_renouvellements > 1 ? "s" : ""}`
                 }</div>
                 ${
                   r.historique.length
                     ? `<div class="ci-renew-l">Dernier : ${r.historique[r.historique.length - 1].date_renouvellement}</div>`
                     : ""
                 }
               </div>`
        }
      </div>
      <div class="cif"><span class="cif-t">DADA HIP HOP ACADEMY - ${annee}</span><div class="cif-d"></div></div>
    </div>`;
  };

  const cards = `${makeCard(false)}${r.statut === "Mineur" && r.np ? makeCard(true) : ""}`;

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Carte ${r.nom}</title>${PRINT_FONTS}
  <style>
  *{box-sizing:border-box}
  body{font-family:'DM Sans',Arial,sans-serif;background:#fff;margin:0;padding:10px}
  #pz{display:flex;flex-wrap:wrap;justify-content:center;align-content:flex-start;gap:6mm;padding:0}
  .card-id{background:#fff;color:#111;border-radius:12px;width:85mm;border:2px solid #00e5d4;overflow:hidden;font-family:'DM Sans',Arial,sans-serif}
  .cih{background:linear-gradient(135deg,#080808 0%,#1a0000 50%,#000d0d 100%);padding:14px 16px;display:flex;align-items:center;gap:10px;border-bottom:2px solid #00e5d4}
  .ci-logo{height:48px;width:auto}
  .ci-ac{display:flex;flex-direction:column;line-height:1}
  .ci-t{font-size:16px;letter-spacing:3px;color:#fff}
  .ci-s{font-size:8px;letter-spacing:3px;color:#00e5d4;text-transform:uppercase;margin-top:2px}
  .cib{padding:14px 16px}
  .ci-av{width:56px;height:56px;border-radius:8px;background:linear-gradient(135deg,#00e5d4,#1a8a85);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:bold;color:#000;float:right;margin-left:10px;margin-bottom:6px;border:2px solid #00e5d4}
  .ci-n{font-size:18px;letter-spacing:1px;color:#111;line-height:1.1}
  .ci-num{font-size:9px;color:#888;letter-spacing:1px;margin-top:2px;text-transform:uppercase}
  .ci-bdg{display:inline-block;margin-top:8px;color:#000;font-size:9px;font-weight:bold;letter-spacing:1px;padding:3px 10px;border-radius:4px;text-transform:uppercase}
  .ci-blood{display:inline-block;background:#cc2222;color:#fff;font-size:9px;font-weight:bold;padding:2px 8px;border-radius:4px;margin-bottom:6px;font-family:'Courier New',monospace}
  .ci-row{display:flex;gap:4px;margin-top:6px;font-size:10px}
  .ci-lbl{color:#888;min-width:60px;font-weight:bold;text-transform:uppercase;font-size:9px}
  .ci-val{color:#222;font-weight:500}
  .ci-renew{margin-top:10px;background:#f2f7f7;border-left:3px solid #00a68a;border-radius:4px;padding:7px 9px;clear:both}
  .ci-renew-t{font-size:8px;letter-spacing:1.2px;text-transform:uppercase;color:#00806e;font-weight:bold}
  .ci-renew-g{font-size:11px;color:#111;margin-top:2px}
  .ci-renew-l{font-size:9px;color:#888;margin-top:2px}
  .cif{background:#f5f5f5;padding:8px 16px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e0e0e0;clear:both}
  .cif-t{font-size:8px;color:#aaa;letter-spacing:.5px}
  .cif-d{width:6px;height:6px;border-radius:50%;background:#00e5d4}
  @media print{@page{size:A4 portrait;margin:0}
    *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    body{padding:10mm;width:210mm}
    #pz{width:210mm}
    .card-id{width:85mm;box-shadow:none;break-inside:avoid;page-break-inside:avoid}}
  </style></head><body><div id="pz">${cards}</div></body></html>`;

  printHtml(html, "width=900,height=700");
}

/** Reçu de paiement — reproduction exacte du reçu de l'ancien app. */
function printRecu(r: GymInscription, cours: GymCours[]) {
  const logo = document.querySelector<HTMLImageElement>("header img")?.src ?? "";
  const sp = payeStatus(r);
  const reste = Number(r.mt) - Number(r.ac);
  const spLbl = sp === "P" ? "Paye integralement" : sp === "Pa" ? "Partiel" : "Non paye";
  const spCol = sp === "P" ? "#00a86b" : sp === "Pa" ? "#e08c00" : "#cc2222";
  const today2 = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const numR = `RCP-${memberNo(r)}-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const dd = pd(r.dd);
  const fin = getFin(r, cours);
  const assFin = getAssFin(r);

  let h = `<div style="font-family:'DM Sans',sans-serif;background:#fff;color:#111;padding:16px 22px;">`;

  /* ── HEADER ── */
  h += `<div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:14px;border-bottom:3px solid #00e5d4;margin-bottom:16px;">`;
  h += `<div style="display:flex;align-items:center;gap:14px;">`;
  if (logo) h += `<img src="${logo}" style="height:60px;width:auto;">`;
  h += `<div><div style="font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:3px;color:#111;line-height:1;">DADA HIP HOP ACADEMY</div>`;
  h += `<div style="font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-top:3px;">Recu de paiement officiel</div></div>`;
  h += `</div>`;
  h += `<div style="text-align:right;">`;
  h += `<div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;color:#00e5d4;">${numR}</div>`;
  h += `<div style="font-size:11px;color:#aaa;margin-top:2px;">Date : ${today2}</div>`;
  h += `<div style="margin-top:8px;display:inline-block;background:${spCol};color:#fff;font-size:10px;font-weight:700;padding:4px 14px;border-radius:4px;letter-spacing:.5px;">${spLbl}</div>`;
  h += `</div></div>`;

  /* ── ADHERENT INFO ── */
  h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">`;
  h += `<div style="background:#f8f8f8;border-radius:8px;padding:14px;border-left:4px solid #00e5d4;">`;
  h += `<div style="font-family:'Bebas Neue',sans-serif;font-size:12px;letter-spacing:1.5px;color:#00a88a;margin-bottom:10px;">INFORMATIONS ADHERENT</div>`;
  h += `<div style="font-size:14px;font-weight:700;color:#111;margin-bottom:6px;">${r.nom}</div>`;
  h += `<div style="font-size:11px;color:#555;line-height:1.8;">`;
  const contact: string[] = [];
  if (r.cin) contact.push(`CIN : <b>${r.cin}</b>`);
  if (r.tel) contact.push(`Tel : <b>${r.tel}</b>`);
  if (r.email) contact.push(`Email : <b>${r.email}</b>`);
  if (r.adresse) contact.push(`Adresse : <b>${r.adresse}</b>`);
  h += contact.join("<br>");
  h += `</div></div>`;

  h += `<div style="background:#f8f8f8;border-radius:8px;padding:14px;border-left:4px solid #9d7cf4;">`;
  h += `<div style="font-family:'Bebas Neue',sans-serif;font-size:12px;letter-spacing:1.5px;color:#7a5cf0;margin-bottom:10px;">INSCRIPTION</div>`;
  h += `<div style="font-size:11px;color:#555;line-height:1.8;">`;
  h += `Cours : <b style="color:#111;">${r.cn}</b><br>`;
  h += `Debut : <b>${fd(dd)}</b><br>`;
  h += `Fin : <b>${fd(fin)}</b><br>`;
  if (assFin) h += `Assurance exp. : <b>${fd(assFin)}</b>`;
  h += `</div></div>`;
  h += `</div>`;

  /* ── PAYMENT TABLE ── */
  const payRow = (label: string, val: string, valStyle = "color:#111;", bg = "#fff") =>
    `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:${bg};border-bottom:1px solid #f0f0f0;"><span style="font-size:12px;color:#666;font-weight:500;">${label}</span><span style="font-size:13px;font-weight:700;${valStyle}">${val}</span></div>`;

  h += `<div style="border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;margin-bottom:14px;">`;
  h += `<div style="background:linear-gradient(90deg,#080808,#1a0000);color:#00e5d4;font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:2px;padding:10px 16px;">DETAIL DU PAIEMENT</div>`;
  h += payRow("Montant a payer", `${Number(r.mt).toLocaleString("fr-FR")} DT`, "color:#111;");
  h += payRow(
    "Acompte verse",
    `${Number(r.ac).toLocaleString("fr-FR")} DT`,
    "color:#00a86b;font-size:14px;",
    "#f0fff8",
  );
  h += payRow(
    "Reste a payer",
    reste > 0 ? `${reste.toLocaleString("fr-FR")} DT` : "SOLDE",
    reste > 0 ? "color:#cc2222;" : "color:#00a86b;",
    reste > 0 ? "#fff8f8" : "#f0fff8",
  );
  h += payRow("Mode de paiement", r.mp || "-", "color:#333;");
  if (r.promo_code && r.mt_original && Number(r.mt_original) !== Number(r.mt)) {
    const promo = getPromoByCode(DEFAULT_PROMOS, r.promo_code);
    const eco = Number(r.mt_original) - Number(r.mt);
    h += payRow(
      "Tarif original",
      `${Number(r.mt_original).toLocaleString("fr-FR")} DT`,
      "color:#999;text-decoration:line-through;",
    );
    h += payRow(
      "Reduction (" + (promo ? promo.label : r.promo_code) + ")",
      `-${eco.toLocaleString("fr-FR")} DT`,
      "color:#00a86b;",
      "#f0fff8",
    );
  }
  if (r.ass_payee) {
    const assLblR = r.ass_payee === "Oui" ? "Payee" : "Non payee";
    const assColR = r.ass_payee === "Oui" ? "color:#00a86b;" : "color:#cc2222;";
    h += payRow(
      "Assurance annuelle",
      assLblR + (r.ass_date ? ` (${fd(pd(r.ass_date))})` : ""),
      assColR,
    );
  }
  h += `</div>`;

  /* ── TOTAL PAID ── */
  h += `<div style="background:linear-gradient(135deg,#080808,#1a0000);border-radius:8px;padding:16px 20px;margin-bottom:22px;display:flex;align-items:center;justify-content:space-between;">`;
  h += `<div style="color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Montant encaisse ce jour</div>`;
  h += `<div style="font-family:'Bebas Neue',sans-serif;font-size:36px;color:#00e5d4;letter-spacing:2px;">${Number(r.ac).toLocaleString("fr-FR")} <span style="font-size:18px;">DT</span></div>`;
  h += `</div>`;

  /* ── OBSERVATIONS ── */
  if (r.obs) {
    h += `<div style="background:#fffbf0;border:1px solid #ffe082;border-radius:8px;padding:12px 16px;margin-bottom:20px;">`;
    h += `<div style="font-size:10px;color:#a07800;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">Observations</div>`;
    h += `<div style="font-size:12px;color:#555;">${r.obs}</div></div>`;
  }

  /* ── SIGNATURES ── */
  h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">`;
  h += `<div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:28px;">Signature du client</div><div style="border-top:1px dashed #ccc;padding-top:6px;font-size:10px;color:#aaa;">Nom & Date</div></div>`;
  h += `<div style="border:1px solid #e0e0e0;border-radius:8px;padding:14px;"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:28px;">Cachet & Signature academie</div><div style="border-top:1px dashed #ccc;padding-top:6px;font-size:10px;color:#aaa;">Responsable</div></div>`;
  h += `</div>`;

  /* ── FOOTER ── */
  h += `<div style="padding-top:16px;border-top:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center;">`;
  h += `<div style="font-size:9px;color:#bbb;letter-spacing:.5px;">DADA HIP HOP ACADEMY - Recu officiel - ${numR}</div>`;
  h += `<div style="width:24px;height:3px;background:#00e5d4;border-radius:2px;"></div></div>`;
  h += `</div>`;

  printDocument(`Reçu ${r.nom}`, h);
}

function printFiche(r: GymInscription, cours: GymCours[]) {
  const fin = getFin(r, cours);
  const dd = pd(r.dd);
  const assFin = getAssFin(r);
  const ci = getCoursInfo(cours, r.cn);
  const logo = document.querySelector<HTMLImageElement>("header img")?.src ?? "";
  const as_ = assStatus(r);
  const sp = payeStatus(r);
  const reste = Number(r.mt) - Number(r.ac);
  const spLbl = sp === "P" ? "Payé intégralement" : sp === "Pa" ? "Partiel" : "Non payé";
  const spCol = sp === "P" ? "#00a86b" : sp === "Pa" ? "#e08c00" : "#cc2222";
  const assCol =
    as_ === "expired"
      ? "#cc2222"
      : as_ === "soon"
        ? "#e08c00"
        : as_ === "active"
          ? "#00a86b"
          : "#cc2222";
  const assLbl2 =
    as_ === "np"
      ? "Non payée"
      : as_ === "expired"
        ? "Expirée"
        : as_ === "soon"
          ? "Expire bientôt"
          : "Active";
  const today2 = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const numF = `INS-${memberNo(r)}-${new Date().getFullYear()}`;

  const row = (lbl: string, val: string, col?: string) =>
    `<tr style="border-bottom:1px solid #f0f0f0"><td style="padding:7px 10px;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.5px;width:38%;white-space:nowrap">${lbl}</td><td style="padding:7px 10px;font-size:12px;color:${col || "#111"};font-weight:${col ? "700" : "400"}">${val || "-"}</td></tr>`;
  const sec = (title: string, rows: string) =>
    `<div style="margin-bottom:6px"><div style="background:linear-gradient(90deg,#080808,#1a0000);color:#00e5d4;font-family:'Bebas Neue',sans-serif;font-size:11px;letter-spacing:1.5px;padding:5px 10px;border-radius:4px 4px 0 0">${title}</div><table style="width:100%;border-collapse:collapse;background:#fff;border-radius:0 0 4px 4px;border:1px solid #e8e8e8;border-top:none">${rows}</table></div>`;

  const isMineur = r.statut === "Mineur";
  let fh = `<div style="font-family:'DM Sans',sans-serif;background:#fff;color:#111;padding:16px 22px;">`;
  fh += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-bottom:12px;border-bottom:3px solid #00e5d4"><div style="display:flex;align-items:center;gap:14px">${logo ? `<img src="${logo}" style="height:64px;width:auto">` : ""}<div><div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:3px;color:#111;line-height:1">DADA HIP HOP ACADEMY</div><div style="font-size:10px;letter-spacing:3px;color:#888;text-transform:uppercase;margin-top:3px">Fiche inscription officielle</div></div></div><div style="text-align:right"><div style="font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:2px;color:#00e5d4">${numF}</div><div style="font-size:10px;color:#aaa;margin-top:2px">Édition : ${today2}</div><div style="margin-top:8px;display:inline-block;background:${spCol};color:#fff;font-size:10px;font-weight:700;padding:3px 12px;border-radius:4px">${spLbl}</div></div></div>`;

  fh += sec(
    "1 - Identite de l'adherent",
    row("Nom & Prenom", r.nom, "#111") +
      row("Date naissance", r.ddn) +
      row("CIN", r.cin) +
      row("Adresse", r.adresse) +
      row("Telephone", r.tel) +
      row("Email", r.email) +
      row("Statut", r.statut),
  );

  if (isMineur)
    fh += sec(
      "2 - Parent / Tuteur legal",
      row("Nom", r.np) +
        row("CIN", r.cin_parent) +
        row("Telephone", r.tp) +
        row("Adresse", r.adresse_parent) +
        row(
          "Autor. parentale",
          r.ap === "Oui" ? "Accordee" : "Non accordee",
          r.ap === "Oui" ? "#00a86b" : "#cc2222",
        ),
    );

  const medSn = `${isMineur ? 3 : 2} - Situation medicale`;
  const aptLblF =
    r.med_autorisation_sport === "Oui"
      ? "Apte - Autorisation accordee"
      : r.med_autorisation_sport === "Non"
        ? "Contre-indique"
        : "En attente";
  const aptColF =
    r.med_autorisation_sport === "Oui"
      ? "#00a86b"
      : r.med_autorisation_sport === "Non"
        ? "#cc2222"
        : "#e08c00";
  fh += sec(
    medSn,
    row("Groupe sanguin", r.med_groupe_sanguin, "#cc2222") +
      row("Autorisation sport", aptLblF, aptColF) +
      (r.med_maladies ? row("Maladies / Antecedents", r.med_maladies, "#e08c00") : "") +
      (r.med_allergies ? row("Allergies", r.med_allergies, "#cc2222") : "") +
      (r.med_medicaments ? row("Medicaments", r.med_medicaments) : "") +
      (r.med_urgence_nom
        ? row("Contact urgence", `${r.med_urgence_nom} - ${r.med_urgence_tel || ""}`, "#cc2222")
        : "") +
      (r.med_remarques ? row("Remarques medicales", r.med_remarques) : ""),
  );

  fh += sec(
    `${isMineur ? 4 : 3} - Cours & Abonnement`,
    row("Cours", r.cn, "#0066aa") +
      row("Public cible", ci?.pub ?? "-") +
      row("Duree", `${ci?.duree_mois ?? 3} mois`) +
      row("Debut", fd(dd)) +
      row(
        "Fin",
        fd(fin),
        fin && daysLeft(fin) !== null && daysLeft(fin)! < 0 ? "#cc2222" : "#00a86b",
      ) +
      row(
        "Droit a l'image",
        r.di === "Oui" ? "Accorde" : "Refuse",
        r.di === "Oui" ? "#00a86b" : "#cc2222",
      ),
  );

  fh += sec(
    `${isMineur ? 5 : 4} - Assurance`,
    row("Assurance payee", r.ass_payee || "-") +
      row("Date paiement", r.ass_date ? fd(pd(r.ass_date)) : "-") +
      row("Date expiration (+1 an)", assFin ? fd(assFin) : "-", assFin ? assCol : undefined) +
      row("Statut assurance", assLbl2, assCol),
  );

  let promoRowF = "";
  if (r.promo_code && r.mt_original && Number(r.mt_original) !== Number(r.mt)) {
    const promo = getPromoByCode(DEFAULT_PROMOS, r.promo_code);
    const eco = Number(r.mt_original) - Number(r.mt);
    promoRowF =
      row("Tarif original", `${Number(r.mt_original).toLocaleString("fr-FR")} DT`) +
      row(
        "Reduction (" + (promo ? promo.label : r.promo_code) + ")",
        `-${eco.toLocaleString("fr-FR")} DT`,
        "#00a86b",
      ) +
      row("Montant apres reduction", `${Number(r.mt).toLocaleString("fr-FR")} DT`, "#00a86b");
  }

  fh += sec(
    `${isMineur ? 6 : 5} - Paiement`,
    (promoRowF || row("Montant total", `${Number(r.mt).toLocaleString("fr-FR")} DT`, "#111")) +
      row("Acompte verse", `${Number(r.ac).toLocaleString("fr-FR")} DT`, "#00a86b") +
      row(
        "Reste a payer",
        reste > 0 ? `${reste.toLocaleString("fr-FR")} DT` : "Solde",
        reste > 0 ? "#cc2222" : "#00a86b",
      ) +
      row("Mode paiement", r.mp || "-") +
      row("Statut paiement", spLbl, spCol) +
      row("Renouvellements", String(r.nb_renouvellements)),
  );

  const obsN = isMineur ? 8 : 6;
  if (r.obs) fh += sec(`${obsN} - Observations`, row("Observations", r.obs));

  fh += `<div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">`;
  const sigBox = (label: string, foot: string) =>
    `<div style="border:1px solid #e0e0e0;border-radius:6px;padding:14px"><div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:40px">${label}</div><div style="border-top:1px solid #ccc;padding-top:6px;font-size:10px;color:#aaa">${foot}</div></div>`;
  fh += sigBox("Signature de l adherent", "Nom & Date");
  fh += isMineur ? sigBox("Signature du parent", "Nom & Date") : `<div></div>`;
  fh += sigBox("Cachet de l academie", "Responsable");
  fh += `</div>`;
  fh += `<div style="margin-top:12px;padding-top:10px;border-top:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center"><div style="font-size:9px;color:#bbb">DADA HIP HOP ACADEMY - Document officiel - ${numF}</div><div style="width:24px;height:3px;background:#00e5d4;border-radius:2px"></div></div>`;
  fh += `</div>`;

  printDocument(`Fiche ${r.nom}`, fh);
}

/* -------------------------------------------------------------------- csv --- */

function exportCsv(inscriptions: GymInscription[], cours: GymCours[]) {
  const headers = [
    "ID",
    "Nom",
    "Naissance",
    "CIN",
    "Telephone",
    "Email",
    "Statut",
    "Cours",
    "Debut",
    "Fin abo",
    "Montant",
    "Acompte",
    "Reste",
    "Mode",
    "Paiement",
    "Assurance",
    "Exp assurance",
    "Renouvellements",
  ];
  const lines = inscriptions.map((r) => {
    const fin = getFin(r, cours);
    const assFin = getAssFin(r);
    const ps = payeStatus(r);
    return [
      r.id,
      `"${r.nom}"`,
      r.ddn || "",
      r.cin || "",
      r.tel || "",
      r.email || "",
      r.statut,
      `"${r.cn}"`,
      r.dd ?? "",
      fin ? fd(fin) : "",
      r.mt,
      r.ac,
      r.mt - r.ac,
      r.mp || "",
      ps === "P" ? "Paye" : ps === "Pa" ? "Partiel" : "Non paye",
      r.ass_payee || "",
      assFin ? fd(assFin) : "",
      r.nb_renouvellements,
    ].join(",");
  });
  const blob = new Blob(["\uFEFF" + [headers.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dada_salle_de_sport_${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ import -- */

function ImportModal({
  existingCours,
  onClose,
}: {
  existingCours: GymCours[];
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [backup, setBackup] = useState<GymBackup | null>(null);
  const [preview, setPreview] = useState<GymImportPreview | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [replace, setReplace] = useState(false);
  const [importCours, setImportCours] = useState(true);
  const [importPresences, setImportPresences] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{
    inscriptions: number;
    cours: number;
    presences: number;
  } | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    setResult(null);
    setBackup(null);
    setPreview(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseGymBackup(String(e.target?.result ?? ""));
        setBackup(parsed);
        setPreview(previewGymImport(parsed, existingCours));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fichier illisible.");
      }
    };
    reader.readAsText(file);
  };

  const runImport = async () => {
    if (!backup) return;
    if (
      replace &&
      !confirm(
        "Remplacer supprime TOUTES les inscriptions actuelles de la salle de sport. Continuer ?",
      )
    )
      return;
    setRunning(true);
    setError(null);
    setProgress({ done: 0, total: 1 });
    try {
      const res = await importGymBackup(
        backup,
        { replace, importCours, importPresences },
        (done, total) => setProgress({ done, total: Math.max(total, 1) }),
      );
      setResult(res);
      setBackup(null);
      setPreview(null);
      setFileName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur pendant l'import.");
    } finally {
      setRunning(false);
      setProgress(null);
    }
  };

  return (
    <ModalFrame title="Importer une sauvegarde JSON" onClose={onClose}>
      <p className="mb-4 text-xs leading-relaxed text-zinc-400">
        Chargez le fichier JSON exporté par l'application autonome (bouton « Sauvegarder » ou «
        Exporter »). Les inscriptions, cours et présences sont convertis vers la base de données
        locale — les anciens identifiants numériques sont remappés automatiquement.
      </p>

      <div
        className="rounded-xl border border-dashed border-white/20 bg-[#0e0e12] p-6 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {backup ? (
          <div>
            <p className="text-xs font-semibold text-emerald-400">✓ {fileName}</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-2 text-[11px] text-[#00e5d4] hover:underline"
            >
              Choisir un autre fichier
            </button>
          </div>
        ) : (
          <div>
            <Upload className="mx-auto mb-2 h-6 w-6 text-zinc-500" />
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-lg bg-[#00e5d4] px-4 py-2 text-xs font-bold text-black hover:opacity-90"
            >
              Choisir un fichier JSON
            </button>
            <p className="mt-2 text-[10px] text-zinc-500">ou glissez-déposez le fichier ici</p>
          </div>
        )}
      </div>

      {preview && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Kpi label="Inscriptions" value={String(preview.inscriptionsCount)} color="#00e5d4" />
            <Kpi label="Cours" value={String(preview.coursCount)} color="#9d7cf4" />
            <Kpi
              label="Marques de présence"
              value={String(preview.presencesCount)}
              color="#00d68f"
            />
          </div>

          {preview.newCours.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] text-amber-300">
              Nouveaux cours qui seront créés : {preview.newCours.join(", ")}
            </div>
          )}
          {preview.warnings.map((w, i) => (
            <div
              key={i}
              className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] text-amber-300"
            >
              ⚠ {w}
            </div>
          ))}

          <div className="space-y-2 rounded-lg border border-white/10 p-3">
            <label className="flex items-center gap-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={importCours}
                onChange={(e) => setImportCours(e.target.checked)}
              />
              Importer les cours manquants (les cours existants sont conservés)
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={importPresences}
                onChange={(e) => setImportPresences(e.target.checked)}
                disabled={!preview.presencesCount}
              />
              Importer les présences ({preview.presencesCount})
            </label>
            <label className="flex items-center gap-2 text-xs text-red-300">
              <input
                type="checkbox"
                checked={replace}
                onChange={(e) => setReplace(e.target.checked)}
              />
              Remplacer les inscriptions actuelles (supprime tout avant l'import)
            </label>
          </div>

          {progress && (
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-zinc-400">
                <span>Import en cours…</span>
                <span>
                  {progress.done}/{progress.total}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#00e5d4] transition-all"
                  style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              ✓ Import terminé : {result.inscriptions} inscription(s), {result.cours} cours et{" "}
              {result.presences} présence(s) ajoutés.
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
          {error}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-300 hover:bg-white/5"
        >
          Fermer
        </button>
        <button
          onClick={runImport}
          disabled={!backup || running}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#00e5d4] px-4 py-2 text-xs font-bold text-black hover:opacity-90 disabled:opacity-40"
        >
          {running ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {running ? "Import…" : "Lancer l'import"}
        </button>
      </div>
    </ModalFrame>
  );
}
