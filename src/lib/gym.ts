// Salle de sport — data layer. Everything goes through the project's own REST
// API (/api/db) and therefore into the local PostgreSQL database, exactly like
// the rest of the admin dashboard. Nothing is stored in the browser.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// -------------------------------------------------------------------- types --

export type GymCours = {
  id: string;
  nom: string;
  pub: string;
  duree_mois: number;
  tarif: number;
  couleur: string;
  sort_order: number;
};

export type GymRenewal = {
  date_renouvellement: string;
  dd: string;
  df: string;
  mt: number;
  ac: number;
};

export type GymInscription = {
  id: string;
  nom: string;
  ddn: string;
  cin: string;
  adresse: string;
  tel: string;
  email: string;
  statut: "Majeur" | "Mineur";
  np: string;
  tp: string;
  cin_parent: string;
  adresse_parent: string;
  cn: string;
  dd: string | null;
  mt: number;
  mt_original: number;
  ac: number;
  mp: string;
  ap: string;
  di: string;
  obs: string;
  ass_payee: string;
  ass_date: string | null;
  med_groupe_sanguin: string;
  med_autorisation_sport: string;
  med_maladies: string;
  med_allergies: string;
  med_medicaments: string;
  med_urgence_nom: string;
  med_urgence_tel: string;
  med_remarques: string;
  promo_code: string;
  promo_type: string;
  promo_valeur: number;
  nb_renouvellements: number;
  historique: GymRenewal[];
  abonnement_suspendu: boolean;
  abonnement_arrete: boolean;
  ne_pas_renouveler: boolean;
  suspension_motif: string;
  suspension_date: string;
  suspension_note: string;
  arret_motif: string;
  arret_date: string;
  arret_note: string;
  created_at: string;
  updated_at: string;
};

export type GymInscriptionInput = Omit<
  GymInscription,
  "id" | "nb_renouvellements" | "historique" | "created_at" | "updated_at"
>;

export type GymPresence = {
  id: string;
  pres_date: string;
  session: string;
  inscription_id: string;
  statut: "present" | "absent" | "justifie";
};

export type GymPromo = {
  code: string;
  label: string;
  type: "pct" | "fixe";
  valeur: number;
  desc: string;
};

// The promo formulas ship with the module (same as the original app); they are
// edited in place from the UI and only persist inside each row's promo fields.
export const DEFAULT_PROMOS: GymPromo[] = [
  {
    code: "FAMILLE",
    label: "Tarif famille",
    type: "pct",
    valeur: 20,
    desc: "20% pour membres de la meme famille",
  },
  {
    code: "ETUDIANT",
    label: "Tarif etudiant",
    type: "pct",
    valeur: 15,
    desc: "15% sur presentation carte etudiant",
  },
  {
    code: "FIDELITE",
    label: "Fidelite 2eme annee",
    type: "pct",
    valeur: 10,
    desc: "10% pour adherents renouvellant",
  },
  {
    code: "EARLY",
    label: "Inscription anticipee",
    type: "pct",
    valeur: 10,
    desc: "10% avant le 15 septembre",
  },
  {
    code: "2COURS",
    label: "2 cours simultanes",
    type: "pct",
    valeur: 25,
    desc: "25% a partir du 2eme cours",
  },
  {
    code: "BIENVENUE",
    label: "Nouvelle inscription",
    type: "fixe",
    valeur: 30,
    desc: "30 DT offerts 1ere inscription",
  },
  {
    code: "PARRAIN",
    label: "Parrainage",
    type: "fixe",
    valeur: 50,
    desc: "50 DT de reduction par parrainage",
  },
  {
    code: "RAMADAN",
    label: "Offre Ramadan",
    type: "pct",
    valeur: 15,
    desc: "15% pendant le mois de Ramadan",
  },
  {
    code: "PERSONNALISE",
    label: "Reduction manuelle",
    type: "fixe",
    valeur: 0,
    desc: "Montant personnalise",
  },
];

export function getPromoByCode(promos: GymPromo[], code: string): GymPromo | undefined {
  return promos.find((p) => p.code === code);
}

// ------------------------------------------------------------------- helpers --

/** Today's date, as YYYY-MM-DD in the *local* timezone (not UTC). */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function pd(s: string | null | undefined): Date | null {
  if (!s) return null;
  // Parse bare YYYY-MM-DD as *local* midnight — new Date("YYYY-MM-DD") would
  // give UTC midnight and shift the day in non-UTC timezones.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  d.setHours(0, 0, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

export function fd(d: Date | null): string {
  if (!d) return "-";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function daysLeft(fin: Date | null): number | null {
  if (!fin) return null;
  const today = pd(todayISO())!;
  return Math.round((fin.getTime() - today.getTime()) / 86400000);
}

export function getCoursInfo(cours: GymCours[], nom: string): GymCours | undefined {
  return cours.find((c) => c.nom === nom);
}

/** Subscription end date: start + the course's duration in months. */
export function getFin(r: GymInscription, cours: GymCours[]): Date | null {
  const d = pd(r.dd);
  if (!d) return null;
  const c = getCoursInfo(cours, r.cn);
  const f = new Date(d);
  f.setMonth(f.getMonth() + (c?.duree_mois ?? 3));
  return f;
}

/** Insurance end date: payment date + 1 year. */
export function getAssFin(r: GymInscription): Date | null {
  const d = pd(r.ass_date);
  if (!d) return null;
  const f = new Date(d);
  f.setFullYear(f.getFullYear() + 1);
  return f;
}

export type SubStatus = "active" | "soon" | "expired";

export function subStatus(r: GymInscription, cours: GymCours[]): SubStatus {
  const dl = daysLeft(getFin(r, cours));
  if (dl === null) return "expired";
  if (dl < 0) return "expired";
  if (dl <= 14) return "soon";
  return "active";
}

export type PayStatus = "P" | "Pa" | "N";

export function payeStatus(r: GymInscription): PayStatus {
  if (r.mt > 0 && r.ac >= r.mt) return "P";
  if (r.ac > 0) return "Pa";
  return "N";
}

export type AssStatus = "active" | "soon" | "expired" | "np";

export function assStatus(r: GymInscription): AssStatus {
  if (r.ass_payee !== "Oui") return "np";
  const dl = daysLeft(getAssFin(r));
  if (dl === null) return "np";
  if (dl < 0) return "expired";
  if (dl <= 30) return "soon";
  return "active";
}

// ---------------------------------------------------------------- periodes --

export type GymPeriod = "day" | "week" | "month";

export const GYM_PERIODS: Array<{ id: GymPeriod; label: string }> = [
  { id: "day", label: "Aujourd'hui" },
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
];

export function periodLabel(p: GymPeriod): string {
  return p === "day" ? "Aujourd'hui" : p === "week" ? "Cette semaine" : "Ce mois";
}

/** Monday of the week containing `d` (00:00 local). */
function weekStart(d: Date): Date {
  const s = new Date(d);
  const day = s.getDay();
  s.setDate(s.getDate() - day + (day === 0 ? -6 : 1));
  s.setHours(0, 0, 0, 0);
  return s;
}

/** The 7 (day), 7 (week) or 6 (month) buckets shown in the period charts. */
export function periodBuckets(p: GymPeriod): Array<{ key: Date; label: string }> {
  const now = pd(todayISO()) ?? new Date();
  const out: Array<{ key: Date; label: string }> = [];
  if (p === "day") {
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      out.push({
        key: d,
        label: d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 3),
      });
    }
    return out;
  }
  if (p === "week") {
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      out.push({ key: weekStart(d), label: i === 0 ? "S." : `S-${i}` });
    }
    return out;
  }
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: d,
      label: d.toLocaleDateString("fr-FR", { month: "short" }),
    });
  }
  return out;
}

function samePeriod(a: Date, b: Date, p: GymPeriod): boolean {
  if (p === "day") return a.toDateString() === b.toDateString();
  if (p === "week") return weekStart(a).getTime() === weekStart(b).getTime();
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Does the inscription fall inside the given bucket? */
export function inBucket(r: GymInscription, key: Date, p: GymPeriod): boolean {
  const d = pd(r.dd);
  if (!d) return false;
  return samePeriod(d, key, p);
}

/** Does it fall in the current day / week / month? */
export function inPeriod(r: GymInscription, p: GymPeriod): boolean {
  const today = pd(todayISO()) ?? new Date();
  return inBucket(r, today, p);
}

/** Does it fall in the day / week / month right before the current one? */
export function inPrevPeriod(r: GymInscription, p: GymPeriod): boolean {
  const prev = pd(todayISO()) ?? new Date();
  if (p === "day") prev.setDate(prev.getDate() - 1);
  else if (p === "week") prev.setDate(prev.getDate() - 7);
  else prev.setMonth(prev.getMonth() - 1);
  return inBucket(r, prev, p);
}

/** "↑ +12%", "↓ -4%" or "↑ Nouveau" — the trend badge of the period cards. */
export function periodTrend(
  cur: number,
  prev: number,
): { text: string; tone: "up" | "down" | "eq" } {
  if (prev === 0) {
    return cur > 0 ? { text: "↑ Nouveau", tone: "up" } : { text: "—", tone: "eq" };
  }
  const pp = Math.round(((cur - prev) / prev) * 100);
  return pp >= 0 ? { text: `↑ +${pp}%`, tone: "up" } : { text: `↓ ${pp}%`, tone: "down" };
}

// ------------------------------------------------------------------- queries --

const GYM_COURLS_COLUMNS = "id,nom,pub,duree_mois,tarif,couleur,sort_order";
const GYM_PRESENCE_COLUMNS = "id,pres_date,session,inscription_id,statut";

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

function normaliseCours(row: Record<string, unknown>): GymCours {
  return {
    id: String(row.id),
    nom: String(row.nom ?? ""),
    pub: String(row.pub ?? ""),
    duree_mois: num(row.duree_mois, 3),
    tarif: num(row.tarif, 0),
    couleur: String(row.couleur ?? "#00e5d4"),
    sort_order: num(row.sort_order, 0),
  };
}

function normaliseInscription(row: Record<string, unknown>): GymInscription {
  return {
    ...(row as unknown as GymInscription),
    dd: dateOnlyString(row.dd),
    ass_date: dateOnlyString(row.ass_date),
    mt: num(row.mt, 0),
    mt_original: num(row.mt_original, 0),
    ac: num(row.ac, 0),
    promo_valeur: num(row.promo_valeur, 0),
    nb_renouvellements: num(row.nb_renouvellements, 0),
    historique: parseHistorique(row.historique),
  };
}

/** The pg driver returns `date` columns as Date objects at local midnight;
 * after JSON serialisation the client receives "...T23:00:00.000Z"-style UTC
 * timestamps — always reduce them back to the local calendar day (YYYY-MM-DD). */
export function dateOnlyString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const raw = String(value);
  // Full ISO timestamp: convert the instant to the local calendar day.
  if (/^\d{4}-\d{2}-\d{2}[T ]/.test(raw)) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return dateOnlyString(d);
  }
  return raw.split("T")[0] || null;
}

/** The jsonb column may come back as an array or as a JSON string. */
function parseHistorique(value: unknown): GymRenewal[] {
  if (Array.isArray(value)) return value as GymRenewal[];
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as GymRenewal[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** The /api/db payload layer only accepts primitive values, so the renewal
 * history travels as a JSON string into the jsonb column. */
function serialiseHistorique(value: unknown): string {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

export async function listCours(): Promise<GymCours[]> {
  const { data, error } = await supabase
    .from("gym_cours")
    .select(GYM_COURLS_COLUMNS)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return ((data as unknown as Record<string, unknown>[]) ?? []).map(normaliseCours);
}

export async function listInscriptions(): Promise<GymInscription[]> {
  const { data, error } = await supabase
    .from("gym_inscriptions")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data as unknown as Record<string, unknown>[]) ?? []).map(normaliseInscription);
}

export async function listPresences(): Promise<GymPresence[]> {
  const { data, error } = await supabase
    .from("gym_presences")
    .select(GYM_PRESENCE_COLUMNS)
    .order("pres_date", { ascending: true });
  if (error) throw error;
  return ((data as unknown as Record<string, unknown>[]) ?? []).map((row) => ({
    ...(row as unknown as GymPresence),
    pres_date: dateOnlyString(row.pres_date) ?? "",
  }));
}

export async function insertCours(input: Omit<GymCours, "id">): Promise<string | null> {
  const { data, error } = await supabase.from("gym_cours").insert(input).select("id");
  if (error) throw error;
  return (data?.[0] as { id: string } | undefined)?.id ?? null;
}

export async function updateCours(id: string, patch: Partial<GymCours>): Promise<void> {
  const { error } = await supabase.from("gym_cours").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteCours(id: string): Promise<void> {
  const { error } = await supabase.from("gym_cours").delete().eq("id", id);
  if (error) throw error;
}

// `dd` and `ass_date` are nullable `date` columns — an empty string from a
// cleared date input must go out as null or PostgreSQL rejects the insert.
const GYM_DATE_COLUMNS = ["dd", "ass_date"] as const;

function withNullableDates<T>(payload: T): T {
  if (!payload || typeof payload !== "object") return payload;
  const out: Record<string, unknown> = { ...(payload as Record<string, unknown>) };
  for (const col of GYM_DATE_COLUMNS) {
    if (typeof out[col] === "string" && (out[col] as string).trim() === "") out[col] = null;
  }
  return out as T;
}

export async function insertInscription(
  input: GymInscriptionInput,
  extras?: { nb_renouvellements?: number; historique?: GymRenewal[] },
): Promise<string | null> {
  const { data, error } = await supabase
    .from("gym_inscriptions")
    .insert({
      ...withNullableDates(input),
      nb_renouvellements: extras?.nb_renouvellements ?? 0,
      historique: serialiseHistorique(extras?.historique ?? []),
    })
    .select("id");
  if (error) throw error;
  return (data?.[0] as { id: string } | undefined)?.id ?? null;
}

export async function updateInscription(id: string, patch: Partial<GymInscription>): Promise<void> {
  const raw =
    "historique" in patch ? { ...patch, historique: serialiseHistorique(patch.historique) } : patch;
  const payload = withNullableDates(raw);
  const { error } = await supabase.from("gym_inscriptions").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteInscription(id: string): Promise<void> {
  const { error } = await supabase.from("gym_inscriptions").delete().eq("id", id);
  if (error) throw error;
}

// ------------------------------------------------------------------- import --
// Loads a backup exported by the original standalone HTML app ("Sauvegarder" /
// "Exporter" buttons) into the database. The old format is
//   { inscriptions: [...], cours: [{nom,pub,dm,tarif,col}], nextId,
//     presences: { "YYYY-MM-DD": { "Session 1": { "12": "present" } } } }
// and this module maps every field onto the local database schema.

export type GymBackupCours = {
  nom: string;
  pub?: string;
  dm?: number;
  tarif?: number;
  col?: string;
};

export type GymBackupInscription = Record<string, unknown> & {
  nom?: string;
  cn?: string;
};

export type GymBackup = {
  cours?: GymBackupCours[];
  inscriptions?: GymBackupInscription[];
  presences?: Record<string, Record<string, Record<string, string>>>;
};

export type GymImportPreview = {
  coursCount: number;
  inscriptionsCount: number;
  presencesCount: number;
  warnings: string[];
  newCours: string[];
};

export type GymImportOptions = {
  replace: boolean;
  importCours: boolean;
  importPresences: boolean;
};

const s = (v: unknown): string => (v === null || v === undefined ? "" : String(v));

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const FR_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** Accepts ISO (2026-01-31), French (31/01/2026) and Date-parseable strings. */
function toDateOnly(v: unknown): string | null {
  const raw = s(v).trim();
  if (!raw) return null;
  if (ISO_DATE.test(raw)) return raw;
  const fr = FR_DATE.exec(raw);
  if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
}

function mapCours(c: GymBackupCours): Omit<GymCours, "id"> {
  return {
    nom: s(c.nom),
    pub: s(c.pub),
    duree_mois: num(c.dm, 3),
    tarif: num(c.tarif, 0),
    couleur: s(c.col) || "#00e5d4",
    sort_order: 0,
  };
}

function mapInscription(
  r: GymBackupInscription,
  warnings: string[],
): GymInscriptionInput & {
  nb_renouvellements: number;
  historique: GymRenewal[];
} {
  const nom = s(r.nom).trim();
  if (!nom) warnings.push("Une inscription sans nom a été ignorée.");
  const statut = s(r.statut) === "Mineur" ? "Mineur" : "Majeur";

  const historique: GymRenewal[] = Array.isArray(r.historique_renouvellements)
    ? (r.historique_renouvellements as GymRenewal[]).map((h) => ({
        date_renouvellement: s(h.date_renouvellement),
        dd: s(h.dd),
        df: s(h.df),
        mt: num(h.mt, 0),
        ac: num(h.ac, 0),
      }))
    : [];

  return {
    nom,
    ddn: s(r.ddn),
    cin: s(r.cin),
    adresse: s(r.adresse),
    tel: s(r.tel),
    email: s(r.email),
    statut,
    np: s(r.np),
    tp: s(r.tp),
    cin_parent: s(r.cin_parent),
    adresse_parent: s(r.adresse_parent),
    cn: s(r.cn),
    dd: toDateOnly(r.dd),
    mt: num(r.mt, 0),
    mt_original: num(r.mt_original, num(r.mt, 0)),
    ac: num(r.ac, 0),
    mp: s(r.mp),
    ap: s(r.ap),
    di: s(r.di),
    obs: s(r.obs),
    ass_payee: s(r.ass_payee),
    ass_date: toDateOnly(r.ass_date),
    med_groupe_sanguin: s(r.med_groupe_sanguin),
    med_autorisation_sport: s(r.med_autorisation_sport),
    med_maladies: s(r.med_maladies),
    med_allergies: s(r.med_allergies),
    med_medicaments: s(r.med_medicaments),
    med_urgence_nom: s(r.med_urgence_nom),
    med_urgence_tel: s(r.med_urgence_tel),
    med_remarques: s(r.med_remarques),
    promo_code: s(r.promo_code),
    promo_type: s(r.promo_type),
    promo_valeur: num(r.promo_valeur, 0),
    abonnement_suspendu: r.abonnement_suspendu === true,
    abonnement_arrete: r.abonnement_arrete === true,
    ne_pas_renouveler: r.ne_pas_renouveler === true,
    suspension_motif: s(r.suspension_motif),
    suspension_date: s(r.suspension_date),
    suspension_note: s(r.suspension_note),
    arret_motif: s(r.arret_motif),
    arret_date: s(r.arret_date),
    arret_note: s(r.arret_note),
    nb_renouvellements: num(r.nb_renouvellements, historique.length) || historique.length,
    historique,
  };
}

export function parseGymBackup(json: string): GymBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Fichier JSON invalide.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Format inattendu : l'objet de sauvegarde est introuvable.");
  }
  const backup = parsed as GymBackup;
  if (!Array.isArray(backup.inscriptions) && !Array.isArray(backup.cours)) {
    throw new Error(
      "Aucune inscription ni cours trouvé dans ce fichier. S'agit-il bien d'une sauvegarde de l'application ?",
    );
  }
  return backup;
}

/** Dry-run mapping used by the confirmation dialog. */
export function previewGymImport(backup: GymBackup, existingCours: GymCours[]): GymImportPreview {
  const warnings: string[] = [];
  const known = new Set(existingCours.map((c) => c.nom));
  const newCours = new Set<string>();
  let inscriptionsCount = 0;

  for (const c of backup.cours ?? []) {
    if (s(c.nom) && !known.has(s(c.nom))) newCours.add(s(c.nom));
  }
  for (const r of backup.inscriptions ?? []) {
    if (!s(r.nom).trim()) continue;
    inscriptionsCount++;
    const cn = s(r.cn);
    if (cn && !known.has(cn) && !newCours.has(cn)) {
      newCours.add(cn);
      warnings.push(`Cours "${cn}" absent de la base : il sera créé.`);
    }
  }
  let presencesCount = 0;
  for (const day of Object.values(backup.presences ?? {})) {
    for (const session of Object.values(day ?? {})) {
      presencesCount += Object.keys(session ?? {}).length;
    }
  }

  return {
    coursCount: (backup.cours ?? []).filter((c) => s(c.nom)).length,
    inscriptionsCount,
    presencesCount,
    warnings,
    newCours: [...newCours],
  };
}

export async function importGymBackup(
  backup: GymBackup,
  options: GymImportOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<{ inscriptions: number; cours: number; presences: number }> {
  const warnings: string[] = [];

  if (options.replace) {
    const existing = await listInscriptions();
    let done = 0;
    for (const row of existing) {
      await deleteInscription(row.id);
      onProgress?.(++done, existing.length);
    }
  }

  // Cours: insert only the ones that do not already exist (names are the key
  // the rest of the app matches on).
  let coursInserted = 0;
  if (options.importCours) {
    const existing = await listCours();
    const names = new Set(existing.map((c) => c.nom));
    let order = existing.length;
    for (const c of backup.cours ?? []) {
      const mapped = mapCours(c);
      if (!mapped.nom || names.has(mapped.nom)) continue;
      await insertCours({ ...mapped, sort_order: ++order });
      names.add(mapped.nom);
      coursInserted++;
    }
  }

  // Any inscription referencing an unknown course would break the UI, so
  // missing ones are created on the fly with sane defaults.
  const coursNow = await listCours();
  const coursNames = new Set(coursNow.map((c) => c.nom));
  for (const r of backup.inscriptions ?? []) {
    const cn = s(r.cn);
    if (cn && !coursNames.has(cn)) {
      await insertCours({
        nom: cn,
        pub: "",
        duree_mois: 3,
        tarif: 0,
        couleur: "#00e5d4",
        sort_order: 900,
      });
      coursNames.add(cn);
    }
  }

  const inscriptions = (backup.inscriptions ?? []).filter((r) => s(r.nom).trim());
  const idMap = new Map<string, string>();
  let done = 0;
  for (const r of inscriptions) {
    const mapped = mapInscription(r, warnings);
    if (!mapped.nom) continue;
    const { nb_renouvellements, historique, ...rest } = mapped;
    const id = await insertInscription(rest, { nb_renouvellements, historique });
    const oldId = r.id === null || r.id === undefined ? undefined : String(r.id);
    if (id && oldId) idMap.set(oldId, id);
    onProgress?.(++done, inscriptions.length);
  }

  // Presences: { "2026-01-31": { "Session 1": { "12": "present" } } } — the
  // inner keys are the OLD numeric ids, remapped to the new uuids.
  let presencesInserted = 0;
  if (options.importPresences && backup.presences) {
    for (const [date, sessions] of Object.entries(backup.presences)) {
      if (!ISO_DATE.test(date)) continue;
      for (const [session, marks] of Object.entries(sessions ?? {})) {
        for (const [oldId, statut] of Object.entries(marks ?? {})) {
          const newId = idMap.get(String(oldId));
          if (!newId) continue;
          if (statut !== "present" && statut !== "absent" && statut !== "justifie") continue;
          await setPresence(date, session, newId, statut);
          presencesInserted++;
        }
      }
    }
  }

  return { inscriptions: idMap.size, cours: coursInserted, presences: presencesInserted };
}

export async function setPresence(
  presDate: string,
  session: string,
  inscriptionId: string,
  statut: GymPresence["statut"] | null,
): Promise<void> {
  // Upsert semantics handled client-side: delete then insert keeps the
  // (date, session, member) triple unique without a conflict target.
  const { error: delError } = await supabase
    .from("gym_presences")
    .delete()
    .eq("pres_date", presDate)
    .eq("session", session)
    .eq("inscription_id", inscriptionId);
  if (delError) throw delError;
  if (!statut) return;
  const { error } = await supabase
    .from("gym_presences")
    .insert({ pres_date: presDate, session, inscription_id: inscriptionId, statut });
  if (error) throw error;
}

// --------------------------------------------------------------------- hook --

export type GymData = {
  cours: GymCours[];
  inscriptions: GymInscription[];
  presences: GymPresence[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useGymData(): GymData {
  const [cours, setCours] = useState<GymCours[]>([]);
  const [inscriptions, setInscriptions] = useState<GymInscription[]>([]);
  const [presences, setPresences] = useState<GymPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, i, p] = await Promise.all([listCours(), listInscriptions(), listPresences()]);
      setCours(c);
      setInscriptions(i);
      setPresences(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { cours, inscriptions, presences, loading, error, reload };
}
