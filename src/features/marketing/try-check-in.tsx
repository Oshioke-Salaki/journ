"use client";

import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { LiveLandscape } from "@/components/brand/live-landscape";
import { MOODS } from "@/features/check-in/constants";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

const PROMPTS: Record<number, string> = {
  1: "What would make the next hour a little easier?",
  2: "What is weighing on you, and which part of it can you act on?",
  3: "What is one small thing within your control today?",
  4: "What is helping today? How could you keep it going?",
  5: "What made today good, and can you do it again tomorrow?",
};

/** The page's live element: a real first check-in, with the landscape and a prompt answering it. */
export function TryCheckIn() {
  const reduce = useReducedMotion();
  const [mood, setMood] = useState<number | null>(null);

  return (
    <div data-ui className="flex flex-col gap-5 rounded-[28px] bg-surface p-4 shadow-[0_1px_0_var(--rule)] sm:p-5">
      <LiveLandscape mood={mood ?? 3} energy={mood ? Math.max(2, mood) : 3} seed={11} radius={16} className="aspect-[16/9] rounded-[20px]" title={mood ? `A landscape for feeling ${MOODS[mood - 1].label.toLowerCase()}` : "A landscape at dawn"} />
      <div className="flex flex-col gap-3 px-1">
        <p className="text-[17px] font-semibold text-ink">How are you feeling right now?</p>
        <div role="radiogroup" aria-label="How are you feeling right now?" className="grid grid-cols-5 gap-1.5">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={mood === m.value}
              onClick={() => setMood(m.value)}
              className={cn(
                "h-12 rounded-[14px] border px-1 text-[13px] font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96] sm:text-[14px]",
                mood === m.value ? "border-primary bg-primary text-on-primary" : "border-border bg-surface text-ink hover:bg-raised",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="min-h-[88px]" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {mood ? (
              <motion.div
                key={mood}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-3 pt-2"
              >
                <p className="font-serif text-[20px] leading-snug text-ink">{PROMPTS[mood]}</p>
                <Link href={routes.signUp} className="inline-flex items-center gap-1.5 text-[15px] font-medium text-accent-ink hover:underline">
                  Keep this in your own journal
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </motion.div>
            ) : (
              <motion.p key="hint" initial={false} className="pt-2 text-[15px] text-muted">
                Choose one. The landscape answers, and so does a question to write about.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
