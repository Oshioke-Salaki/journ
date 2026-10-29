"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { fail, ok, UNEXPECTED_ERROR, type ActionResult } from "@/lib/result";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { Zone } from "./constants";

const uuid = z.uuid();
const body = z.string().trim().min(1, "Write a few words first.").max(200, "Keep it under 200 characters.");
const GONE = "That item doesn't exist any more.";

function refresh() {
  revalidatePath(routes.control);
  revalidatePath(routes.today);
}

function logged(where: string, error: { code?: string; message: string }) {
  console.error(`[control] ${where}`, error.code, error.message);
  return fail(UNEXPECTED_ERROR);
}

export async function addControlItem(text: string): Promise<ActionResult<{ id: string }>> {
  const parsed = body.safeParse(text);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { user, today } = await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase.from("control_items").insert({ user_id: user.id, local_date: today, body: parsed.data }).select("id").single();
  if (error) return logged("add", error);
  refresh();
  return ok({ id: data.id });
}

export async function setZone(id: string, zone: Zone | null): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return fail(GONE);
  if (zone !== null && !["control", "influence", "outside"].includes(zone)) return fail(UNEXPECTED_ERROR);
  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase.from("control_items").update({ zone }).eq("id", id).select("id");
  if (error) return logged("zone", error);
  if (!data.length) return fail(GONE);
  refresh();
  return ok(undefined);
}

export async function deleteControlItem(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return fail(GONE);
  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.from("control_items").delete().eq("id", id);
  if (error) return logged("delete", error);
  refresh();
  return ok(undefined);
}

/** Turns a controllable item into a step of an existing goal, or into a new goal of its own. */
export async function makeStep(id: string, goalId: string | "new"): Promise<ActionResult<{ goalId: string }>> {
  if (!uuid.safeParse(id).success) return fail(GONE);
  if (goalId !== "new" && !uuid.safeParse(goalId).success) return fail("Choose a goal.");
  const { user } = await requireMember();
  const supabase = await createClient();

  const { data: item, error: itemError } = await supabase.from("control_items").select("id, body, goal_step_id").eq("id", id).maybeSingle();
  if (itemError) return logged("read", itemError);
  if (!item) return fail(GONE);
  if (item.goal_step_id) return fail("This is already a step.");

  let targetGoal = goalId;
  if (goalId === "new") {
    const { data: goal, error } = await supabase.from("goals").insert({ user_id: user.id, title: item.body.slice(0, 120) }).select("id").single();
    if (error) return logged("new goal", error);
    targetGoal = goal.id;
  }

  const { count } = await supabase.from("goal_steps").select("id", { count: "exact", head: true }).eq("goal_id", targetGoal);
  const { data: step, error: stepError } = await supabase
    .from("goal_steps")
    .insert({ user_id: user.id, goal_id: targetGoal, title: item.body.slice(0, 160), position: count ?? 0 })
    .select("id")
    .single();
  if (stepError) return stepError.code === "23503" ? fail("That goal doesn't exist any more.") : logged("step", stepError);

  const { error: linkError } = await supabase.from("control_items").update({ goal_step_id: step.id, zone: "control" }).eq("id", id);
  if (linkError) return logged("link", linkError);

  refresh();
  revalidatePath(routes.space, "layout");
  return ok({ goalId: targetGoal }, goalId === "new" ? "New goal created" : "Added as a step");
}
