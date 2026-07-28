import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const WORKSHOP_CATEGORIES = [
  "Dance",
  "Master class",
  "Battles et spectacles",
  "Activités spéciales pour les clubs et les familles",
  "Ateliers musique & création digitale",
] as const;

export type WorkshopCategory = (typeof WORKSHOP_CATEGORIES)[number];

export type Workshop = {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  month: string;
  day: string;
  place: string;
  time: string;
  sort_order: number;
  is_finished: boolean;
};

export type WorkshopInput = Omit<Workshop, "id" | "sort_order" | "is_finished"> & { sort_order?: number; is_finished?: boolean };

export function useWorkshops() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("workshops")
      .select("id,name,category,description,image_url,month,day,place,time,sort_order,is_finished")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setWorkshops((data as Workshop[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { workshops, loading, reload: load };
}

export async function addWorkshop(input: WorkshopInput) {
  return supabase.from("workshops").insert(input);
}

export async function updateWorkshop(id: string, patch: Partial<WorkshopInput>) {
  return supabase.from("workshops").update(patch).eq("id", id);
}

export async function removeWorkshop(id: string) {
  return supabase.from("workshops").delete().eq("id", id);
}

