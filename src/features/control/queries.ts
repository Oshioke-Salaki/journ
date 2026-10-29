import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type ControlItem = Tables<"control_items">;

export async function listControlItems(day: string): Promise<ControlItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("control_items").select("*").eq("local_date", day).order("created_at");
  if (error) throw new Error(`Could not load your list: ${error.message}`);
  return data;
}
