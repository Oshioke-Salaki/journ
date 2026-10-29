import "server-only";
import { addDays } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import type { BodyNote } from "./schemas";

export type CheckIn = Omit<Tables<"check_ins">, "body"> & { body: BodyNote[] };

function normalise(row: Tables<"check_ins">): CheckIn {
  return { ...row, body: Array.isArray(row.body) ? (row.body as BodyNote[]) : [] };
}

/** The member's check-in for `day`, if there is one. RLS scopes the query to the member. */
export async function getCheckIn(day: string): Promise<CheckIn | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("check_ins").select("*").eq("local_date", day).maybeSingle();
  if (error) throw new Error(`Could not load check-in: ${error.message}`);
  return data ? normalise(data) : null;
}

/** Check-ins from the `days` days ending on `today`, oldest first. */
export async function getRecentCheckIns(today: string, days: number): Promise<CheckIn[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("check_ins")
    .select("*")
    .gte("local_date", addDays(today, -(days - 1)))
    .lte("local_date", today)
    .order("local_date", { ascending: true });
  if (error) throw new Error(`Could not load check-ins: ${error.message}`);
  return data.map(normalise);
}
