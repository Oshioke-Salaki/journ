"use client";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import type { ActionResult } from "@/lib/result";

/** Puts the server's field errors on the form, so server and client validation look the same. */
export function applyFieldErrors<T extends FieldValues>(form: UseFormReturn<T>, result: ActionResult<unknown>) {
  if (result.ok || !result.fieldErrors) return;
  let first = true;
  for (const [name, messages] of Object.entries(result.fieldErrors)) {
    if (!messages?.length) continue;
    form.setError(name as Path<T>, { type: "server", message: messages[0] }, { shouldFocus: first });
    first = false;
  }
}
