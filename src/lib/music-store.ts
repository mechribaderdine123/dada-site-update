import { useEffect, useState } from "react";

export type Track = {
  id: string;
  title: string;
  genre: string;
  cover: string; // data URL or image URL
  audioUrl?: string;
  albumId?: string | null;
  createdAt: number;
};

export type Album = {
  id: string;
  title: string;
  year: string;
  cover: string;
  createdAt: number;
};

const TRACKS_KEY = "dada.tracks";
const ALBUMS_KEY = "dada.albums";

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
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("dada-store-update", { detail: key }));
}

export function useTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  useEffect(() => {
    setTracks(read<Track>(TRACKS_KEY));
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === TRACKS_KEY) setTracks(read<Track>(TRACKS_KEY));
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
      const detail = (e as CustomEvent).detail;
      if (detail === ALBUMS_KEY) setAlbums(read<Album>(ALBUMS_KEY));
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
  remove(id: string) {
    write(TRACKS_KEY, read<Track>(TRACKS_KEY).filter((t) => t.id !== id));
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
  remove(id: string) {
    write(ALBUMS_KEY, read<Album>(ALBUMS_KEY).filter((a) => a.id !== id));
  },
};

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
