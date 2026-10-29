import { z } from "zod";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters.`)
    .transform((v) => (v === "" ? null : v))
    .nullable();

export const quoteSchema = z.object({
  body: z.string().trim().min(5, "A quote needs at least 5 characters.").max(400, "Keep it under 400 characters."),
  author: optional(120),
  source: optional(160),
});

export const promptSchema = z.object({
  body: z.string().trim().min(5, "A prompt needs at least 5 characters.").max(280, "Keep it under 280 characters."),
  topicSlug: optional(40),
});

export const videoSchema = z.object({
  title: z.string().trim().min(1, "Give the video a title.").max(120, "Keep it under 120 characters."),
  description: z.string().trim().max(2000, "Keep it under 2,000 characters."),
  topicSlug: optional(40),
  kind: z.enum(["lesson", "practice", "coaching_session"]),
  tier: z.enum(["free", "premium"]),
  durationMinutes: z.coerce.number<string | number>().min(1, "At least 1 minute.").max(600, "Up to 600 minutes."),
  hostName: optional(80),
  muxPlaybackId: z
    .string()
    .trim()
    .max(120)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine((v) => !v || /^[A-Za-z0-9]+$/.test(v), { message: "A Mux playback ID has only letters and numbers." }),
  isPublished: z.boolean(),
});

export const topicSchema = z.object({
  title: z.string().trim().min(1, "Give the topic a title.").max(60, "Keep it under 60 characters."),
  summary: z.string().trim().min(1, "Describe the topic.").max(400, "Keep it under 400 characters."),
  isMature: z.boolean(),
});

export type QuoteInput = z.input<typeof quoteSchema>;
export type PromptInput = z.input<typeof promptSchema>;
export type VideoInput = z.input<typeof videoSchema>;
export type TopicInput = z.input<typeof topicSchema>;
