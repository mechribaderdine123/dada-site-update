-- Salle de sport (gym management) — local PostgreSQL schema.
-- Applied by src/server/db/migrate.server.ts and recorded in schema_migrations.

-- ------------------------------------------------------------------- cours --
-- Gym classes/sections with their pricing (same defaults as the original app).

create table if not exists gym_cours (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  pub text not null default '',
  duree_mois integer not null default 3,
  tarif numeric(10, 2) not null default 0,
  couleur text not null default '#00e5d4',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists gym_cours_set_updated_at on gym_cours;
create trigger gym_cours_set_updated_at
  before update on gym_cours
  for each row execute function set_updated_at();

-- ------------------------------------------------------------ inscriptions --
-- One row per member. Personal data, subscription and insurance state, medical
-- sheet, payment and renewal history all live here so the module stays
-- self-contained. `historique` is a JSONB array of renewals (the shape the app
-- already renders), updated_at keeps the row fresh.

create table if not exists gym_inscriptions (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  ddn text not null default '',
  cin text not null default '',
  adresse text not null default '',
  tel text not null default '',
  email text not null default '',
  statut text not null default 'Majeur' check (statut in ('Majeur', 'Mineur')),
  np text not null default '',
  tp text not null default '',
  cin_parent text not null default '',
  adresse_parent text not null default '',
  cn text not null,
  dd date,
  mt numeric(10, 2) not null default 0,
  mt_original numeric(10, 2) not null default 0,
  ac numeric(10, 2) not null default 0,
  mp text not null default '',
  ap text not null default '',
  di text not null default '',
  obs text not null default '',
  ass_payee text not null default '',
  ass_date date,
  med_groupe_sanguin text not null default '',
  med_autorisation_sport text not null default '',
  med_maladies text not null default '',
  med_allergies text not null default '',
  med_medicaments text not null default '',
  med_urgence_nom text not null default '',
  med_urgence_tel text not null default '',
  med_remarques text not null default '',
  promo_code text not null default '',
  promo_type text not null default '',
  promo_valeur numeric(10, 2) not null default 0,
  nb_renouvellements integer not null default 0,
  historique jsonb not null default '[]'::jsonb,
  abonnement_suspendu boolean not null default false,
  abonnement_arrete boolean not null default false,
  ne_pas_renouveler boolean not null default false,
  suspension_motif text not null default '',
  suspension_date text not null default '',
  suspension_note text not null default '',
  arret_motif text not null default '',
  arret_date text not null default '',
  arret_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gym_inscriptions_cn_idx on gym_inscriptions (cn);
create index if not exists gym_inscriptions_dd_idx on gym_inscriptions (dd);

drop trigger if exists gym_inscriptions_set_updated_at on gym_inscriptions;
create trigger gym_inscriptions_set_updated_at
  before update on gym_inscriptions
  for each row execute function set_updated_at();

-- --------------------------------------------------------------- presences --
-- Attendance is stored per (date, session, member) — the same model the
-- original app kept in localStorage, but shared across devices.

create table if not exists gym_presences (
  id uuid primary key default gen_random_uuid(),
  pres_date date not null,
  session text not null default '',
  inscription_id uuid not null references gym_inscriptions (id) on delete cascade,
  statut text not null check (statut in ('present', 'absent', 'justifie')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pres_date, session, inscription_id)
);

create index if not exists gym_presences_date_idx on gym_presences (pres_date);

drop trigger if exists gym_presences_set_updated_at on gym_presences;
create trigger gym_presences_set_updated_at
  before update on gym_presences
  for each row execute function set_updated_at();

-- -------------------------------------------------------------------- seed --
-- Default courses shipped with the app (skipped when rows already exist).

insert into gym_cours (nom, pub, duree_mois, tarif, couleur, sort_order)
select v.nom, v.pub, v.dm, v.tarif, v.col, v.so
from (values
  ('Dance Hip-Hop', 'Tous ages', 3, 360, '#00e5d4', 1),
  ('Dance Contemporaine', 'Tous ages', 3, 380, '#9d7cf4', 2),
  ('Gymnastique', 'Enfants / Ados', 3, 350, '#00d68f', 3),
  ('Gymnastique / Bac Sport', 'Lyceens', 3, 400, '#ffb800', 4),
  ('Special Femme', 'Femmes adultes', 3, 420, '#f97316', 5),
  ('Cours Fitness Mix', 'Adultes', 3, 430, '#ff3b3b', 6),
  ('Kung Fu', 'Enfants / Adultes', 3, 370, '#00e5d4', 7),
  ('Lutte', 'Adolescents / Adultes', 3, 500, '#ff3b3b', 8),
  ('Autre', '-', 3, 0, '#333333', 9)
) as v(nom, pub, dm, tarif, col, so)
where not exists (select 1 from gym_cours);
