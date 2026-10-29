"use server";

import { requireUser } from "@/lib/auth/session";
import { fail, ok, UNEXPECTED_ERROR, type ActionResult } from "@/lib/result";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

/** Everything JournApp stores about the member, as JSON, for "Download my data". */
export async function exportMyData(): Promise<ActionResult<{ json: string; filename: string }>> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("export_my_data");
  if (error) {
    console.error("[settings] export", error.code, error.message);
    return fail(UNEXPECTED_ERROR);
  }
  const stamp = new Date().toISOString().slice(0, 10);
  return ok({ json: JSON.stringify(data, null, 2), filename: `journapp-data-${stamp}.json` });
}

/** Permanently deletes the account and everything in it. The confirmation word is checked here too. */
export async function deleteAccount(confirmation: string): Promise<ActionResult<{ next: string }>> {
  if (confirmation.trim().toUpperCase() !== "DELETE") return fail('Type "DELETE" to confirm.');
  const user = await requireUser();
  const supabase = await createClient();

  // Pictures first: storage files are removed through the Storage API, not by the database.
  const { data: files } = await supabase.storage.from("vision").list(user.id, { limit: 1000 });
  if (files?.length) {
    const { error: storageError } = await supabase.storage.from("vision").remove(files.map((f) => `${user.id}/${f.name}`));
    if (storageError) {
      console.error("[settings] delete pictures", storageError.message);
      return fail(UNEXPECTED_ERROR);
    }
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    console.error("[settings] delete account", error.code, error.message);
    return fail(UNEXPECTED_ERROR);
  }
  await supabase.auth.signOut();
  // The caller does a full page load to this address; see signOut.
  return ok({ next: `${routes.home}?deleted=1` });
}
