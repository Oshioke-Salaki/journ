import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Videos the member saved to watch later, newest first. */
export async function listSavedVideoIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("saved_videos").select("video_id").order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load saved videos: ${error.message}`);
  return data.map((r) => r.video_id);
}
