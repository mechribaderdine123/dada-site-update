import { supabase } from "@/integrations/supabase/client";

// Extract storage object path from either a stored path or a legacy public URL.
export function extractMusicPath(value: string | null): string | null {
  if (!value) return null;
  const marker = "/object/public/music/";
  const i = value.indexOf(marker);
  if (i > -1) return value.slice(i + marker.length);
  const signedMarker = "/object/sign/music/";
  const j = value.indexOf(signedMarker);
  if (j > -1) return value.slice(j + signedMarker.length).split("?")[0];
  if (/^https?:\/\//i.test(value)) return null;
  return value;
}

const cache = new Map<string, { url: string; exp: number }>();

export async function signedMusicUrl(
  value: string | null,
  expiresIn = 3600,
): Promise<string | null> {
  const path = extractMusicPath(value);
  if (!path) return value; // fallback: return original if we can't parse
  const now = Date.now();
  const hit = cache.get(path);
  if (hit && hit.exp > now + 60_000) return hit.url;
  const { data, error } = await supabase.storage.from("music").createSignedUrl(path, expiresIn);
  if (error || !data) return null;
  cache.set(path, { url: data.signedUrl, exp: now + expiresIn * 1000 });
  return data.signedUrl;
}

export async function signedMusicUrls(values: (string | null)[], expiresIn = 3600) {
  return Promise.all(values.map((v) => signedMusicUrl(v, expiresIn)));
}

// Generic signed URL function for any bucket
export async function signedUrl(
  bucket: string,
  path: string | null,
  expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;
  const cacheKey = `${bucket}:${path}`;
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && hit.exp > now + 60_000) return hit.url;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data) return null;
  cache.set(cacheKey, { url: data.signedUrl, exp: now + expiresIn * 1000 });
  return data.signedUrl;
}
