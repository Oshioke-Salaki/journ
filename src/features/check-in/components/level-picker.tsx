"use client";

import { cn } from "@/lib/cn";

/**
 * Five levels as one row of buttons, with the two ends named. Arrow keys move between levels,
 * like a native radio group.
 */
export function LevelPicker({
  name,
  value,
  onChange,
  low,
  high,
  labels,
  size = "md",
  glyph = false,
}: {
  name: string;
  value: number | null;
  onChange: (value: number) => void;
  low: string;
  high: string;
  labels?: readonly string[];
  size?: "md" | "lg";
  glyph?: boolean;
}) {
  const levels = [1, 2, 3, 4, 5];
  return (
    <div className="flex flex-col gap-2.5">
      <div role="radiogroup" aria-label={name} className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {levels.map((level) => {
          const checked = value === level;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={labels?.[level - 1] ?? `${level} of 5`}
              tabIndex={checked || (value === null && level === 1) ? 0 : -1}
              onClick={() => onChange(level)}
              onKeyDown={(e) => {
                const delta = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
                if (!delta) return;
                e.preventDefault();
                const next = Math.min(5, Math.max(1, (value ?? (delta > 0 ? 0 : 6)) + delta));
                onChange(next);
                (e.currentTarget.parentElement?.children[next - 1] as HTMLElement | undefined)?.focus();
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 rounded-[16px] border font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96]",
                size === "lg" ? "h-[88px] text-[13px] sm:h-[96px] sm:text-[14px]" : "h-12 text-[15px]",
                checked
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border bg-surface text-ink hover:border-control hover:bg-raised",
              )}
            >
              {glyph ? <SunGlyph level={level} active={checked} /> : null}
              <span className={cn(!labels && "num")}>{labels ? labels[level - 1] : level}</span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[13px] text-muted" aria-hidden>
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

/** A sun at the height of the level over a horizon: the landscape's own language, at icon size. */
function SunGlyph({ level, active }: { level: number; active: boolean }) {
  const cy = 19 - (level - 1) * 3.2;
  return (
    <svg viewBox="0 0 28 24" className="h-6 w-7" aria-hidden>
      <circle cx="14" cy={cy} r="4" className={active ? "fill-current" : "fill-accent"} />
      <path d="M2 22 L10 16 L15 20 L20 15 L26 21 V24 H2 Z" className={active ? "fill-current opacity-40" : "fill-sage opacity-70"} />
    </svg>
  );
}
