"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False during server render and hydration, true once React is in control of the page. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
