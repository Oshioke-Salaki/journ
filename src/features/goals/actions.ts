"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { fail, invalid, ok, UNEXPECTED_ERROR, type ActionResult } from "@/lib/result";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { goalSchema, goalUpdateSchema, stepSchema, type GoalInput, type GoalUpdateInput, type StepInput } from "./schemas";
import type { GoalArea } from "./constants";

const uuid = z.uuid();
const NOT_FOUND = "That goal doesn't exist any more.";

function refresh(goalId?: string) {
  revalidatePath(routes.space, "layout");
  revalidatePath(routes.today);
  if (goalId) revalidatePath(routes.goal(goalId));
}

function logFail(where: string, error: { code?: string; message: string }) {
  console.error(`[goals] ${where}`, error.code, error.message);
  return fail(UNEXPECTED_ERROR);
}

export async function createGoal(input: GoalInput): Promise<ActionResult<{ id: string }>> {
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { user } = await requireMember();
  const v = parsed.data;

  const supabase = await createClient();
  const { data: goal, error } = await supabase
    .from("goals")
    .insert({ user_id: user.id, title: v.title, why: v.why, area: v.area as GoalArea, target_date: v.targetDate })
    .select("id")
    .single();
  if (error) return logFail("create", error);

  if (v.steps.length) {
    const { error: stepsError } = await supabase.from("goal_steps").insert(
      v.steps.map((s, position) => ({ user_id: user.id, goal_id: goal.id, title: s.title, due_date: s.dueDate, position })),
    );
    if (stepsError) {
      // Keep the data consistent: a goal without the steps the member wrote is worse than none.
      await supabase.from("goals").delete().eq("id", goal.id);
      return logFail("create steps", stepsError);
    }
  }

  refresh();
  return ok({ id: goal.id }, "Goal set");
}

export async function updateGoal(goalId: string, input: GoalUpdateInput): Promise<ActionResult> {
  if (!uuid.safeParse(goalId).success) return fail(NOT_FOUND);
  const parsed = goalUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await requireMember();
  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .update({ title: v.title, why: v.why, area: v.area as GoalArea, target_date: v.targetDate })
    .eq("id", goalId)
    .select("id");
  if (error) return logFail("update", error);
  if (!data.length) return fail(NOT_FOUND);
  refresh(goalId);
  return ok(undefined, "Goal updated");
}

export async function setGoalStatus(goalId: string, status: "active" | "achieved" | "paused"): Promise<ActionResult> {
  if (!uuid.safeParse(goalId).success) return fail(NOT_FOUND);
  if (!["active", "achieved", "paused"].includes(status)) return fail(UNEXPECTED_ERROR);
  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .update({ status, achieved_at: status === "achieved" ? new Date().toISOString() : null })
    .eq("id", goalId)
    .select("id");
  if (error) return logFail("status", error);
  if (!data.length) return fail(NOT_FOUND);
  refresh(goalId);
  const message = status === "achieved" ? "Goal achieved. Well done." : status === "paused" ? "Goal paused" : "Goal resumed";
  return ok(undefined, message);
}

export async function deleteGoal(goalId: string): Promise<ActionResult> {
  if (!uuid.safeParse(goalId).success) return fail(NOT_FOUND);
  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", goalId);
  if (error) return logFail("delete", error);
  refresh();
  return ok(undefined, "Goal deleted");
}

export async function addStep(goalId: string, input: StepInput): Promise<ActionResult<{ id: string }>> {
  if (!uuid.safeParse(goalId).success) return fail(NOT_FOUND);
  const parsed = stepSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { user } = await requireMember();
  const supabase = await createClient();
  const { count } = await supabase.from("goal_steps").select("id", { count: "exact", head: true }).eq("goal_id", goalId);
  if ((count ?? 0) >= 30) return fail("A goal can have up to 30 steps.");
  const { data, error } = await supabase
    .from("goal_steps")
    .insert({ user_id: user.id, goal_id: goalId, title: parsed.data.title, due_date: parsed.data.dueDate, position: count ?? 0 })
    .select("id")
    .single();
  if (error) return error.code === "23503" ? fail(NOT_FOUND) : logFail("add step", error);
  refresh(goalId);
  return ok({ id: data.id });
}

export async function toggleStep(stepId: string, done: boolean): Promise<ActionResult> {
  if (!uuid.safeParse(stepId).success) return fail("That step doesn't exist any more.");
  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goal_steps")
    .update({ done_at: done ? new Date().toISOString() : null })
    .eq("id", stepId)
    .select("goal_id");
  if (error) return logFail("toggle step", error);
  if (!data.length) return fail("That step doesn't exist any more.");
  refresh(data[0].goal_id);
  return ok(undefined);
}

export async function deleteStep(stepId: string): Promise<ActionResult> {
  if (!uuid.safeParse(stepId).success) return fail("That step doesn't exist any more.");
  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase.from("goal_steps").delete().eq("id", stepId).select("goal_id");
  if (error) return logFail("delete step", error);
  refresh(data[0]?.goal_id);
  return ok(undefined, "Step removed");
}
