#!/usr/bin/env node
// Creates or promotes an administrator account.
//
//   node scripts/create-admin.mjs admin@dadahiphop.com "a-long-password"
//
// Reads DATABASE_URL from the environment, or from .env when present.

import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import bcrypt from "bcryptjs";
import pg from "pg";

const COST = 12;

function loadEnvFile() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  try {
    const content = readFileSync(path.join(root, ".env"), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  } catch {
    // No .env file: rely on the real environment.
  }
}

function slugify(value) {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "admin";
}

async function main() {
  loadEnvFile();

  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.mjs <email> <password> ["Admin name"]');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("The password must be at least 8 characters long.");
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set (checked the environment and .env).");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    const normalisedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, COST);
    const displayName = (name || normalisedEmail.split("@")[0]).trim();

    const existing = await client.query("select id from users where lower(email) = $1", [
      normalisedEmail,
    ]);

    let userId;
    if (existing.rowCount > 0) {
      userId = existing.rows[0].id;
      await client.query("update users set password_hash = $2, updated_at = now() where id = $1", [
        userId,
        passwordHash,
      ]);
      console.log(`Updated the password of ${normalisedEmail}.`);
    } else {
      const inserted = await client.query(
        "insert into users (email, password_hash) values ($1, $2) returning id",
        [normalisedEmail, passwordHash],
      );
      userId = inserted.rows[0].id;
      console.log(`Created the account ${normalisedEmail}.`);
    }

    let slug = slugify(displayName);
    for (let attempt = 2; attempt < 50; attempt += 1) {
      const taken = await client.query(
        "select 1 from profiles where lower(slug) = lower($1) and id <> $2",
        [slug, userId],
      );
      if (taken.rowCount === 0) break;
      slug = `${slugify(displayName)}-${attempt}`;
    }

    await client.query(
      `insert into profiles (id, email, artist_name, slug, genre, accent_color, status)
       values ($1, $2, $3, $4, 'Administration', '#00e5bf', 'approved')
       on conflict (id) do update
         set artist_name = excluded.artist_name,
             status = 'approved'`,
      [userId, normalisedEmail, displayName, slug],
    );

    await client.query(
      `insert into user_roles (user_id, role) values ($1, 'admin')
       on conflict (user_id, role) do nothing`,
      [userId],
    );

    console.log("This account is now an administrator and can sign in at /admin/sign-in.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
