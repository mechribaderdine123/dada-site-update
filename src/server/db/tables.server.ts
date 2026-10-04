// Whitelist of tables the REST layer may touch. Nothing outside this registry
// can ever reach SQL, which is what makes the generic query endpoint safe.

export type TableName =
  | "profiles"
  | "public_profiles"
  | "user_roles"
  | "tracks"
  | "artist_videos"
  | "feed_posts"
  | "workshops"
  | "sponsors"
  | "site_content"
  | "studio_services"
  | "studio_tags"
  | "gym_cours"
  | "gym_inscriptions"
  | "gym_presences";

export type TableMeta = {
  /** Columns a client may select from this table. */
  columns: readonly string[];
  /** Columns returned to anonymous visitors (subset of `columns`). */
  publicColumns: readonly string[];
  /** Column targeted by `on conflict (...)` when upserting. */
  conflictTarget: string;
  /** Whether rows of this table may ever be inserted. */
  insertable: boolean;
};

const PROFILE_COLUMNS = [
  "id",
  "artist_name",
  "slug",
  "genre",
  "city",
  "bio",
  "avatar_url",
  "cover_url",
  "accent_color",
  "youtube",
  "spotify",
  "facebook",
  "instagram",
  "tiktok",
  "twitter",
  "status",
  "created_at",
] as const;

export const TABLES: Record<TableName, TableMeta> = {
  profiles: {
    columns: [...PROFILE_COLUMNS, "email", "phone", "updated_at"],
    publicColumns: PROFILE_COLUMNS,
    conflictTarget: "id",
    insertable: false,
  },
  public_profiles: {
    columns: PROFILE_COLUMNS,
    publicColumns: PROFILE_COLUMNS,
    conflictTarget: "id",
    insertable: false,
  },
  user_roles: {
    columns: ["id", "user_id", "role", "created_at"],
    publicColumns: [],
    conflictTarget: "user_id",
    insertable: true,
  },
  tracks: {
    columns: [
      "id",
      "user_id",
      "title",
      "genre",
      "audio_url",
      "cover_url",
      "status",
      "created_at",
      "updated_at",
    ],
    publicColumns: [
      "id",
      "user_id",
      "title",
      "genre",
      "audio_url",
      "cover_url",
      "status",
      "created_at",
    ],
    conflictTarget: "id",
    insertable: true,
  },
  artist_videos: {
    columns: ["id", "user_id", "title", "youtube_url", "created_at", "updated_at"],
    publicColumns: ["id", "user_id", "title", "youtube_url", "created_at"],
    conflictTarget: "id",
    insertable: true,
  },
  feed_posts: {
    columns: ["id", "user_id", "image_url", "caption", "status", "created_at", "updated_at"],
    // status is deliberately absent from publicColumns: anonymous visitors must
    // never be able to see or filter on the moderation state.
    publicColumns: ["id", "user_id", "image_url", "caption", "created_at"],
    conflictTarget: "id",
    insertable: true,
  },
  workshops: {
    columns: [
      "id",
      "name",
      "category",
      "description",
      "image_url",
      "month",
      "day",
      "place",
      "time",
      "sort_order",
      "is_finished",
      "created_at",
      "updated_at",
    ],
    publicColumns: [
      "id",
      "name",
      "category",
      "description",
      "image_url",
      "month",
      "day",
      "place",
      "time",
      "sort_order",
      "is_finished",
      "created_at",
    ],
    conflictTarget: "id",
    insertable: true,
  },
  sponsors: {
    columns: ["id", "name", "image_url", "link_url", "sort_order", "created_at", "updated_at"],
    publicColumns: ["id", "name", "image_url", "link_url", "sort_order", "created_at"],
    conflictTarget: "id",
    insertable: true,
  },
  site_content: {
    columns: ["key", "value", "created_at", "updated_at"],
    publicColumns: ["key", "value"],
    conflictTarget: "key",
    insertable: true,
  },
  studio_services: {
    columns: ["id", "title", "description", "icon", "sort_order", "created_at", "updated_at"],
    publicColumns: ["id", "title", "description", "icon", "sort_order", "created_at"],
    conflictTarget: "id",
    insertable: true,
  },
  studio_tags: {
    columns: ["id", "label", "sort_order", "created_at", "updated_at"],
    publicColumns: ["id", "label", "sort_order", "created_at"],
    conflictTarget: "id",
    insertable: true,
  },
  gym_cours: {
    columns: [
      "id",
      "nom",
      "pub",
      "duree_mois",
      "tarif",
      "couleur",
      "sort_order",
      "created_at",
      "updated_at",
    ],
    publicColumns: [],
    conflictTarget: "id",
    insertable: true,
  },
  gym_inscriptions: {
    columns: [
      "id",
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
      "med_groupe_sanguin",
      "med_autorisation_sport",
      "med_maladies",
      "med_allergies",
      "med_medicaments",
      "med_urgence_nom",
      "med_urgence_tel",
      "med_remarques",
      "promo_code",
      "promo_type",
      "promo_valeur",
      "nb_renouvellements",
      "historique",
      "abonnement_suspendu",
      "abonnement_arrete",
      "ne_pas_renouveler",
      "suspension_motif",
      "suspension_date",
      "suspension_note",
      "arret_motif",
      "arret_date",
      "arret_note",
      "created_at",
      "updated_at",
    ],
    publicColumns: [],
    conflictTarget: "id",
    insertable: true,
  },
  gym_presences: {
    columns: ["id", "pres_date", "session", "inscription_id", "statut", "created_at", "updated_at"],
    publicColumns: [],
    conflictTarget: "id",
    insertable: true,
  },
};

export function isTableName(value: string): value is TableName {
  return Object.prototype.hasOwnProperty.call(TABLES, value);
}

export type RequestedColumns = { isWildcard: boolean; columns: string[] };

// Validates the requested projection against the table whitelist. Whether the
// caller may actually see those columns is decided later by the policy layer.
export function parseRequestedColumns(meta: TableMeta, requested: string): RequestedColumns {
  const trimmed = requested.trim();
  if (trimmed === "" || trimmed === "*") return { isWildcard: true, columns: [...meta.columns] };

  const columns = trimmed
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);

  for (const column of columns) {
    if (!meta.columns.includes(column)) {
      throw new QueryInputError(`Unknown column "${column}" on this table.`);
    }
  }

  return { isWildcard: false, columns };
}

export function assertKnownTable(table: string): TableName {
  if (!isTableName(table)) throw new QueryInputError(`Unknown table "${table}".`);
  return table;
}

export class QueryInputError extends Error {}
