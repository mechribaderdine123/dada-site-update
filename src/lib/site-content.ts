import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

type Store = Record<string, string>;

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
      (data ?? []).forEach((row) => {
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

export function getContent(key: string, fallback: string): string {
  const v = cache[key];
  // Lovable asset metadata uses a development-only URL that a self-hosted app
  // cannot serve, so retain the bundled image when an old value is present.
  return v !== undefined && v !== "" && !v.startsWith("/__l5e/") ? v : fallback;
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
  return useSyncExternalStore(
    subscribe,
    () => getContent(key, fallback),
    () => fallback,
  );
}
