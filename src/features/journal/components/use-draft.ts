"use client";

import { useEffect, useRef } from "react";

export type Draft = { title: string; body: string; promptId: string | null; savedAt: number };

const KEY_PREFIX = "journapp:draft:";

function read(key: string): Draft | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

/**
 * Keeps an unsaved entry on this device as it is written, so closing the tab or losing signal
 * never loses words. Drafts stay in this browser only and are cleared once the entry is saved.
 */
/** Removes every draft on this device. Called on sign-out, so a shared device keeps nothing. */
export function clearAllDrafts() {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith(KEY_PREFIX)) localStorage.removeItem(key);
  } catch {}
}

export function useDraft(key: string, value: Omit<Draft, "savedAt">, enabled: boolean) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        if (!value.body.trim() && !value.title.trim()) localStorage.removeItem(KEY_PREFIX + key);
        else localStorage.setItem(KEY_PREFIX + key, JSON.stringify({ ...value, savedAt: Date.now() }));
      } catch {
        // Storage can be full or blocked (private browsing). The entry can still be saved normally.
      }
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [key, value.title, value.body, value.promptId, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    restore: () => read(key),
    clear: () => {
      try {
        localStorage.removeItem(KEY_PREFIX + key);
      } catch {}
    },
  };
}
