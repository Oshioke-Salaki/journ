import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type JournalEntry = Tables<"journal_entries">;
export type EntrySummary = Pick<JournalEntry, "id" | "title" | "body" | "kind" | "prompt_body" | "local_date" | "created_at">;

const SUMMARY = "id, title, body, kind, prompt_body, local_date, created_at" as const;

export async function listEntries(limit = 50, search?: string): Promise<EntrySummary[]> {
  const supabase = await createClient();
  let query = supabase.from("journal_entries").select(SUMMARY).order("created_at", { ascending: false }).limit(limit);
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
