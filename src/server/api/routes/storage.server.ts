import { ForbiddenError, requireActor, resolveCaller } from "../../auth/identity.server";
import { findAsset, removeAssetPaths, saveUpload, sizeLimitFor } from "../../storage/files.server";
import { BUCKETS, StorageError, isBucketName, mediaUrl } from "../../storage/buckets.server";
import { signedMediaUrl } from "../../storage/signature.server";
import { failure, json, methodNotAllowed, readJson } from "../http.server";

// /api/storage/* — uploads, deletions and signed read URLs for the server
// upload folders (music, avatars, covers, site-images).

const MAX_REMOVALS = 200;

export async function handleStorageRoute(
  request: Request,
  segments: string[],
): Promise<Response | null> {
  if (segments[0] !== "storage") return null;

  switch (segments[1] ?? "") {
    case "upload":
      return upload(request);
    case "remove":
      return remove(request);
    case "sign":
      return sign(request);
    default:
      return failure(404, "Unknown storage endpoint.");
  }
}

async function upload(request: Request): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  const actor = await requireActor(request);
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > 90 * 1024 * 1024) {
    return failure(413, "That file is too large.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new StorageError("The upload could not be read.");
  }

  const bucketName = String(form.get("bucket") ?? "");
  if (!isBucketName(bucketName)) return failure(400, "Unknown upload folder.");
  const bucket = BUCKETS[bucketName];

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return failure(400, "No file was uploaded.");

  const objectPath = String(form.get("path") ?? "");
  assertUploadAllowed(bucketName, objectPath, actor.id, actor.isAdmin);

  const limit = sizeLimitFor(bucket);
  if (file.size > limit) {
    return failure(413, `File is too large. Maximum ${Math.round(limit / (1024 * 1024))} MB.`);
  }

  const saved = await saveUpload(bucket, objectPath, file);
  return json({ data: { path: saved.path, bucket: bucketName }, error: null });
}

/** Artists may only write inside their own folder; admins may write anywhere. */
function assertUploadAllowed(
  bucketName: string,
  objectPath: string,
  actorId: string,
  isAdmin: boolean,
): void {
  if (bucketName === "site-images" && !isAdmin) {
    throw new ForbiddenError("Only administrators can change site images.");
  }
  if (isAdmin) return;

  const owner = objectPath.split("/")[0];
  if (owner !== actorId) {
    throw new ForbiddenError("You can only upload files into your own folder.");
  }
}

async function remove(request: Request): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  const actor = await requireActor(request);

  const body = await readJson(request);
  const input = Array.isArray(body.paths) ? body.paths : [];
  if (input.length === 0) return json({ data: [], error: null });
  if (input.length > MAX_REMOVALS) return failure(400, "Too many files in one request.");

  const paths: string[] = [];
  for (const entry of input) {
    const candidate = String(entry ?? "");
    if (!candidate) continue;
    // Only the owner (or an admin) may delete a file.
    if (!actor.isAdmin && candidate.split("/")[0] !== actor.id) continue;
    paths.push(candidate);
  }

  const removed = await removeAssetPaths(paths);
  return json({ data: removed, error: null });
}

async function sign(request: Request): Promise<Response> {
  if (request.method !== "GET") return methodNotAllowed(["GET"]);

  const url = new URL(request.url);
  const objectPath = url.searchParams.get("path") ?? "";
  if (!objectPath) return failure(400, "A file path is required.");

  const expires = Number(url.searchParams.get("expires") ?? "3600");
  const asset = await findAsset(objectPath);
  if (!asset) return failure(404, "File not found.");

  const url2 = BUCKETS[asset.bucket].isPublic
    ? mediaUrl(asset.bucket, asset.objectPath)
    : signedMediaUrl(asset.bucket, asset.objectPath, expires);

  return json({ data: { signedUrl: url2, bucket: asset.bucket }, error: null });
}
