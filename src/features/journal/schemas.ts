import { z } from "zod";

export const entrySchema = z.object({
  title: z
    .string()
    .trim()
    .max(120, "Keep the title under 120 characters.")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  /** The editor document (ProseMirror JSON). Sanitised on the server; see rich/document.ts. */
  doc: z.unknown(),
  promptId: z.uuid().nullable(),
});

export type EntryInput = z.input<typeof entrySchema>;

export function wordCount(text: string) {
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}
