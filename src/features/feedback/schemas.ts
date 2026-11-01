import { z } from "zod";

export const FEEDBACK_KINDS = [
  { value: "idea", label: "An idea" },
  { value: "problem", label: "Something's wrong" },
  { value: "other", label: "Something else" },
] as const;

export const feedbackSchema = z.object({
  kind: z.enum(["idea", "problem", "other"]),
  body: z.string().trim().min(5, "Tell us a little more.").max(2000, "Keep it under 2,000 characters."),
  /** The browser, sent with problem reports so the team can reproduce them. */
  device: z.string().max(200).nullable().optional(),
});

export type FeedbackInput = z.input<typeof feedbackSchema>;
