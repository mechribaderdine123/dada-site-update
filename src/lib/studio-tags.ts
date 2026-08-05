import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StudioTag = {
  id: string;
  label: string;
  sort_order: number;
};

export function useStudioTags() {
  const [tags, setTags] = useState<StudioTag[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("studio_tags")
      .select("id,label,sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setTags((data as StudioTag[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { tags, loading, reload: load };
}

export async function addStudioTag(input: { label: string }) {
  return supabase.from("studio_tags").insert(input);
}

export async function updateStudioTag(
  id: string,
  patch: Partial<Pick<StudioTag, "label" | "sort_order">>,
) {
  return supabase.from("studio_tags").update(patch).eq("id", id);
}

export async function removeStudioTag(id: string) {
  return supabase.from("studio_tags").delete().eq("id", id);
}
