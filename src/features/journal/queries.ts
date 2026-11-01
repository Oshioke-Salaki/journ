import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type JournalEntry = Tables<"journal_entries">;
export type EntrySummary = Pick<JournalEntry, "id" | "title" | "body" | "kind" | "prompt_body" | "local_date" | "created_at" | "tags">;

const SUMMARY = "id, title, body, kind, prompt_body, local_date, created_at, tags" as const;

export async function listEntries(limit = 50, search?: string, tag?: string): Promise<EntrySummary[]> {
  const supabase = await createClient();
  let query = supabase.from("journal_entries").select(SUMMARY).order("created_at", { ascending: false }).limit(limit);
  if (tag) query = query.contains("tags", [tag]);
  // Characters with meaning in PostgREST filters are dropped rather than escaped.
  const term = search?.replace(/[%,()*\\]/g, " ").trim().slice(0, 80);
  if (term) query = query.or(`title.ilike.%${term}%,body.ilike.%${term}%,prompt_body.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load journal: ${error.message}`);
  return data;
}

export async function getEntry(id: string): Promise<JournalEntry | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journal_entries").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load entry: ${error.message}`);
  return data;
}

export async function countEntries(sinceDate?: string): Promise<number> {
  const supabase = await createClient();
  let query = supabase.from("journal_entries").select("id", { count: "exact", head: true });
  if (sinceDate) query = query.gte("local_date", sinceDate);
  const { count, error } = await query;
  if (error) throw new Error(`Could not count entries: ${error.message}`);
  return count ?? 0;
}

/** Entries written on one local day, oldest first. */
export async function listEntriesForDay(day: string): Promise<EntrySummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journal_entries").select(SUMMARY).eq("local_date", day).order("created_at");
  if (error) throw new Error(`Could not load journal: ${error.message}`);
  return data;
}

/** How many entries were written on each day between two dates. */
export async function countEntriesByDay(from: string, to: string): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journal_entries").select("local_date").gte("local_date", from).lte("local_date", to);
  if (error) throw new Error(`Could not load journal: ${error.message}`);
  const counts = new Map<string, number>();
  for (const row of data) counts.set(row.local_date, (counts.get(row.local_date) ?? 0) + 1);
  return counts;
}

/** The member's tags, most used first. */
export async function listTags(): Promise<{ tag: string; n: number }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journal_entries").select("tags").not("tags", "eq", "{}");
  if (error) throw new Error(`Could not load tags: ${error.message}`);
  const counts = new Map<string, number>();
  for (const row of data) for (const t of row.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts].map(([tag, n]) => ({ tag, n })).sort((a, b) => b.n - a.n || a.tag.localeCompare(b.tag));
}

/** Full entries between two dates (inclusive), oldest first, for printing. */
export async function listEntriesBetween(from: string, to: string): Promise<JournalEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journal_entries").select("*").gte("local_date", from).lte("local_date", to).order("created_at").limit(1000);
  if (error) throw new Error(`Could not load journal: ${error.message}`);
  return data;
}
