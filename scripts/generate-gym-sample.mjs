// Reproduces the sample dataset of the standalone DADA_App HTML app
// (loadSample() + the default `cours` array) into the old-app backup format
// consumed by the gym importer.
//
//   node scripts/generate-gym-sample.mjs [YYYY-MM-DD]
//
// The optional date is used as "today" so the generated dd/ass_date values are
// stable across runs (defaults to the local current day).

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const arg = process.argv[2];
const today = arg ? new Date(`${arg}T00:00:00`) : new Date();
today.setHours(0, 0, 0, 0);

const iso = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const cours = [
  { nom: "Dance Hip-Hop", pub: "Tous ages", dm: 3, tarif: 360, col: "#00e5d4" },
  { nom: "Dance Contemporaine", pub: "Tous ages", dm: 3, tarif: 380, col: "#9d7cf4" },
  { nom: "Gymnastique", pub: "Enfants / Ados", dm: 3, tarif: 350, col: "#00d68f" },
  { nom: "Gymnastique / Bac Sport", pub: "Lyceens", dm: 3, tarif: 400, col: "#ffb800" },
  { nom: "Special Femme", pub: "Femmes adultes", dm: 3, tarif: 420, col: "#f97316" },
  { nom: "Cours Fitness Mix", pub: "Adultes", dm: 3, tarif: 430, col: "#ff3b3b" },
  { nom: "Kung Fu", pub: "Enfants / Adultes", dm: 3, tarif: 370, col: "#00e5d4" },
  { nom: "Lutte", pub: "Adolescents / Adultes", dm: 3, tarif: 500, col: "#ff3b3b" },
  { nom: "Autre", pub: "-", dm: 3, tarif: 0, col: "#333" },
];

const getCi = (nom) => cours.find((c) => c.nom === nom) || { dm: 3, tarif: 0 };

const noms = [
  "Ben Salah Ahmed",
  "Trabelsi Sonia",
  "Mansouri Khaled",
  "Gharbi Nadia",
  "Hamdi Youssef",
  "Bouaziz Rim",
  "Chaari Mohamed",
  "Saad Leila",
  "Jlassi Omar",
  "Ben Ali Fatma",
  "Ferchichi Hatem",
  "Dridi Asma",
  "Mejri Walid",
  "Ben Romdhane Ines",
  "Slama Karim",
  "Ouertani Maha",
  "Khelif Rami",
  "Kchaou Dorra",
  "Fehri Tarek",
  "Bechir Sana",
  "Ben Jemaa Slim",
  "Gafsi Rania",
  "Triki Aymen",
  "Saidi Wiem",
  "Lahmar Houssem",
  "Ben Hassen Nour",
  "Chaabane Firas",
  "Riahi Yosra",
  "Zidi Mehdi",
  "Ben Amor Mariem",
  "Belhaj Sami",
  "Mezni Olfa",
  "Jlidi Souheil",
  "Khemiri Amira",
  "Baccar Selim",
  "Mnif Cyrine",
  "Turki Aziz",
  "Boughanmi Sara",
  "Ghanem Mourad",
  "Agrebi Yasmine",
  "Nasr Farouk",
  "Hammouda Rim",
];
const cNames = [
  "Dance Hip-Hop",
  "Dance Contemporaine",
  "Gymnastique",
  "Special Femme",
  "Kung Fu",
  "Lutte",
  "Cours Fitness Mix",
  "Gymnastique / Bac Sport",
];
const mods = ["Especes", "Cheque", "Virement", "Especes", "Especes"];
const sts = ["Majeur", "Mineur", "Majeur", "Majeur", "Mineur", "Majeur", "Majeur", "Mineur"];
const offs = [
  0, 0, 0, 1, 1, 2, 3, 4, 5, 6, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 25, 27, 30, 33,
  36, 40, 45, 50, 55, 60, 65, 70, 80, 90, 100, 120, 140, 160,
];

const inscriptions = [];
let nextId = 1;
for (let i = 0; i < noms.length; i += 1) {
  const d = new Date(today);
  d.setDate(d.getDate() - offs[i]);
  const cn = cNames[i % cNames.length];
  const t = getCi(cn).tarif || 360;
  const ac = [0, 0.5, 1][i % 3] * t;
  const st = sts[i % sts.length];
  const assPayee = i % 4 !== 0 ? "Oui" : "Non";
  const assDate = assPayee === "Oui" ? iso(d) : "";
  inscriptions.push({
    id: nextId++,
    nom: noms[i],
    ddn: `01/01/${1995 + (i % 25)}`,
    cin: `0${10000000 + i * 777777}`,
    adresse: `Tunis, Rue ${i} Avenue`,
    tel: `5${1000000 + i * 123456}`,
    email: `${noms[i].split(" ")[0].toLowerCase()}${i + 1}@email.com`,
    statut: st,
    np: st === "Mineur" ? `Parent ${noms[i].split(" ")[1]}` : "",
    tp: st === "Mineur" ? `71${100000 + i * 11111}` : "",
    cin_parent: st === "Mineur" ? `0${20000000 + i * 333333}` : "",
    adresse_parent: "",
    cn,
    dd: iso(d),
    mt: t,
    ac: Math.round(ac),
    promo_code: "",
    promo_type: "",
    promo_valeur: 0,
    mt_original: t,
    nb_renouvellements: 0,
    historique_renouvellements: [],
    mp: mods[i % mods.length],
    ap: st === "Mineur" ? "Oui" : "",
    di: i % 3 === 0 ? "Non" : "Oui",
    obs: "",
    ass_payee: assPayee,
    ass_date: assDate,
  });
}

const backup = {
  inscriptions,
  cours,
  nextId,
  presences: {},
  at: new Date().toISOString(),
};

const out = join(here, "gym-sample-backup.json");
writeFileSync(out, JSON.stringify(backup, null, 2));
console.log(`wrote ${out}: ${inscriptions.length} inscriptions, ${cours.length} cours`);
