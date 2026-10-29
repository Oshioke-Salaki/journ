import { z } from "zod";
import { GOAL_AREAS } from "./constants";

const isoDate = z
  .string()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), { message: "Enter a valid date." });

export const stepSchema = z.object({
  title: z.string().trim().min(1, "Describe the step.").max(160, "Keep it under 160 characters."),
  dueDate: isoDate,
});

export const goalSchema = z.object({
  title: z.string().trim().min(1, "Give your goal a name.").max(120, "Keep it under 120 characters."),
  why: z
    .string()
    .trim()
    .max(1000, "Keep it under 1,000 characters.")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  area: z.enum(GOAL_AREAS.map((a) => a.value) as [string, ...string[]]),
  targetDate: isoDate,
  steps: z.array(stepSchema).max(30, "Up to 30 steps per goal."),
});

export const goalUpdateSchema = goalSchema.omit({ steps: true });

export type GoalInput = z.input<typeof goalSchema>;
export type GoalUpdateInput = z.input<typeof goalUpdateSchema>;
export type StepInput = z.input<typeof stepSchema>;
