import { z } from "zod";
import { COUNTRY_CODES } from "./countries";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters.`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const PRONOUN_OPTIONS = ["she/her", "he/him", "they/them"] as const;
export const LANGUAGE_OPTIONS = [{ value: "en", label: "English" }] as const;

export const nameSchema = z.string().trim().min(1, "Tell us what to call you.").max(60, "Keep it under 60 characters.");

export const aboutYouSchema = z.object({
  dateOfBirth: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .refine((v) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && v > "1900-01-01" && v < new Date().toISOString().slice(0, 10)), {
      message: "Enter a date in the past.",
    }),
  birthTime: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .refine((v) => !v || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), { message: "Enter a time like 07:30." }),
  birthPlace: optionalText(120),
  /** Set when the place was chosen from the search: what astrology charts need. */
  birthLocation: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      timezone: z.string().max(64).nullable(),
      countryCode: z
        .string()
        .regex(/^[A-Z]{2}$/)
        .nullable(),
    })
    .nullable()
    .optional(),
  country: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .refine((v) => !v || COUNTRY_CODES.has(v), { message: "Choose a country from the list." }),
  pronouns: optionalText(40),
  language: z.enum(["en"]).default("en"),
});

export const preferencesSchema = z.object({
  goalPromptsEnabled: z.boolean(),
  remindersEnabled: z.boolean(),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a time like 20:00."),
});

export const onboardingSchema = z.object({
  name: nameSchema,
  about: aboutYouSchema,
  preferences: preferencesSchema,
  timezone: z.string().max(64).optional(),
});

export const profileUpdateSchema = z.object({
  name: nameSchema,
  about: aboutYouSchema,
});

export type AboutYouInput = z.input<typeof aboutYouSchema>;
export type PreferencesInput = z.input<typeof preferencesSchema>;
export type OnboardingInput = z.input<typeof onboardingSchema>;
export type ProfileUpdateInput = z.input<typeof profileUpdateSchema>;
