import { Readable } from "node:stream";

import { BUCKETS, isBucketName, mediaUrl } from "../../storage/buckets.server";
import { assetStream, findAssetInBucket, parseRange } from "../../storage/files.server";
import { verifyMediaSignature } from "../../storage/signature.server";

// /media/:bucket/*path — serves uploaded files. Private buckets require a
// valid, unexpired signature produced by /api/storage/sign.

const PUBLIC_CACHE = "public, max-age=604800, immutable";
const PRIVATE_CACHE = "private, max-age=3600";

export async function handleMediaRoute(
  request: Request,
  segments: string[],
): Promise<Response | null> {
  if (segments[0] !== "media") return null;
  if (request.method !== "GET") return new Response("Method not allowed.", { status: 405 });

  const bucketName = segments[1] ?? "";
  if (!isBucketName(bucketName)) return new Response("Not found.", { status: 404 });

  const objectPath = segments
    .slice(2)
    .map((segment) => decodeURIComponent(segment))
    .join("/");
  if (!objectPath) return new Response("Not found.", { status: 404 });

  const bucket = BUCKETS[bucketName];

  if (!bucket.isPublic) {
    const url = new URL(request.url);
    const expires = Number(url.searchParams.get("expires") ?? "0");
    const signature = url.searchParams.get("signature") ?? "";
    if (!verifyMediaSignature(bucketName, objectPath, expires, signature)) {
      return new Response("This link is invalid or has expired.", { status: 403 });
    }
  }

  const asset = await findAssetInBucket(bucket, objectPath);
  if (!asset) return new Response("Not found.", { status: 404 });

  const headers = new Headers({
    "content-type": asset.contentType,
    "cache-control": bucket.isPublic ? PUBLIC_CACHE : PRIVATE_CACHE,
    "accept-ranges": "bytes",
    etag: `"${asset.size}-${asset.modifiedAt.getTime()}"`,
  });

  const range = parseRange(request.headers.get("range"), asset.size);
  if (range) {
    headers.set("content-range", `bytes ${range.start}-${range.end}/${asset.size}`);
    headers.set("content-length", String(range.end - range.start + 1));
    return new Response(readableToWeb(assetStream(asset, range)), { status: 206, headers });
  }

  headers.set("content-length", String(asset.size));
  return new Response(readableToWeb(assetStream(asset)), { status: 200, headers });
}

export function publicMediaUrl(bucket: string, objectPath: string): string {
  return isBucketName(bucket) ? mediaUrl(bucket, objectPath) : objectPath;
}

function readableToWeb(stream: ReturnType<typeof assetStream>): ReadableStream {
  return Readable.toWeb(stream) as unknown as ReadableStream;
}
