import { useEffect, useState } from "react";

export type Track = {
  id: string;
  title: string;
  genre: string;
  cover?: string;       // legacy: data URL or http URL
  coverKey?: string;    // IndexedDB blob key
  audioUrl?: string;    // legacy: data URL or http URL
  audioKey?: string;    // IndexedDB blob key
  albumId?: string | null;
  createdAt: number;
};

export type Album = {
  id: string;
  title: string;
  year: string;
  cover?: string;
  coverKey?: string;
  createdAt: number;
};

const TRACKS_KEY = "dada.tracks";
const ALBUMS_KEY = "dada.albums";

/* ---------------- IndexedDB blob store ---------------- */

const DB_NAME = "dada-media";
const STORE = "blobs";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPut(blob: Blob): Promise<string> {
  const key = crypto.randomUUID();
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return key;
}

export async function idbGet(key: string): Promise<Blob | undefined> {
  const db = await openDb();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob;
}

export async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/** Hook: resolve an IDB blob key to an object URL (or pass-through fallback). */
export function useBlobUrl(key?: string, fallback?: string): string | undefined {
  const [url, setUrl] = useState<string | undefined>(fallback);
  useEffect(() => {
    if (!key) {
      setUrl(fallback);
      return;
    }
    let revoke: string | null = null;
    let cancelled = false;
    idbGet(key)
      .then((b) => {
        if (cancelled || !b) {
          if (!cancelled) setUrl(fallback);
          return;
        }
        const u = URL.createObjectURL(b);
        revoke = u;
        setUrl(u);
      })
      .catch(() => !cancelled && setUrl(fallback));
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [key, fallback]);
  return url;
}

/* ---------------- localStorage metadata ---------------- */

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // If we hit quota (legacy data URLs), purge bulky inline fields and retry.
    const slim = (value as unknown as Array<Record<string, unknown>>).map((row) => {
      const r = { ...row };
      if (typeof r.audioUrl === "string" && r.audioUrl.startsWith("data:")) delete r.audioUrl;
      if (typeof r.cover === "string" && r.cover.startsWith("data:")) delete r.cover;
      return r;
    });
    try {
      localStorage.setItem(key, JSON.stringify(slim));
    } catch {
      throw e;
    }
  }
  window.dispatchEvent(new CustomEvent("dada-store-update", { detail: key }));
}

export function useTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  useEffect(() => {
    setTracks(read<Track>(TRACKS_KEY));
    const onUpdate = (e: Event) => {
      if ((e as CustomEvent).detail === TRACKS_KEY) setTracks(read<Track>(TRACKS_KEY));
    };
    window.addEventListener("dada-store-update", onUpdate);
    return () => window.removeEventListener("dada-store-update", onUpdate);
  }, []);
  return tracks;
}

export function useAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  useEffect(() => {
    setAlbums(read<Album>(ALBUMS_KEY));
    const onUpdate = (e: Event) => {
      if ((e as CustomEvent).detail === ALBUMS_KEY) setAlbums(read<Album>(ALBUMS_KEY));
    };
    window.addEventListener("dada-store-update", onUpdate);
    return () => window.removeEventListener("dada-store-update", onUpdate);
  }, []);
  return albums;
}

export const tracksApi = {
  add(t: Omit<Track, "id" | "createdAt">) {
    const list = read<Track>(TRACKS_KEY);
    list.unshift({ ...t, id: crypto.randomUUID(), createdAt: Date.now() });
    write(TRACKS_KEY, list);
  },
  update(id: string, patch: Partial<Track>) {
    const list = read<Track>(TRACKS_KEY).map((t) => (t.id === id ? { ...t, ...patch } : t));
    write(TRACKS_KEY, list);
  },
  async remove(id: string) {
    const list = read<Track>(TRACKS_KEY);
    const t = list.find((x) => x.id === id);
    if (t?.audioKey) await idbDelete(t.audioKey).catch(() => {});
    if (t?.coverKey) await idbDelete(t.coverKey).catch(() => {});
    write(TRACKS_KEY, list.filter((x) => x.id !== id));
  },
};

export const albumsApi = {
  add(a: Omit<Album, "id" | "createdAt">) {
    const list = read<Album>(ALBUMS_KEY);
    list.unshift({ ...a, id: crypto.randomUUID(), createdAt: Date.now() });
    write(ALBUMS_KEY, list);
  },
  update(id: string, patch: Partial<Album>) {
    const list = read<Album>(ALBUMS_KEY).map((a) => (a.id === id ? { ...a, ...patch } : a));
    write(ALBUMS_KEY, list);
  },
  async remove(id: string) {
    const list = read<Album>(ALBUMS_KEY);
    const a = list.find((x) => x.id === id);
    if (a?.coverKey) await idbDelete(a.coverKey).catch(() => {});
    write(ALBUMS_KEY, list.filter((x) => x.id !== id));
  },
};

/** Legacy helper kept for compatibility — prefer idbPut for large files. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** One-time migration: purge oversized legacy data URLs so localStorage isn't stuck full. */
export function migrateLegacyStore() {
  if (typeof window === "undefined") return;
  const flag = "dada.migrated.v1";
  if (localStorage.getItem(flag)) return;
  try {
    const tracks = read<Track>(TRACKS_KEY).map((t) => {
      const x = { ...t };
      if (typeof x.audioUrl === "string" && x.audioUrl.startsWith("data:")) delete x.audioUrl;
      if (typeof x.cover === "string" && x.cover.startsWith("data:")) delete x.cover;
      return x;
    });
    write(TRACKS_KEY, tracks);
    const albums = read<Album>(ALBUMS_KEY).map((a) => {
      const x = { ...a };
      if (typeof x.cover === "string" && x.cover.startsWith("data:")) delete x.cover;
      return x;
    });
    write(ALBUMS_KEY, albums);
    localStorage.setItem(flag, "1");
  } catch {
    // ignore
  }
}

/** One-time wipe: clear all user-added tracks/albums (metadata + blobs). */
export async function resetMusicStore() {
  if (typeof window === "undefined") return;
  const flag = "dada.reset.v1";
  if (localStorage.getItem(flag)) return;
  try {
    const tracks = read<Track>(TRACKS_KEY);
    const albums = read<Album>(ALBUMS_KEY);
    for (const t of tracks) {
      if (t.audioKey) await idbDelete(t.audioKey).catch(() => {});
      if (t.coverKey) await idbDelete(t.coverKey).catch(() => {});
    }
    for (const a of albums) {
      if (a.coverKey) await idbDelete(a.coverKey).catch(() => {});
    }
    write(TRACKS_KEY, []);
    write(ALBUMS_KEY, []);
    localStorage.setItem(flag, "1");
  } catch {
    // ignore
  }
}

