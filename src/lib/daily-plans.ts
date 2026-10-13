import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Weekly schedule plans: one square image per row, grouped by day. A day can
// hold several plans, the public page filters on `day`.

export const PLAN_DAYS = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
] as const;

export type PlanDay = (typeof PLAN_DAYS)[number];

export type DailyPlan = {
  id: string;
  day: string;
  title: string;
  image_url: string;
  sort_order: number;
  created_at: string;
};

export type DailyPlanInput = {
  day: string;
  title: string;
  image_url: string;
  sort_order?: number;
};

export function isPlanDay(value: string): value is PlanDay {
  return (PLAN_DAYS as readonly string[]).includes(value);
}

/** Weekday key of `date`, in the French day names used by the plans. */
export function todayPlanDay(date: Date = new Date()): PlanDay {
  return PLAN_DAYS[(date.getDay() + 6) % 7];
}

export function useDailyPlans() {
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("daily_plans")
      .select("id,day,title,image_url,sort_order,created_at")
      .order("day", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setPlans((data as DailyPlan[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { plans, loading, reload: load };
}

export async function addDailyPlan(input: DailyPlanInput) {
  return supabase.from("daily_plans").insert(input);
}

export async function updateDailyPlan(id: string, patch: Partial<DailyPlanInput>) {
  return supabase.from("daily_plans").update(patch).eq("id", id);
}

export async function removeDailyPlan(id: string) {
  return supabase.from("daily_plans").delete().eq("id", id);
}
