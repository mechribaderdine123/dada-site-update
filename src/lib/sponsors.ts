import { useSyncExternalStore } from "react";
import eu4youth from "@/assets/sponsor-eu4youth.png.asset.json";
import redstart from "@/assets/sponsor-redstart.png.asset.json";
import eu from "@/assets/sponsor-eu.png.asset.json";
import maghroumin from "@/assets/sponsor-maghroumin.png.asset.json";

export type Sponsor = { id: string; name: string; image: string; url?: string };

const STORAGE_KEY = "dada.sponsors.v1";

const DEFAULTS: Sponsor[] = [
  { id: "eu4youth", name: "EU4Youth", image: eu4youth.url },
  { id: "redstart", name: "Redstart Tunisie", image: redstart.url },
  { id: "eu", name: "Union européenne", image: eu.url },
  { id: "maghroumin", name: "Maghroum'in", image: maghroumin.url },
];

const listeners = new Set<() => void>();
let cache: Sponsor[] | null = null;

function read(): Sponsor[] {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as Sponsor[]) : DEFAULTS;
  } catch {
    cache = DEFAULTS;
  }
  return cache!;
}

function write(next: Sponsor[]) {
  cache = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

export function getSponsors(): Sponsor[] {
  return read();
}

export function addSponsor(s: Omit<Sponsor, "id">) {
  const item: Sponsor = { ...s, id: crypto.randomUUID() };
  write([...read(), item]);
}

export function removeSponsor(id: string) {
  write(read().filter((s) => s.id !== id));
}

export function updateSponsor(id: string, patch: Partial<Sponsor>) {
  write(read().map((s) => (s.id === id ? { ...s, ...patch } : s)));
}

export function resetSponsors() {
  write(DEFAULTS);
}

export function useSponsors(): Sponsor[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => read(),
    () => DEFAULTS,
  );
}
