import { query, queryOne, withTransaction } from "../db/pool.server";
import { getEnv } from "../env.server";
import { slugify } from "./accounts.server";
import { hashPassword } from "./passwords.server";

// Creates the first administrator from the environment. Running with no
// ADMIN_PASSWORD leaves the database untouched and prints how to add one.

let seeded = false;

export async function seedAdminAccount(): Promise<void> {
  if (seeded) return;

  const env = getEnv();
  if (!env.adminEmail || !env.adminPassword) {
    const admins = await query<{ count: string }>(
      "select count(*)::text as count from user_roles where role = 'admin'",
    );
    if (Number(admins[0]?.count ?? "0") === 0) {
      console.warn(
        "[auth] no administrator exists. Set ADMIN_EMAIL and ADMIN_PASSWORD (or run " +
          "`npm run admin:create -- <email> <password>`) and restart the server.",
      );
    }
    seeded = true;
    return;
  }

  const email = env.adminEmail.toLowerCase();
  const existing = await queryOne<{ id: string }>("select id from users where lower(email) = $1", [
    email,
  ]);

  const userId = existing?.id ?? (await createAdminUser(email, env.adminPassword));
  await ensureAdminRole(userId, email);

  seeded = true;
}

async function createAdminUser(email: string, password: string): Promise<string> {
  const passwordHash = await hashPassword(password);
  const name = email.split("@")[0];

  return withTransaction(async (client) => {
    const inserted = await client.query<{ id: string }>(
      "insert into users (email, password_hash) values ($1, $2) returning id",
      [email, passwordHash],
    );
    const id = inserted.rows[0].id;

    await client.query(
      `insert into profiles (id, email, artist_name, slug, genre, accent_color, status)
       values ($1, $2, $3, $4, 'Administration', '#00e5bf', 'approved')
       on conflict (id) do nothing`,
      [id, email, name, await uniqueSlug(client, slugify(name))],
    );

    return id;
  });
}

async function ensureAdminRole(userId: string, email: string): Promise<void> {
  await query(
    `insert into user_roles (user_id, role) values ($1, 'admin')
     on conflict (user_id, role) do nothing`,
    [userId],
  );
  // Staff accounts must never appear in the public artist listing.
  await query("update profiles set status = 'approved' where id = $1", [userId]);
  console.log(`[auth] administrator ready: ${email}`);
}

async function uniqueSlug(
  client: { query: (text: string, params?: unknown[]) => Promise<{ rowCount: number | null }> },
  base: string,
): Promise<string> {
  let slug = base;
  for (let attempt = 2; attempt < 50; attempt += 1) {
    const taken = await client.query("select 1 from profiles where lower(slug) = lower($1)", [slug]);
    if (taken.rowCount === 0) break;
    slug = `${base}-${attempt}`;
  }
  return slug;
}
