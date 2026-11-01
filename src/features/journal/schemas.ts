import { z } from "zod";

export const MAX_TAGS = 10;

/** "Self Care!" becomes "self care": lowercase letters, numbers, spaces and hyphens, up to 30. */
export function normaliseTag(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9 -]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[ -]+/, "")
    .slice(0, 30)
    .trim();
}

export const tagSchema = z
  .string()
  .transform(normaliseTag)
  .pipe(z.string().regex(/^[a-z0-9][a-z0-9 -]{0,29}$/, "Tags use letters, numbers, spaces and hyphens."));

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
  tags: z
    .array(tagSchema)
    .max(MAX_TAGS, `Up to ${MAX_TAGS} tags.`)
    .transform((tags) => [...new Set(tags)])
    .default([]),
});

export type EntryInput = z.input<typeof entrySchema>;

export function wordCount(text: string) {
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}
