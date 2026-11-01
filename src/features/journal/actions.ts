"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPrompt } from "@/features/content/queries";
import { requireMember } from "@/lib/auth/session";
import { fail, invalid, ok, UNEXPECTED_ERROR, type ActionResult } from "@/lib/result";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { docToText, InvalidDocument, sanitizeDoc, type DocNode } from "./rich/document";
import { entrySchema, type EntryInput } from "./schemas";

/** Sanitises the document and derives the plain text from it (never trusting a client copy). */
function prepare(rawDoc: unknown): { doc: DocNode; body: string } | { error: string } {
  try {
    const doc = sanitizeDoc(rawDoc);
    const body = docToText(doc);
    if (!body.trim()) return { error: "Write something before saving." };
    return { doc, body };
  } catch (error) {
    if (error instanceof InvalidDocument) return { error: error.message === "Entry too long" ? "This entry is too long to save." : "This entry couldn't be read. Please try again." };
    throw error;
  }
}

const id = z.uuid();

function refresh(entryId?: string) {
  revalidatePath(routes.journal);
  revalidatePath(routes.today);
  revalidatePath(routes.space);
  if (entryId) revalidatePath(routes.journalEntry(entryId));
}

export async function createEntry(input: EntryInput): Promise<ActionResult<{ id: string }>> {
  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const prepared = prepare(parsed.data.doc);
  if ("error" in prepared) return fail(prepared.error, { body: [prepared.error] });

  const { user, today } = await requireMember();
  const prompt = parsed.data.promptId ? await getPrompt(parsed.data.promptId) : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      user_id: user.id,
      kind: prompt ? "prompted" : "free",
      prompt_id: prompt?.id ?? null,
      prompt_body: prompt?.body ?? null,
      title: parsed.data.title,
      body: prepared.body,
      body_doc: prepared.doc as unknown as Json,
      local_date: today,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[journal] create", error.code, error.message);
    return fail(UNEXPECTED_ERROR);
  }
  refresh();
  return ok({ id: data.id }, "Entry saved");
}

export async function updateEntry(entryId: string, input: EntryInput): Promise<ActionResult> {
  if (!id.safeParse(entryId).success) return fail("That entry doesn't exist.");
  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const prepared = prepare(parsed.data.doc);
  if ("error" in prepared) return fail(prepared.error, { body: [prepared.error] });

  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .update({ title: parsed.data.title, body: prepared.body, body_doc: prepared.doc as unknown as Json })
    .eq("id", entryId)
    .select("id");
  if (error) {
    console.error("[journal] update", error.code, error.message);
    return fail(UNEXPECTED_ERROR);
  }
  if (!data.length) return fail("That entry doesn't exist any more.");
  refresh(entryId);
  return ok(undefined, "Changes saved");
}

export async function deleteEntry(entryId: string): Promise<ActionResult> {
  if (!id.safeParse(entryId).success) return fail("That entry doesn't exist.");
  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.from("journal_entries").delete().eq("id", entryId);
  if (error) {
    console.error("[journal] delete", error.code, error.message);
    return fail(UNEXPECTED_ERROR);
  }
  refresh();
  return ok(undefined, "Entry deleted");
}
