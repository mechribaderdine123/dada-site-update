import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { getEnv } from "../env.server";
import {
  BUCKET_ORDER,
  BUCKETS,
  StorageError,
  absoluteObjectPath,
  bucketRoot,
  contentTypeFor,
  normaliseObjectPath,
  type Bucket,
  type BucketName,
} from "./buckets.server";

// All disk access for uploads lives here: writing, deleting, locating and
// streaming files. Nothing outside this module touches UPLOAD_DIR.

export type StoredAsset = {
  bucket: BucketName;
  objectPath: string;
  absolutePath: string;
  contentType: string;
  size: number;
  modifiedAt: Date;
};

export function sizeLimitFor(bucket: Bucket): number {
  const env = getEnv();
  return bucket.name === "music" ? env.maxAudioBytes : env.maxImageBytes;
}

export async function ensureBucketFolders(): Promise<void> {
  await Promise.all(
    BUCKET_ORDER.map((name) => mkdir(bucketRoot(BUCKETS[name]), { recursive: true })),
  );
}

export async function saveUpload(
  bucket: Bucket,
  objectPath: string,
  file: File,
): Promise<{ path: string; size: number }> {
  const normalised = normaliseObjectPath(objectPath);
  const contentType = contentTypeFor(bucket, normalised);
  if (!contentType) {
    throw new StorageError(
      `Unsupported file type for "${bucket.name}". Allowed: ${Object.keys(bucket.contentTypes).join(", ")}`,
    );
  }

  const limit = sizeLimitFor(bucket);
  if (file.size > limit) {
    throw new StorageError(
      `File is too large. The maximum size for this folder is ${Math.round(limit / (1024 * 1024))} MB.`,
    );
  }

  const absolute = absoluteObjectPath(bucket, normalised);
  await mkdir(path.dirname(absolute), { recursive: true });
  await pipeline(Readable.fromWeb(file.stream() as never), createWriteStream(absolute));

  const written = await stat(absolute);
  if (written.size > limit) {
    await unlink(absolute).catch(() => undefined);
    throw new StorageError("File is too large.");
  }

  return { path: normalised, size: written.size };
}

export async function findAssetInBucket(
  bucket: Bucket,
  objectPath: string,
): Promise<StoredAsset | null> {
  let absolute: string;
  try {
    absolute = absoluteObjectPath(bucket, objectPath);
  } catch {
    return null;
  }

  try {
    const info = await stat(absolute);
    if (!info.isFile()) return null;
    const contentType = contentTypeFor(bucket, objectPath);
    if (!contentType) return null;
    return {
      bucket: bucket.name,
      objectPath,
      absolutePath: absolute,
      contentType,
      size: info.size,
      modifiedAt: info.mtime,
    };
  } catch {
    return null;
  }
}

/**
 * Locates a stored object without knowing which bucket it lives in. Database
 * rows keep only the object path, so the bucket is resolved from disk.
 */
export async function findAsset(objectPath: string): Promise<StoredAsset | null> {
  let normalised: string;
  try {
    normalised = normaliseObjectPath(objectPath);
  } catch {
    return null;
  }

  for (const name of BUCKET_ORDER) {
    const found = await findAssetInBucket(BUCKETS[name], normalised);
    if (found) return found;
  }
  return null;
}

export async function removeAssetPaths(paths: readonly string[]): Promise<string[]> {
  const removed: string[] = [];
  for (const objectPath of paths) {
    const asset = await findAsset(objectPath);
    if (!asset) continue;
    try {
      await unlink(asset.absolutePath);
      removed.push(asset.objectPath);
    } catch {
      // Already gone — nothing to report.
    }
  }
  return removed;
}

export function assetStream(asset: StoredAsset, range?: { start: number; end: number }) {
  return createReadStream(asset.absolutePath, range);
}

/** Parses a single-range `Range` header against a known size. */
export function parseRange(
  header: string | null,
  size: number,
): { start: number; end: number } | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  if (rawStart === "" && rawEnd === "") return null;

  let start: number;
  let end: number;
  if (rawStart === "") {
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" ? size - 1 : Number(rawEnd);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start > end || start >= size) return null;
  return { start, end: Math.min(end, size - 1) };
}
