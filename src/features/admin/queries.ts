import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Admin reads go through the member's own session; RLS lets admins see unpublished content too. */

export type AdminStats = {
  members: number;
  members_onboarded: number;
  members_new_7d: number;
  members_premium: number;
  active_7d: number;
  check_ins_7d: number;
  entries_7d: number;
  goals_active: number;
  signups_by_day: { day: string; n: number }[];
};

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_stats");
  if (error) throw new Error(`Could not load stats: ${error.message}`);
  return data as unknown as AdminStats;
}

export async function adminQuotes() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function adminPrompts() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("prompts").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function adminVideos() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("videos").select("*").order("sort").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function adminVideo(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("videos").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function adminTopics() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("topics").select("*").order("sort");
  if (error) throw new Error(error.message);
  return data;
}
