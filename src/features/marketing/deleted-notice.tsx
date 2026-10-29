"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { notify } from "@/lib/notify";

/** Confirms an account deletion after the redirect home. */
export function DeletedNotice() {
  const params = useSearchParams();
  useEffect(() => {
    if (params.get("deleted") !== "1") return;
    notify.success("Your account has been deleted", "Everything you stored in JournApp has been erased.");
    const url = new URL(window.location.href);
    url.searchParams.delete("deleted");
    window.history.replaceState(null, "", url);
  }, [params]);
  return null;
}
