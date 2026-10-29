"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { fail, ok, UNEXPECTED_ERROR, type ActionResult } from "@/lib/result";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

const uuid = z.uuid();
const caption = z
  .string()
  .trim()
  .max(120, "Keep the caption under 120 characters.")
  .transform((v) => (v === "" ? null : v))
  .nullable();

function logged(where: string, error: { code?: string; message: string }) {
  console.error(`[vision] ${where}`, error.code, error.message);
  return fail(UNEXPECTED_ERROR);
}

async function nextPosition(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { count } = await supabase.from("vision_items").select("id", { count: "exact", head: true });
  return count ?? 0;
}

export async function addWords(input: { words: string; caption?: string | null }): Promise<ActionResult> {
  const parsed = z
    .object({ words: z.string().trim().min(1, "Write a word or two.").max(160, "Keep it under 160 characters."), caption })
    .safeParse({ words: input.words, caption: input.caption ?? null });
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { user } = await requireMember();
  const supabase = await createClient();
  if ((await nextPosition(supabase)) >= 60) return fail("Your board is full. Remove something to add more.");
  const { error } = await supabase
    .from("vision_items")
    .insert({ user_id: user.id, kind: "words", words: parsed.data.words, caption: parsed.data.caption, position: await nextPosition(supabase) });
  if (error) return logged("words", error);
  revalidatePath(routes.vision);
  return ok(undefined, "Added to your board");
}

/** Records a picture the browser has already uploaded to the member's own storage folder. */
export async function addImage(input: { path: string; caption?: string | null }): Promise<ActionResult> {
  const { user } = await requireMember();
  const match = /^([0-9a-f-]{36})\/([0-9a-f-]{36})\.(jpg|jpeg|png|webp)$/.exec(input.path);
  if (!match || match[1] !== user.id) return fail("That picture couldn't be added.");
  const parsedCaption = caption.safeParse(input.caption ?? null);
  if (!parsedCaption.success) return fail(parsedCaption.error.issues[0].message);

  const supabase = await createClient();
  if ((await nextPosition(supabase)) >= 60) {
    await supabase.storage.from("vision").remove([input.path]);
    return fail("Your board is full. Remove something to add more.");
  }
  const { error } = await supabase
    .from("vision_items")
    .insert({ user_id: user.id, kind: "image", image_path: input.path, caption: parsedCaption.data, position: await nextPosition(supabase) });
  if (error) {
    await supabase.storage.from("vision").remove([input.path]);
    return logged("image", error);
  }
  revalidatePath(routes.vision);
  return ok(undefined, "Picture added");
}

export async function removeVisionItem(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return fail("That item doesn't exist any more.");
  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase.from("vision_items").delete().eq("id", id).select("image_path");
  if (error) return logged("remove", error);
  const path = data[0]?.image_path;
  if (path) {
    const { error: storageError } = await supabase.storage.from("vision").remove([path]);
    if (storageError) console.error("[vision] storage remove", storageError.message);
  }
  revalidatePath(routes.vision);
  return ok(undefined, "Removed");
}
