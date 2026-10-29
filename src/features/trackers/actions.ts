"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { fail, ok, UNEXPECTED_ERROR, type ActionResult } from "@/lib/result";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { tracker, TRACKERS, type TrackerKind } from "./constants";

const kinds = TRACKERS.map((t) => t.kind) as [TrackerKind, ...TrackerKind[]];
const input = z.object({ kind: z.enum(kinds), value: z.number().finite() });

/**
 * Sets today's value for a tracker. "add" trackers store the difference as a new entry, so the
 * day keeps its history; "set" trackers replace the day's value.
 */
export async function setTracker(raw: { kind: TrackerKind; value: number }): Promise<ActionResult<{ value: number }>> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return fail("That value isn't valid.");
  const { kind } = parsed.data;
  const t = tracker(kind);
  const value = Math.min(t.max, Math.max(0, Math.round(parsed.data.value / t.step) * t.step));

  const { user, today } = await requireMember();
  const supabase = await createClient();

  const { data: rows, error: readError } = await supabase.from("tracker_entries").select("value").eq("local_date", today).eq("kind", kind);
  if (readError) return logged(readError);

  if (t.mode === "add") {
    const current = rows.reduce((sum, r) => sum + Number(r.value), 0);
    const delta = value - current;
    if (delta > 0) {
      const { error } = await supabase.from("tracker_entries").insert({ user_id: user.id, local_date: today, kind, value: delta });
      if (error) return logged(error);
    } else if (delta < 0) {
      // Going down: replace the day's entries with the new total.
      const { error: delError } = await supabase.from("tracker_entries").delete().eq("local_date", today).eq("kind", kind);
      if (delError) return logged(delError);
      if (value > 0) {
        const { error } = await supabase.from("tracker_entries").insert({ user_id: user.id, local_date: today, kind, value });
        if (error) return logged(error);
      }
    }
  } else {
    const { error: delError } = await supabase.from("tracker_entries").delete().eq("local_date", today).eq("kind", kind);
    if (delError) return logged(delError);
    if (value > 0) {
      const { error } = await supabase.from("tracker_entries").insert({ user_id: user.id, local_date: today, kind, value });
      if (error) return logged(error);
    }
  }

  revalidatePath(routes.space);
  return ok({ value });
}

function logged(error: { code?: string; message: string }) {
  console.error("[trackers]", error.code, error.message);
  return fail(UNEXPECTED_ERROR);
}
