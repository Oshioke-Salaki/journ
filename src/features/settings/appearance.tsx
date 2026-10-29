"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { THEME_STORAGE_KEY, type ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "Match device", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function readTheme(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

/** Applies instantly and is remembered on this device. */
export function Appearance() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as const);

  const choose = (value: ThemePreference) => {
    const root = document.documentElement;
    try {
      if (value === "system") {
        localStorage.removeItem(THEME_STORAGE_KEY);
        root.removeAttribute("data-theme");
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, value);
        root.setAttribute("data-theme", value);
      }
    } catch {
      if (value === "system") root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", value);
    }
    for (const listener of listeners) listener();
  };

  return (
    <div role="radiogroup" aria-label="Appearance" className="grid grid-cols-3 gap-2">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const checked = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => choose(value)}
            className={cn(
              "flex h-20 flex-col items-center justify-center gap-2 rounded-[16px] border text-[14px] font-medium transition-[background-color,border-color,transform] active:scale-[0.97]",
              checked ? "border-primary bg-primary text-on-primary" : "border-border bg-surface text-ink hover:bg-raised",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
