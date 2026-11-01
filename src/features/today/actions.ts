"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth/session";
import { fail, ok, UNEXPECTED_ERROR, type ActionResult } from "@/lib/result";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

/** Hides the first-week checklist on Today for good. */
export async function dismissChecklist(): Promise<ActionResult> {
  const { user } = await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ checklist_dismissed_at: new Date().toISOString() }).eq("id", user.id);
  if (error) {
    console.error("[today] dismiss checklist", error.code, error.message);
    return fail(UNEXPECTED_ERROR);
  }
  revalidatePath(routes.today);
  return ok(undefined, "Checklist hidden");
}
