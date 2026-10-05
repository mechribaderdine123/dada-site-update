// One-off maintenance script: re-encode the already-uploaded site images as
// WebP and repoint every site_content row that uses them. Originals are copied
// into UPLOAD_DIR/_backup/site-images/ before anything is replaced, so the
// change can be undone by hand.
//
//   docker exec dada-app node scripts/optimize-site-images.mjs [--dry-run]

import { copyFile, mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import pg from "pg";
import sharp from "sharp";

const MAX_EDGE = 1920;
const LOGO_MAX_EDGE = 480;
const WEBP_QUALITY = 78;
const WEBP_EFFORT = 5;

/** Logos sit in small marquee tiles and never need a huge render. */
function maxEdgeFor(objectPath) {
  return objectPath.startsWith("sponsors/") ? LOGO_MAX_EDGE : MAX_EDGE;
}

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/data/uploads";
const BUCKET_FOLDER = path.join(UPLOAD_DIR, "site-images");
const BACKUP_DIR = path.join(UPLOAD_DIR, "_backup", "site-images");
const DRY_RUN = process.argv.includes("--dry-run");

/** Columns across the database that point at a file in the site-images bucket. */
const SOURCES = [
  { table: "site_content", column: "value", idColumn: "key" },
  { table: "sponsors", column: "image_url", idColumn: "id" },
];

async function main() {
  await mkdir(BACKUP_DIR, { recursive: true });

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const rows = [];
    for (const source of SOURCES) {
      const { rows: found } = await client.query(
        `select ${source.idColumn} as id, ${source.column} as url from ${source.table} where ${source.column} like '/media/site-images/%' order by ${source.idColumn}`,
      );
      for (const row of found) rows.push({ ...row, source });
    }

    const changed = [];
    for (const row of rows) {
      const objectPath = row.url.slice("/media/site-images/".length);
      const absolute = path.join(BUCKET_FOLDER, objectPath);
      if (!absolute.startsWith(BUCKET_FOLDER + path.sep)) {
        console.log(`SKIP  ${row.source.table}#${row.id}: path escapes the bucket`);
        continue;
      }

      let original;
      try {
        original = await readFile(absolute);
      } catch {
        console.log(`SKIP  ${row.source.table}#${row.id}: ${objectPath} is missing on disk`);
        continue;
      }

      const extension = path.extname(objectPath).toLowerCase();
      if (![".jpg", ".jpeg", ".png", ".webp"].includes(extension)) {
        console.log(
          `KEEP  ${row.source.table}#${row.id}: ${objectPath} is not a compressible photo`,
        );
        continue;
      }

      const optimised = await sharp(original, { failOn: "none" })
        .rotate()
        .resize({
          width: maxEdgeFor(objectPath),
          height: maxEdgeFor(objectPath),
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
        .toBuffer();

      if (optimised.length >= original.length) {
        console.log(`KEEP  ${row.source.table}#${row.id}: already optimal (${original.length} B)`);
        continue;
      }

      // A file that is already WebP gets a fresh name, because /media is served
      // with immutable caching: overwriting the same URL would leave visitors
      // on the old, heavier copy for a week.
      // Re-encoding a WebP a second time costs real quality on text-heavy
      // graphics, so only the logos get a second pass.
      if (extension === ".webp" && !objectPath.startsWith("sponsors/")) {
        console.log(
          `KEEP  ${row.source.table}#${row.id}: already compressed (${original.length} B)`,
        );
        continue;
      }

      const base = objectPath.slice(0, -extension.length);
      const nextPath = extension === ".webp" ? `${base}.min.webp` : `${base}.webp`;
      const saved = ((original.length - optimised.length) / original.length) * 100;
      console.log(
        `OK    ${row.source.table}#${row.id}: ${objectPath} (${original.length} B) -> ${nextPath} (${optimised.length} B, -${saved.toFixed(1)}%)`,
      );

      if (DRY_RUN) continue;

      const backupAbsolute = path.join(BACKUP_DIR, objectPath);
      await mkdir(path.dirname(backupAbsolute), { recursive: true });
      await copyFile(absolute, backupAbsolute);
      await writeFile(path.join(BUCKET_FOLDER, nextPath), optimised);
      await client.query(
        `update ${row.source.table} set ${row.source.column} = $2 where ${row.source.idColumn} = $1`,
        [row.id, `/media/site-images/${nextPath}`],
      );
      if (nextPath !== objectPath) await unlink(absolute).catch(() => undefined);
      changed.push(`${row.source.table}#${row.id}: ${objectPath} -> ${nextPath}`);
    }

    if (!DRY_RUN && changed.length) {
      console.log(`\n${changed.length} row(s) updated. Backups: ${BACKUP_DIR}`);
    }
  } finally {
    await client.end();
  }

  // Report what is left on disk so stray files are noticed.
  for (const file of await readdir(BUCKET_FOLDER, { recursive: true })) {
    if (typeof file !== "string") continue;
    const info = await stat(path.join(BUCKET_FOLDER, file)).catch(() => null);
    if (info?.isFile()) console.log(`on disk: ${file} (${info.size} B)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
