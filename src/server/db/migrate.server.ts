import initSql from "./sql/001_init.sql?raw";
import publishTracksSql from "./sql/002_publish_tracks.sql?raw";
import feedPostsSql from "./sql/003_feed_posts.sql?raw";
import gymSql from "./sql/004_gym.sql?raw";
import moderationSql from "./sql/005_moderation.sql?raw";
import { getPool, query } from "./pool.server";

// Migrations are inlined at build time via `?raw`, so the production image
// needs no .sql files on disk. They are applied in order and recorded in
// schema_migrations; each one runs inside its own transaction.

type Migration = { id: string; sql: string };

const MIGRATIONS: Migration[] = [
  { id: "001_init", sql: initSql },
  { id: "002_publish_tracks", sql: publishTracksSql },
  { id: "003_feed_posts", sql: feedPostsSql },
  { id: "004_gym", sql: gymSql },
  { id: "005_moderation", sql: moderationSql },
];

let migrationRun: Promise<void> | undefined;

export function ensureMigrated(): Promise<void> {
  if (!migrationRun) {
    migrationRun = applyMigrations().catch((error) => {
      migrationRun = undefined; // allow a retry once the database is reachable
      throw error;
    });
  }
  return migrationRun;
}

async function applyMigrations(): Promise<void> {
  await query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const applied = await query<{ id: string }>("select id from schema_migrations");
  const done = new Set(applied.map((row) => row.id));

  for (const migration of MIGRATIONS) {
    if (done.has(migration.id)) continue;

    const client = await getPool().connect();
    try {
      await client.query("begin");
      await client.query(migration.sql);
      await client.query("insert into schema_migrations (id) values ($1)", [migration.id]);
      await client.query("commit");
      console.log(`[db] applied migration ${migration.id}`);
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw new Error(
        `Migration ${migration.id} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      client.release();
    }
  }
}
