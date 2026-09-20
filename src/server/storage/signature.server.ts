import { createHmac, timingSafeEqual } from "node:crypto";

import { getEnv } from "../env.server";
import { mediaUrl, type BucketName } from "./buckets.server";

// Private uploads are only reachable through a signed, expiring URL. The
// signature covers the bucket, the object path and the expiry time.

const DEFAULT_TTL_SECONDS = 3600;
const MAX_TTL_SECONDS = 60 * 60 * 24 * 7;

function computeSignature(bucket: BucketName, objectPath: string, expires: number): string {
  return createHmac("sha256", getEnv().sessionSecret)
    .update(`${bucket}:${objectPath}:${expires}`)
    .digest("base64url");
}

function clampTtl(ttlSeconds: number): number {
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) return DEFAULT_TTL_SECONDS;
  return Math.min(Math.floor(ttlSeconds), MAX_TTL_SECONDS);
}

export function signMediaPath(
  bucket: BucketName,
  objectPath: string,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): { expires: number; signature: string } {
  const expires = Math.floor(Date.now() / 1000) + clampTtl(ttlSeconds);
  return { expires, signature: computeSignature(bucket, objectPath, expires) };
}

export function verifyMediaSignature(
  bucket: BucketName,
  objectPath: string,
  expires: number,
  signature: string,
): boolean {
  if (!Number.isFinite(expires)) return false;
  if (expires * 1000 < Date.now()) return false;

  const expected = computeSignature(bucket, objectPath, expires);
  const provided = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  return provided.length === wanted.length && timingSafeEqual(provided, wanted);
}

export function signedMediaUrl(
  bucket: BucketName,
  objectPath: string,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): string {
  const { expires, signature } = signMediaPath(bucket, objectPath, ttlSeconds);
  return `${mediaUrl(bucket, objectPath)}?expires=${expires}&signature=${signature}`;
}
