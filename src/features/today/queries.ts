import "server-only";
import { addDays, monthsBefore } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export type SetupStep = "check-in" | "journal" | "goal" | "control" | "vision";
export type SetupProgress = Record<SetupStep, boolean>;

/** Which of the first things to try the member has done. One cheap existence check per table. */
export async function getSetupProgress(): Promise<SetupProgress> {
  const supabase = await createClient();
  const exists = async (table: "check_ins" | "journal_entries" | "goals" | "control_items" | "vision_items") => {
    const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true }).limit(1);
    if (error) throw new Error(`Could not check ${table}: ${error.message}`);
    return (count ?? 0) > 0;
  };
  const [checkIn, journal, goal, control, vision] = await Promise.all([
    exists("check_ins"),
    exists("journal_entries"),
    exists("goals"),
    exists("control_items"),
    exists("vision_items"),
  ]);
  return { "check-in": checkIn, journal, goal, control, vision };
}

export type Memory = { id: string; title: string | null; body: string; prompt_body: string | null; local_date: string; ago: string };

/** Entries written a week, a month and a year before `today`, newest first, one per distance. */
export async function getMemories(today: string): Promise<Memory[]> {
  const distances = [
    { date: addDays(today, -7), ago: "A week ago" },
    { date: monthsBefore(today, 1), ago: "A month ago" },
    { date: monthsBefore(today, 12), ago: "A year ago" },
  ];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("id, title, body, prompt_body, local_date")
    .in(
      "local_date",
      distances.map((d) => d.date),
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load memories: ${error.message}`);
  return distances.flatMap((d) => {
    const entry = data.find((e) => e.local_date === d.date && e.body.trim());
    return entry ? [{ ...entry, ago: d.ago }] : [];
  });
}
