"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireMember } from "@/lib/auth/session";
import { fail, invalid, ok, UNEXPECTED_ERROR, type ActionResult } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import { feedbackSchema, type FeedbackInput } from "./schemas";

/** A member writes to the team. Admins read it in Admin → Inbox. */
export async function sendFeedback(input: FeedbackInput): Promise<ActionResult> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await requireMember();
  const { kind, body, device } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("feedback").insert({ kind, body, page: kind === "problem" ? (device ?? null) : null });
  if (error) {
    console.error("[feedback] send", error.code, error.message);
    return fail(UNEXPECTED_ERROR);
  }
  revalidatePath("/admin", "layout");
  return ok(undefined, "Thank you. The team will read it.");
}

/** Marks a message handled, or new again. */
export async function markFeedback(id: string, done: boolean): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return fail("That message doesn't exist.");
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("feedback").update({ status: done ? "done" : "new" }).eq("id", id).select("id");
  if (error) {
    console.error("[feedback] mark", error.code, error.message);
    return fail(UNEXPECTED_ERROR);
  }
  if (!data.length) return fail("That message doesn't exist.");
  revalidatePath("/admin", "layout");
  return ok(undefined, done ? "Marked as handled" : "Moved back to new");
}
