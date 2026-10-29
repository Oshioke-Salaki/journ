"use client";

import { useEffect } from "react";

/** Registers the offline page for the installed app (production only). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Not fatal: the app works without it, just with the browser's own offline page.
    });
  }, []);
  return null;
}
