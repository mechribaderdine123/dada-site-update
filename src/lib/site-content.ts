import { useSyncExternalStore } from "react";

const STORAGE_KEY = "dada.site-content.v1";
const AUTH_KEY = "dada.admin.auth.v1";

type Store = Record<string, string>;

const listeners = new Set<() => void>();
let cache: Store | null = null;

function read(): Store {
  if (cache) return cache;
  if (typeof window === "undefined") return {};
  try {
    cache = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    cache = {};
  }
  return cache!;
}

function write(next: Store) {
  cache = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getContent(key: string, fallback: string): string {
  const v = read()[key];
  return v !== undefined && v !== "" ? v : fallback;
}

export function setContent(key: string, value: string) {
  const cur = { ...read() };
  if (value === "") delete cur[key];
  else cur[key] = value;
  write(cur);
}

export function resetContent() {
  write({});
}

export function exportContent(): Store {
  return { ...read() };
}

export function useContent(key: string, fallback: string): string {
  return useSyncExternalStore(
    subscribe,
    () => getContent(key, fallback),
    () => fallback,
  );
}

// ---- Admin auth (client-only demo) ----
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "dada2026";

export function adminLogin(username: string, password: string): boolean {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    if (typeof window !== "undefined") localStorage.setItem(AUTH_KEY, "1");
    return true;
  }
  return false;
}

export function adminLogout() {
  if (typeof window !== "undefined") localStorage.removeItem(AUTH_KEY);
}

export function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) === "1";
}

// ---- Image helpers: store as data URL in same store ----
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
