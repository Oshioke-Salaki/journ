import { z } from "zod";
import { BODY_AREA_IDS, FEELINGS, SENSATION_IDS } from "./constants";

const level = z.number().int().min(1).max(5);

export const bodyNoteSchema = z.object({
  area: z.enum(BODY_AREA_IDS),
  sensation: z.enum(SENSATION_IDS).nullable(),
});

export const checkInSchema = z.object({
  mood: level,
  energy: level.nullable(),
  efficiency: level.nullable(),
  selfSatisfaction: level.nullable(),
  body: z.array(bodyNoteSchema).max(13),
  feelings: z.array(z.enum(FEELINGS)).max(12),
  note: z
    .string()
    .trim()
    .max(2000, "Keep the note under 2,000 characters.")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
});

export type CheckInInput = z.input<typeof checkInSchema>;
export type BodyNote = z.infer<typeof bodyNoteSchema>;
