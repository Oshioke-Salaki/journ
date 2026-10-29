"use client";

import Link from "next/link";
import { useState } from "react";
import { LiveLandscape } from "@/components/brand/live-landscape";
import { MOODS } from "@/features/check-in/constants";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

/** Start a check-in with one tap: choosing a mood opens the check-in with it already set. */
export function QuickMood({ seed }: { seed: number }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-6">
      <LiveLandscape mood={hover ?? 3} energy={3} seed={seed} radius={14} className="aspect-[16/7] rounded-[18px]" />
      <div className="flex flex-col gap-3">
        <h2 className="text-[20px] leading-snug font-semibold tracking-[-0.01em] text-ink sm:text-[22px]">How are you feeling right now?</h2>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2" onMouseLeave={() => setHover(null)}>
          {MOODS.map((m) => (
            <Link
              key={m.value}
              href={`${routes.checkIn}?mood=${m.value}`}
              onMouseEnter={() => setHover(m.value)}
              onFocus={() => setHover(m.value)}
              onBlur={() => setHover(null)}
              className={cn(
                "flex h-14 items-center justify-center rounded-[14px] border border-border bg-surface px-1 text-center text-[13px] font-medium text-ink sm:text-[14px]",
                "transition-[background-color,border-color,transform] duration-150 hover:border-control hover:bg-raised active:scale-[0.96]",
              )}
            >
              {m.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
