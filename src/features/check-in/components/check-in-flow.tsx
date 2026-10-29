"use client";

import { ArrowLeft, Check, PenLine, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LiveLandscape } from "@/components/brand/live-landscape";
import { Button, buttonVariants } from "@/components/ui/button";
import { Chips } from "@/components/ui/chips";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { notify } from "@/lib/notify";
import { routes } from "@/lib/routes";
import { useOnReveal } from "@/lib/use-on-reveal";
import { saveCheckIn } from "../actions";
import { capitalise, FEELINGS, moodLabel, MOODS, SCALES, type Feeling } from "../constants";
import type { BodyNote, CheckInInput } from "../schemas";
import { BodyMap } from "./body-map";
import { LevelPicker } from "./level-picker";

export type CheckInDraft = {
  mood: number | null;
  energy: number | null;
  efficiency: number | null;
  selfSatisfaction: number | null;
  body: BodyNote[];
  feelings: Feeling[];
  note: string;
};

const STEPS = ["mood", "body", "levels", "words"] as const;
type Step = (typeof STEPS)[number];

const TITLES: Record<Step, { title: string; body: string }> = {
  mood: { title: "How are you feeling overall?", body: "Go with your first answer. There is no wrong one." },
  body: { title: "Where do you feel it in your body?", body: "Optional. Noticing the body is often the quickest way to notice a feeling." },
  levels: { title: "And the rest of you?", body: "Three quick ones. Skip any that don't fit today." },
  words: { title: "Any words for it?", body: "Pick what fits, and add a line if you like. Both optional." },
};

export function CheckInFlow({ initial, isUpdate: isUpdateProp, seed }: { initial: CheckInDraft; isUpdate: boolean; seed: number }) {
  // Fixed at open: saving refreshes the page, which would otherwise flip this mid-flow.
  const [isUpdate, setIsUpdate] = useState(isUpdateProp);
  const router = useRouter();
  const reduce = useReducedMotion();
  const [draft, setDraft] = useState<CheckInDraft>(initial);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // Every visit starts fresh from the latest saved check-in, even when Next.js kept this page.
  useOnReveal(() => {
    setDraft(initial);
    setIsUpdate(isUpdateProp);
    setIndex(0);
    setSaved(false);
  });

  const step = STEPS[index];
  const set = <K extends keyof CheckInDraft>(key: K, value: CheckInDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const go = (to: number) => {
    setDirection(to > index ? 1 : -1);
    setIndex(to);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const save = () => {
    if (!draft.mood) {
      go(0);
      notify.error("Choose how you're feeling first.");
      return;
    }
    const input: CheckInInput = { ...draft, mood: draft.mood };
    startTransition(async () => {
      const result = await saveCheckIn(input);
      if (!result.ok) {
        notify.error(result.error);
        return;
      }
      setSaved(true);
      router.prefetch(routes.today);
    });
  };

  const showLandscape = step !== "body" || saved;
  const offset = reduce ? 0 : 32;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[720px] flex-col px-4 pt-safe sm:px-8">
      <header className="flex h-[64px] items-center gap-3">
        {index > 0 && !saved ? (
          <Button variant="ghost" size="icon-sm" onClick={() => go(index - 1)} aria-label="Back" className="-ml-2">
            <ArrowLeft />
          </Button>
        ) : null}
        <div
          className="flex flex-1 gap-1.5"
          role="progressbar"
          aria-label="Check-in progress"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={saved ? STEPS.length : index + 1}
        >
          {STEPS.map((s, i) => (
            <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-active">
              <motion.span
                className="block h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: saved || i <= index ? "100%" : "0%" }}
                transition={{ duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
          ))}
        </div>
        <Link href={routes.today} aria-label="Close check-in" className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "-mr-2")}>
          <X />
        </Link>
      </header>

      <AnimatePresence initial={false}>
        {showLandscape ? (
          <motion.div
            key="landscape"
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-8">
              <LiveLandscape
                mood={draft.mood ?? 3}
                energy={draft.energy ?? 3}
                seed={seed}
                radius={14}
                className="aspect-[16/7] rounded-[24px] sm:aspect-[16/6]"
                title={draft.mood ? `A landscape for a ${moodLabel(draft.mood).toLowerCase()} day` : undefined}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main className="flex-1 pb-36">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          {saved ? (
            <motion.section
              key="saved"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-start"
              aria-live="polite"
            >
              <span className="mb-5 grid size-12 place-items-center rounded-full bg-accent-soft text-accent-ink">
                <Check className="size-6" strokeWidth={2.5} aria-hidden />
              </span>
              <h1 className="text-[28px] leading-[1.15] font-semibold tracking-[-0.02em] sm:text-[32px]">
                {isUpdate ? "Today's check-in is updated" : "Checked in for today"}
              </h1>
              <p className="mt-2 text-[17px] text-muted">
                Feeling {moodLabel(draft.mood ?? 3).toLowerCase()}
                {draft.feelings.length ? `, ${draft.feelings.slice(0, 3).join(", ")}` : ""}. Noticing it is the first step.
              </p>
              {(draft.mood ?? 3) <= 1 ? (
                <p className="mt-6 rounded-[16px] bg-sand px-5 py-4 text-[15px] text-ink">
                  Days like this are hard. If it feels like too much, support is close:{" "}
                  <Link href={routes.help} className="font-medium text-accent-ink underline underline-offset-4">
                    find someone to talk to now
                  </Link>
                  .
                </p>
              ) : null}
              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link href={`${routes.newJournalEntry}?from=check-in`} className={buttonVariants({ size: "lg" })}>
                  <PenLine aria-hidden />
                  Write about today
                </Link>
                <Link href={routes.today} className={buttonVariants({ variant: "secondary", size: "lg" })}>
                  Back to Today
                </Link>
              </div>
            </motion.section>
          ) : (
            <motion.section
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * offset }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -offset }}
              transition={{ duration: reduce ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
              aria-labelledby="step-title"
            >
              <h1 id="step-title" className="text-[26px] leading-[1.15] font-semibold tracking-[-0.02em] text-ink sm:text-[30px]">
                {TITLES[step].title}
              </h1>
              <p className="mt-2 mb-8 text-[16px] text-muted">{TITLES[step].body}</p>

              {step === "mood" ? (
                <LevelPicker
                  name="Overall mood"
                  size="lg"
                  glyph
                  value={draft.mood}
                  onChange={(v) => set("mood", v)}
                  labels={MOODS.map((m) => m.short)}
                  low="Very low"
                  high="Great"
                />
              ) : null}

              {step === "body" ? <BodyMap value={draft.body} onChange={(v) => set("body", v)} /> : null}

              {step === "levels" ? (
                <div className="flex flex-col gap-9">
                  {(Object.keys(SCALES) as (keyof typeof SCALES)[]).map((key) => (
                    <div key={key} className="flex flex-col gap-3">
                      <h2 className="text-[17px] font-medium text-ink">{SCALES[key].question}</h2>
                      <LevelPicker
                        name={SCALES[key].question}
                        value={draft[key]}
                        onChange={(v) => set(key, draft[key] === v ? null : v)}
                        low={SCALES[key].low}
                        high={SCALES[key].high}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              {step === "words" ? (
                <div className="flex flex-col gap-8">
                  <Chips
                    label="Feelings"
                    options={FEELINGS.map((f) => ({ value: f, label: capitalise(f) }))}
                    value={draft.feelings}
                    onChange={(v) => set("feelings", v)}
                  />
                  <div className="flex flex-col gap-2">
                    <label htmlFor="check-in-note" className="text-[14px] font-medium text-ink">
                      A line about today <span className="font-normal text-faint">Optional</span>
                    </label>
                    <Textarea
                      id="check-in-note"
                      value={draft.note}
                      onChange={(e) => set("note", e.target.value)}
                      maxLength={2000}
                      rows={4}
                      placeholder="What's behind how you feel?"
                      className="font-serif text-[18px]"
                    />
                  </div>
                </div>
              ) : null}
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {!saved ? (
        <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-surface pb-safe">
          <div className="mx-auto flex max-w-[720px] items-center justify-between gap-3 px-4 py-3 sm:px-8">
            <p className="num text-[14px] text-muted">
              {index + 1} of {STEPS.length}
            </p>
            <div className="flex gap-2">
              {step !== "mood" && step !== "words" ? (
                <Button variant="ghost" onClick={() => go(index + 1)}>
                  Skip
                </Button>
              ) : null}
              {step === "words" ? (
                <Button size="lg" onClick={save} loading={pending} className="min-w-36">
                  {isUpdate ? "Update check-in" : "Save check-in"}
                </Button>
              ) : (
                <Button size="lg" onClick={() => go(index + 1)} disabled={step === "mood" && !draft.mood} className="min-w-36">
                  Continue
                </Button>
              )}
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
