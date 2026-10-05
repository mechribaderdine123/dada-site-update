import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type Store = Record<string, string>;

// Store hydrated on the server for the current request. When a route provides
// it, useContent reads from here so the server renders the real value and the
// first client render matches it -- no fallback image, no swap.
const SiteContentContext = createContext<Store | null>(null);

export function SiteContentProvider({
  content,
  children,
}: {
  content: Store;
  children: ReactNode;
}) {
  return <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>;
}

const listeners = new Set<() => void>();
let cache: Store = {};
let loaded = false;
let loadPromise: PromiseLike<void> | null = null;

function notify() {
  listeners.forEach((l) => l());
}

function ensureLoaded() {
  if (loaded || loadPromise || typeof window === "undefined") return;
  loadPromise = supabase
    .from("site_content")
    .select("key,value")
    .then(({ data }) => {
      const next: Store = {};
      (data ?? []).forEach((row: { key: string; value: string }) => {
        next[row.key] = row.value;
      });
      cache = next;
      loaded = true;
      notify();
    });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  ensureLoaded();
  return () => listeners.delete(cb);
}

function resolve(store: Store | null, key: string, fallback: string): string {
  const source = store ?? cache;
  const v = source[key];
  // Lovable asset metadata uses a development-only URL that a self-hosted app
  // cannot serve, so retain the bundled image when an old value is present.
  return v !== undefined && v !== "" && !v.startsWith("/__l5e/") ? v : fallback;
}

export function getContent(key: string, fallback: string): string {
  return resolve(cache, key, fallback);
}

export async function setContent(key: string, value: string) {
  const next = { ...cache };
  if (value === "") delete next[key];
  else next[key] = value;
  cache = next;
  notify();

  if (value === "") {
    await supabase.from("site_content").delete().eq("key", key);
  } else {
    await supabase.from("site_content").upsert({ key, value });
  }
}

export function useContent(key: string, fallback: string): string {
  // The server and the browser resolve against the same store, so the first
  // client render reproduces the server markup exactly and the image never
  // swaps after hydration.
  const store = useContext(SiteContentContext) ?? cache;
  const read = () => resolve(store, key, fallback);
  return useSyncExternalStore(subscribe, read, read);
}
