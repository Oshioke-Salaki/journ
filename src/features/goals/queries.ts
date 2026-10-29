import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Step = Tables<"goal_steps">;
export type Goal = Tables<"goals"> & { goal_steps: Step[] };

export function progress(goal: Pick<Goal, "goal_steps" | "status">) {
  const total = goal.goal_steps.length;
  const done = goal.goal_steps.filter((s) => s.done_at).length;
  return { done, total, ratio: goal.status === "achieved" ? 1 : total ? done / total : 0 };
}

export async function listGoals(): Promise<Goal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*, goal_steps(*)")
    .order("created_at", { ascending: false })
    .order("position", { referencedTable: "goal_steps" })
    .order("created_at", { referencedTable: "goal_steps" });
  if (error) throw new Error(`Could not load goals: ${error.message}`);
  return data;
}

export async function getGoal(id: string): Promise<Goal | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*, goal_steps(*)")
    .eq("id", id)
    .order("position", { referencedTable: "goal_steps" })
    .order("created_at", { referencedTable: "goal_steps" })
    .maybeSingle();
  if (error) throw new Error(`Could not load goal: ${error.message}`);
  return data;
}

export type PlannedStep = Step & { goal: Pick<Tables<"goals">, "id" | "title" | "status"> };

/** "My plans": open steps with a date, soonest first, from goals still in progress. */
export async function upcomingSteps(limit = 6): Promise<PlannedStep[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goal_steps")
    .select("*, goal:goals!inner(id, title, status)")
    .is("done_at", null)
    .not("due_date", "is", null)
    .eq("goal.status", "active")
    .order("due_date")
    .limit(limit);
  if (error) throw new Error(`Could not load plans: ${error.message}`);
  return data as PlannedStep[];
}

/** The next open step of each active goal, for the goal prompts on Today. */
export async function nextSteps(limit = 3): Promise<PlannedStep[]> {
  const goals = (await listGoals()).filter((g) => g.status === "active");
  const out: PlannedStep[] = [];
  for (const goal of goals) {
    const step = goal.goal_steps.find((s) => !s.done_at);
    if (step) out.push({ ...step, goal: { id: goal.id, title: goal.title, status: goal.status } });
    if (out.length >= limit) break;
  }
  return out;
}
