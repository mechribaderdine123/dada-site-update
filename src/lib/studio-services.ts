import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const STUDIO_SERVICE_ICONS = [
  "mic",
  "music",
  "sliders",
  "building",
  "video",
  "graduation",
] as const;
export type StudioServiceIcon = (typeof STUDIO_SERVICE_ICONS)[number];

export type StudioService = {
  id: string;
  title: string;
  description: string;
  icon: StudioServiceIcon;
  sort_order: number;
};

export function useStudioServices() {
  const [services, setServices] = useState<StudioService[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("studio_services")
      .select("id,title,description,icon,sort_order")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setServices((data as StudioService[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { services, loading, reload: load };
}

export async function addStudioService(input: {
  title: string;
  description: string;
  icon: StudioServiceIcon;
}) {
  return supabase.from("studio_services").insert(input);
}

export async function updateStudioService(
  id: string,
  patch: Partial<Pick<StudioService, "title" | "description" | "icon" | "sort_order">>,
) {
  return supabase.from("studio_services").update(patch).eq("id", id);
}

export async function removeStudioService(id: string) {
  return supabase.from("studio_services").delete().eq("id", id);
}
