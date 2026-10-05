// Loads scripts/gym-sample-backup.json (old-app backup format) into PostgreSQL.
// Same field mapping as the admin "Importer" (src/lib/gym.ts mapInscription/mapCours).
//
//   node scripts/load-gym-backup.mjs [path/to/backup.json]

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] || join(here, "gym-sample-backup.json");
const data = JSON.parse(readFileSync(file, "utf8"));

const q = (v) => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return `'${String(v).replace(/'/g, "''")}'`;
};

const toDate = (v) => {
  const str = String(v || "").trim();
  if (!str) return "null";
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `'${m[1]}-${m[2]}-${m[3]}'`;
  const fr = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (fr) return `'${fr[3]}-${fr[2].padStart(2, "0")}-${fr[1].padStart(2, "0")}'`;
  return "null";
};

const str = (v) => String(v ?? "");

const inscCols = [
  "nom",
  "ddn",
  "cin",
  "adresse",
  "tel",
  "email",
  "statut",
  "np",
  "tp",
  "cin_parent",
  "adresse_parent",
  "cn",
  "dd",
  "mt",
  "mt_original",
  "ac",
  "mp",
  "ap",
  "di",
  "obs",
  "ass_payee",
  "ass_date",
  "promo_code",
  "promo_type",
  "promo_valeur",
  "nb_renouvellements",
  "historique",
];

const inscVals = (r) => [
  q(str(r.nom).trim()),
  q(str(r.ddn)),
  q(str(r.cin)),
  q(str(r.adresse)),
  q(str(r.tel)),
  q(str(r.email)),
  q(str(r.statut) === "Mineur" ? "Mineur" : "Majeur"),
  q(str(r.np)),
  q(str(r.tp)),
  q(str(r.cin_parent)),
  q(str(r.adresse_parent)),
  q(str(r.cn)),
  toDate(r.dd),
  q(Number(r.mt) || 0),
  q(Number(r.mt_original ?? r.mt) || 0),
  q(Number(r.ac) || 0),
  q(str(r.mp)),
  q(str(r.ap)),
  q(str(r.di)),
  q(str(r.obs)),
  q(str(r.ass_payee)),
  toDate(r.ass_date),
  q(str(r.promo_code)),
  q(str(r.promo_type)),
  q(Number(r.promo_valeur) || 0),
  q(Number(r.nb_renouvellements) || 0),
  q(
    JSON.stringify(Array.isArray(r.historique_renouvellements) ? r.historique_renouvellements : []),
  ) + "::jsonb",
];

const statements = [];

for (const c of data.cours || []) {
  statements.push(
    `insert into gym_cours (nom, pub, duree_mois, tarif, couleur, sort_order)
     select ${q(str(c.nom))}, ${q(str(c.pub))}, ${Number(c.dm) || 3}, ${Number(c.tarif) || 0}, ${q(str(c.col) || "#00e5d4")},
       coalesce((select max(sort_order) from gym_cours), 0) + 1
     where not exists (select 1 from gym_cours where nom = ${q(str(c.nom))});`,
  );
}

for (const r of data.inscriptions || []) {
  if (!str(r.nom).trim()) continue;
  statements.push(
    `insert into gym_inscriptions (${inscCols.join(", ")}) values (${inscVals(r).join(", ")});`,
  );
}

const sql = statements.join("\n") + "\n";
const psql = [
  "exec",
  "-i",
  "dada-db",
  "psql",
  "-v",
  "ON_ERROR_STOP=1",
  "-U",
  "dadahiphop",
  "-d",
  "dadahiphop",
];
execFileSync("docker", psql, { input: sql, stdio: ["pipe", "inherit", "inherit"] });

console.log(
  `imported ${(data.inscriptions || []).length} inscriptions and ${(data.cours || []).length} cours from ${file}`,
);
