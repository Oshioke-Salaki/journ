"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPrompt } from "@/features/content/queries";
import { requireMember } from "@/lib/auth/session";
import { fail, invalid, ok, UNEXPECTED_ERROR, type ActionResult } from "@/lib/result";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { entrySchema, type EntryInput } from "./schemas";

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
      body: parsed.data.body,
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

  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .update({ title: parsed.data.title, body: parsed.data.body })
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
