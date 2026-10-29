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
  // Blank step rows in the form are ignored; a row with only a date asks for a description.
  steps: z
    .array(
      z
        .object({ title: z.string().trim().max(160, "Keep it under 160 characters."), dueDate: isoDate })
        .refine((s) => s.title !== "" || !s.dueDate, { message: "Describe the step.", path: ["title"] }),
    )
    .max(30, "Up to 30 steps per goal.")
    .transform((steps) => steps.filter((s) => s.title !== "")),
});

export const goalUpdateSchema = goalSchema.omit({ steps: true });

export type GoalInput = z.input<typeof goalSchema>;
export type GoalUpdateInput = z.input<typeof goalUpdateSchema>;
export type StepInput = z.input<typeof stepSchema>;
