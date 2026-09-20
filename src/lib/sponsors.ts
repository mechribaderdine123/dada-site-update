import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Sponsor = {
  id: string;
  name: string;
  image_url: string;
  link_url: string | null;
  sort_order: number;
};

// These are the partners that ship with the site. Rendering them immediately
// avoids making the home page wait for the browser's first Supabase request.
// The database remains the source of truth and replaces this list when ready.
export const defaultSponsors: Sponsor[] = [
  { id: "eu4youth", name: "EU4Youth", image_url: "", link_url: null, sort_order: 1 },
  { id: "redstart", name: "Redstart Tunisie", image_url: "", link_url: null, sort_order: 2 },
  { id: "eu", name: "Union européenne", image_url: "", link_url: null, sort_order: 3 },
  { id: "maghroumin", name: "Maghroum'in", image_url: "", link_url: null, sort_order: 4 },
];

export function useSponsors(initialSponsors: Sponsor[] = []) {
  const [sponsors, setSponsors] = useState<Sponsor[]>(initialSponsors);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("sponsors")
      .select("id,name,image_url,link_url,sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setSponsors((data as Sponsor[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { sponsors, loading, reload: load };
}

export async function addSponsor(input: { name: string; image_url: string; link_url?: string | null }) {
  return supabase.from("sponsors").insert({
    name: input.name,
    image_url: input.image_url,
    link_url: input.link_url || null,
  });
}

export async function updateSponsor(id: string, patch: Partial<Pick<Sponsor, "name" | "link_url" | "sort_order" | "image_url">>) {
  return supabase.from("sponsors").update(patch).eq("id", id);
}

export async function removeSponsor(id: string) {
  return supabase.from("sponsors").delete().eq("id", id);
}

