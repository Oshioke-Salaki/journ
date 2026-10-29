"use client";

import { useEffect, useEffectEvent } from "react";

/**
 * Runs `fn` when the component mounts and every time Next.js shows it again after keeping it
 * hidden (React Activity preserves pages for instant back-navigation and re-runs effects when
 * they are revealed). Use it to put one-off flows (a check-in, a new entry) back to a fresh start.
 */
export function useOnReveal(fn: () => void) {
  const onReveal = useEffectEvent(fn);
  useEffect(() => {
    onReveal();
  }, []);
}
