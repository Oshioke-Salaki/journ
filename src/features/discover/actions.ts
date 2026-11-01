"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { fail, ok, UNEXPECTED_ERROR, type ActionResult } from "@/lib/result";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

/** Saves a video to watch later, or removes it. Saving twice is harmless. */
export async function setVideoSaved(videoId: string, saved: boolean): Promise<ActionResult> {
  if (!z.uuid().safeParse(videoId).success) return fail("That video doesn't exist.");
  await requireMember();
  const supabase = await createClient();
  const { error } = saved
    ? await supabase.from("saved_videos").upsert({ video_id: videoId }, { onConflict: "user_id,video_id", ignoreDuplicates: true })
    : await supabase.from("saved_videos").delete().eq("video_id", videoId);
  if (error) {
    // A foreign key failure means the video was removed.
    if (error.code === "23503") return fail("That video isn't available any more.");
    console.error("[discover] save", error.code, error.message);
    return fail(UNEXPECTED_ERROR);
  }
  revalidatePath(routes.discover, "layout");
  return ok(undefined, saved ? "Saved for later" : "Removed from saved");
}
