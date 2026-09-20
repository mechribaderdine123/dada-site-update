import path from "node:path";

import { getEnv } from "../env.server";

// Upload folders on the server disk. Private buckets can only be read through
// a signed URL; the public bucket is served to anyone.

export type BucketName = "music" | "avatars" | "covers" | "site-images";

export type Bucket = {
  name: BucketName;
  /** Relative folder under UPLOAD_DIR. */
  folder: string;
  isPublic: boolean;
  /** Accepted file extensions mapped to the content type served back. */
  contentTypes: Record<string, string>;
};

const AUDIO_TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};

const IMAGE_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

export const BUCKETS: Record<BucketName, Bucket> = {
  music: { name: "music", folder: "music", isPublic: false, contentTypes: AUDIO_TYPES },
  avatars: { name: "avatars", folder: "avatars", isPublic: false, contentTypes: IMAGE_TYPES },
  covers: { name: "covers", folder: "covers", isPublic: false, contentTypes: IMAGE_TYPES },
  "site-images": {
    name: "site-images",
    folder: "site-images",
    isPublic: true,
    contentTypes: IMAGE_TYPES,
  },
};

export const BUCKET_ORDER: BucketName[] = ["music", "avatars", "covers", "site-images"];

export function isBucketName(value: string): value is BucketName {
  return Object.prototype.hasOwnProperty.call(BUCKETS, value);
}

export function getBucket(name: BucketName): Bucket {
  return BUCKETS[name];
}

export class StorageError extends Error {}

const FORBIDDEN_SEGMENTS = new Set(["", ".", ".."]);

/** Normalises an object path and refuses anything that could escape the bucket. */
export function normaliseObjectPath(input: string): string {
  if (typeof input !== "string") throw new StorageError("Invalid file path.");
  const raw = input.trim().replace(/^\/+/, "");
  if (!raw || raw.length > 400) throw new StorageError("Invalid file path.");
  if (raw.includes("\0") || raw.includes("\\")) throw new StorageError("Invalid file path.");

  const segments = raw.split("/");
  for (const segment of segments) {
    if (FORBIDDEN_SEGMENTS.has(segment)) throw new StorageError("Invalid file path.");
  }

  const normalised = segments.join("/");
  if (normalised.includes("..")) throw new StorageError("Invalid file path.");
  return normalised;
}

/** Absolute path of an object inside its bucket, guaranteed to stay inside. */
export function absoluteObjectPath(bucket: Bucket, objectPath: string): string {
  const root = path.resolve(getEnv().uploadDir, bucket.folder);
  const candidate = path.resolve(root, normaliseObjectPath(objectPath));
  if (candidate !== root && !candidate.startsWith(root + path.sep)) {
    throw new StorageError("Invalid file path.");
  }
  return candidate;
}

export function bucketRoot(bucket: Bucket): string {
  return path.resolve(getEnv().uploadDir, bucket.folder);
}

export function extensionOf(objectPath: string): string {
  const extension = path.extname(objectPath).toLowerCase();
  return extension;
}

export function contentTypeFor(bucket: Bucket, objectPath: string): string | null {
  return bucket.contentTypes[extensionOf(objectPath)] ?? null;
}

export function mediaUrl(bucket: BucketName, objectPath: string): string {
  const encoded = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/media/${bucket}/${encoded}`;
}
