import { query, queryOne, withTransaction } from "../db/pool.server";
import { removeAssetPaths } from "../storage/files.server";
import { hashPassword, verifyPassword, assertPasswordStrength } from "./passwords.server";
import { createSession } from "./sessions.server";

// Account lifecycle: creating artist accounts, signing in, and (for admins)
// deleting an account together with everything it uploaded.

export type AccountUser = { id: string; email: string };

export type ProfileSeed = {
  artist_name?: string | null;
  genre?: string | null;
  city?: string | null;
  bio?: string | null;
  phone?: string | null;
  youtube?: string | null;
  spotify?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
};

export class AuthError extends Error {}

const RESERVED_SLUGS = new Set(["edit", "music", "my-music", "artist"]);

export function slugify(value: string): string {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = base || "artist";
  return RESERVED_SLUGS.has(slug) ? `${slug}-page` : slug;
}

export async function findAccountByEmail(email: string): Promise<{ id: string } | null> {
  return queryOne<{ id: string }>("select id from users where lower(email) = lower($1)", [email]);
}

export async function signUpArtist(input: {
  email: string;
  password: string;
  profile?: ProfileSeed;
}): Promise<{ user: AccountUser }> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    throw new AuthError("Enter a valid e-mail address.");
  assertPasswordStrength(input.password);

  if (await findAccountByEmail(email)) {
    throw new AuthError("This e-mail is already registered.");
  }

  const passwordHash = await hashPassword(input.password);
  const seed = input.profile ?? {};

  const user = await withTransaction(async (client) => {
    const created = await client.query<{ id: string }>(
      "insert into users (email, password_hash) values ($1, $2) returning id",
      [email, passwordHash],
    );
    const userId = created.rows[0].id;

    const baseSlug = slugify(seed.artist_name || email.split("@")[0]);
    let slug = baseSlug;
    for (let attempt = 2; attempt < 50; attempt += 1) {
      const taken = await client.query("select 1 from profiles where lower(slug) = lower($1)", [
        slug,
      ]);
      if (taken.rowCount === 0) break;
      slug = `${baseSlug}-${attempt}`;
    }

    await client.query(
      `insert into profiles
         (id, email, artist_name, slug, genre, city, bio, phone,
          youtube, spotify, facebook, instagram, tiktok, twitter, status)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending')`,
      [
        userId,
        email,
        (seed.artist_name || email.split("@")[0]).trim(),
        slug,
        seed.genre ?? null,
        seed.city ?? null,
        seed.bio ?? null,
        seed.phone ?? null,
        seed.youtube ?? null,
        seed.spotify ?? null,
        seed.facebook ?? null,
        seed.instagram ?? null,
        seed.tiktok ?? null,
        seed.twitter ?? null,
      ],
    );

    await client.query("insert into user_roles (user_id, role) values ($1, 'artist')", [userId]);
    return { id: userId, email };
  });

  return { user };
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ user: AccountUser; token: string; expiresAt: Date }> {
  const account = await queryOne<{ id: string; email: string; password_hash: string }>(
    "select id, email, password_hash from users where lower(email) = lower($1)",
    [email.trim()],
  );

  // Always run a verification step so a missing account and a wrong password
  // take a comparable amount of time.
  const hash =
    account?.password_hash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
  const valid = await verifyPassword(password, hash);
  if (!account || !valid) throw new AuthError("Invalid login credentials");

  const session = await createSession(account.id);
  return { user: { id: account.id, email: account.email }, ...session };
}

export async function deleteAccount(userId: string): Promise<void> {
  const assets = await query<{ path: string }>(
    `select avatar_url as path from profiles where id = $1 and avatar_url is not null
     union all
     select cover_url from profiles where id = $1 and cover_url is not null
     union all
     select audio_url from tracks where user_id = $1 and audio_url is not null
     union all
     select cover_url from tracks where user_id = $1 and cover_url is not null`,
    [userId],
  );

  const removed = await query("delete from users where id = $1 returning id", [userId]);
  if (removed.length === 0) throw new AuthError("This account no longer exists.");

  await removeAssetPaths(assets.map((row) => row.path));
}
