import type { TableName } from "../db/tables.server";

// Every read and write that reaches SQL passes through this module. Policies
// are expressed as SQL fragments bound through `param`, so they cannot be
// bypassed by anything the client sends.

export type Action = "select" | "insert" | "update" | "delete" | "upsert";

export type Actor = { id: string; email: string; isAdmin: boolean } | null;

export type ParamBinder = (value: unknown) => string;

export type AuthorizeInput = {
  table: TableName;
  action: Action;
  actor: Actor;
  payload: Record<string, unknown> | null;
  requestedColumns: string[] | null;
  param: ParamBinder;
};

export type AccessDecision =
  | { allowed: false; message: string }
  | {
      allowed: true;
      /** SQL predicate to AND into the WHERE clause, or null for "all rows". */
      filter: string | null;
      /** Columns the caller may read or write. */
      columns: string[];
      /** Columns replaced by a SQL expression, used to hide other people's data. */
      maskedColumns: Record<string, string>;
      /** Values the server sets itself and the client cannot override. */
      forcedValues: Record<string, unknown>;
      /** Predicate that narrows a read to the caller's own row. */
      selfScope: string | null;
    };

const DENIED = (message: string): AccessDecision => ({ allowed: false, message });

export class QueryDeniedError extends Error {}

const PROFILE_FIELDS = [
  "artist_name",
  "slug",
  "genre",
  "city",
  "bio",
  "phone",
  "avatar_url",
  "cover_url",
  "accent_color",
  "youtube",
  "spotify",
  "facebook",
  "instagram",
  "tiktok",
  "twitter",
];

const PRIVATE_PROFILE_COLUMNS = ["email", "phone", "updated_at"];

const CONTENT_TABLES: TableName[] = [
  "workshops",
  "sponsors",
  "site_content",
  "studio_services",
  "studio_tags",
];

const PUBLIC_PROFILE_COLUMNS = [
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
];

export function authorize(input: AuthorizeInput): AccessDecision {
  const { table, action, actor, param } = input;

  if (table === "public_profiles") {
    return action === "select"
      ? allowed({ columns: PUBLIC_PROFILE_COLUMNS })
      : DENIED("The public profile view is read-only.");
  }

  if (CONTENT_TABLES.includes(table)) {
    if (action === "select") return allowed({ columns: null });
    return actor?.isAdmin ? allowed({ columns: null }) : DENIED("Admin access required.");
  }

  switch (table) {
    case "profiles":
      return profilePolicy(input, actor, param);
    case "user_roles":
      return rolesPolicy(action, actor, param);
    case "tracks":
      return trackPolicy(action, actor, param);
    case "artist_videos":
      return videoPolicy(action, actor, param);
    default:
      return DENIED("This table is not available.");
  }
}

function allowed(overrides: {
  columns: string[] | null;
  filter?: string | null;
  maskedColumns?: Record<string, string>;
  forcedValues?: Record<string, unknown>;
  selfScope?: string | null;
}): AccessDecision {
  return {
    allowed: true,
    filter: overrides.filter ?? null,
    columns: overrides.columns ?? [],
    maskedColumns: overrides.maskedColumns ?? {},
    forcedValues: overrides.forcedValues ?? {},
    selfScope: overrides.selfScope ?? null,
  };
}

function profilePolicy(input: AuthorizeInput, actor: Actor, param: ParamBinder): AccessDecision {
  const { action, param: bind } = input;

  if (action === "select") {
    if (actor?.isAdmin) return allowed({ columns: null });
    if (!actor) return allowed({ columns: null, filter: "status = 'approved'" });

    // A signed-in artist sees their own row in full and everyone else's public
    // row only — the private columns are blanked out for the other rows.
    const self = bind(actor.id);
    const masked: Record<string, string> = {};
    for (const column of PRIVATE_PROFILE_COLUMNS) {
      masked[column] = `case when id = ${self} then ${column} else null end`;
    }
    return allowed({
      columns: null,
      filter: `(id = ${self} or status = 'approved')`,
      maskedColumns: masked,
      selfScope: `id = ${self}`,
    });
  }

  if (action === "update") {
    if (actor?.isAdmin) return allowed({ columns: null });
    if (!actor) return DENIED("Sign in to update a profile.");
    return allowed({ columns: PROFILE_FIELDS, filter: `id = ${bind(actor.id)}` });
  }

  if (action === "delete") {
    return actor?.isAdmin ? allowed({ columns: null }) : DENIED("Admin access required.");
  }

  return DENIED("Profiles cannot be created through this endpoint.");
}

function rolesPolicy(action: Action, actor: Actor, param: ParamBinder): AccessDecision {
  if (actor?.isAdmin) return allowed({ columns: null });
  if (!actor) return DENIED("Sign in to read roles.");
  if (action !== "select") return DENIED("Admin access required.");
  return allowed({ columns: null, filter: `user_id = ${param(actor.id)}` });
}

function trackPolicy(action: Action, actor: Actor, param: ParamBinder): AccessDecision {
  if (action === "select") {
    if (actor?.isAdmin) return allowed({ columns: null });
    if (!actor) return allowed({ columns: null, filter: "status = 'approved'" });
    return allowed({
      columns: null,
      filter: `(user_id = ${param(actor.id)} or status = 'approved')`,
    });
  }

  if (action === "insert") {
    if (!actor) return DENIED("Sign in to upload music.");
    return allowed({
      columns: ["title", "genre", "audio_url", "cover_url"],
      forcedValues: { user_id: actor.id, status: "approved" },
    });
  }

  if (action === "update") {
    if (actor?.isAdmin) return allowed({ columns: null });
    if (!actor) return DENIED("Sign in to update a track.");
    return allowed({
      columns: ["title", "genre", "audio_url", "cover_url"],
      filter: `user_id = ${param(actor.id)}`,
    });
  }

  if (action === "delete") {
    if (actor?.isAdmin) return allowed({ columns: null });
    if (!actor) return DENIED("Sign in to delete a track.");
    return allowed({ columns: null, filter: `user_id = ${param(actor.id)}` });
  }

  return DENIED("Tracks cannot be upserted.");
}

function videoPolicy(action: Action, actor: Actor, param: ParamBinder): AccessDecision {
  const publicArtist = "user_id in (select id from public_profiles)";

  if (action === "select") {
    if (actor?.isAdmin) return allowed({ columns: null });
    if (!actor) return allowed({ columns: null, filter: publicArtist });
    return allowed({
      columns: null,
      filter: `(user_id = ${param(actor.id)} or ${publicArtist})`,
    });
  }

  if (action === "insert") {
    if (!actor) return DENIED("Sign in to add a clip.");
    return allowed({
      columns: ["title", "youtube_url"],
      forcedValues: { user_id: actor.id },
    });
  }

  if (action === "update") {
    if (actor?.isAdmin) return allowed({ columns: null });
    if (!actor) return DENIED("Sign in to update a clip.");
    return allowed({
      columns: ["title", "youtube_url"],
      filter: `user_id = ${param(actor.id)}`,
    });
  }

  if (action === "delete") {
    if (actor?.isAdmin) return allowed({ columns: null });
    if (!actor) return DENIED("Sign in to delete a clip.");
    return allowed({ columns: null, filter: `user_id = ${param(actor.id)}` });
  }

  return DENIED("Clips cannot be upserted.");
}
