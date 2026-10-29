"use client";

import { toast } from "sonner";
import type { ActionResult } from "@/lib/result";

export const notify = {
  success: (message: string, description?: string) => toast.success(message, { description }),
  error: (message: string, description?: string) => toast.error(message, { description }),
  info: (message: string, description?: string) => toast.info(message, { description }),
};

/** Shows the toast an action asks for and returns its result for the caller to act on. */
export function toastResult<T>(result: ActionResult<T>, successFallback?: string) {
  if (result.ok) {
    const message = result.message ?? successFallback;
    if (message) notify.success(message);
  } else {
    notify.error(result.error);
  }
  return result;
}
