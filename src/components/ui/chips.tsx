"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type Option<T extends string> = { value: T; label: string };

const chipClass = (selected: boolean) =>
  cn(
    "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[15px] transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97]",
    selected
      ? "border-primary bg-primary text-on-primary"
      : "border-border bg-surface text-ink hover:border-control hover:bg-raised",
  );

/** Toggle chips. Multiple choice by default; pass `single` for one-of. Keyboard: Tab, then Space. */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  single = false,
  label,
  className,
  max,
}: {
  options: readonly Option<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  single?: boolean;
  label: string;
  className?: string;
  max?: number;
}) {
  const toggle = (option: T) => {
    const selected = value.includes(option);
    if (single) return onChange(selected ? [] : [option]);
    if (selected) return onChange(value.filter((v) => v !== option));
    if (max && value.length >= max) return;
    onChange([...value, option]);
  };

  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(option.value)}
            className={chipClass(selected)}
          >
            {selected && !single ? <Check className="-ml-1 size-4" strokeWidth={2.5} aria-hidden /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
