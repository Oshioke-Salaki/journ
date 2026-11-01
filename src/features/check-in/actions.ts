"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth/session";
import { fail, invalid, ok, UNEXPECTED_ERROR, type ActionResult } from "@/lib/result";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { BACKFILL_DAYS, canCheckInFor } from "./constants";
import { checkInSchema, type CheckInInput } from "./schemas";

/** Saves a check-in for today or a recent day. A second check-in on the same day updates the first. */
export async function saveCheckIn(input: CheckInInput): Promise<ActionResult<{ id: string }>> {
  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { user, today } = await requireMember();
  const v = parsed.data;
  const day = v.date ?? today;
  if (!canCheckInFor(day, today)) return fail(`Check-ins can be added for the last ${BACKFILL_DAYS} days.`);
  // One note per area: keep the last one given.
  const body = [...new Map(v.body.map((n) => [n.area, n])).values()];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("check_ins")
    .upsert(
      {
        user_id: user.id,
        local_date: day,
        mood: v.mood,
        energy: v.energy,
        efficiency: v.efficiency,
        self_satisfaction: v.selfSatisfaction,
        body,
        feelings: [...new Set(v.feelings)],
        note: v.note,
      },
      { onConflict: "user_id,local_date" },
    )
    .select("id")
    .single();

  if (error) {
    console.error("[check-in] save", error.code, error.message);
    return fail(UNEXPECTED_ERROR);
  }

  revalidatePath(routes.today);
  revalidatePath(routes.space, "layout");
  return ok({ id: data.id }, "Check-in saved");
}
