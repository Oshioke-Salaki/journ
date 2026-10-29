"use client";

import { Check, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { formatDate, relativeDay } from "@/lib/dates";
import { notify } from "@/lib/notify";
import { addStep, deleteStep, toggleStep } from "../actions";

type StepView = { id: string; title: string; due_date: string | null; done_at: string | null; pending?: boolean };

type Change =
  | { type: "toggle"; id: string; done: boolean }
  | { type: "add"; step: StepView }
  | { type: "remove"; id: string };

export function StepList({ goalId, steps, today, editable = true }: { goalId: string; steps: StepView[]; today: string; editable?: boolean }) {
  const reduce = useReducedMotion();
  const [, startTransition] = useTransition();
  const [optimistic, apply] = useOptimistic(steps, (state: StepView[], change: Change) => {
    if (change.type === "toggle") return state.map((s) => (s.id === change.id ? { ...s, done_at: change.done ? new Date().toISOString() : null } : s));
    // Once the saved step arrives from the server, the placeholder for it goes.
    if (change.type === "add") return state.some((s) => !s.pending && s.title === change.step.title) ? state : [...state, change.step];
    return state.filter((s) => s.id !== change.id);
  });
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = (step: StepView) =>
    startTransition(async () => {
      const done = !step.done_at;
      apply({ type: "toggle", id: step.id, done });
      const result = await toggleStep(step.id, done);
      if (!result.ok) notify.error(result.error);
    });

  const remove = (step: StepView) =>
    startTransition(async () => {
      apply({ type: "remove", id: step.id });
      const result = await deleteStep(step.id);
      if (!result.ok) notify.error(result.error);
    });

  const add = () => {
    const value = title.trim();
    if (!value) return inputRef.current?.focus();
    const date = dueDate;
    setTitle("");
    setDueDate("");
    startTransition(async () => {
      apply({ type: "add", step: { id: `pending-${Date.now()}`, title: value, due_date: date || null, done_at: null, pending: true } });
      const result = await addStep(goalId, { title: value, dueDate: date });
      if (!result.ok) {
        notify.error(result.error);
        setTitle(value);
        setDueDate(date);
      }
    });
    inputRef.current?.focus();
  };

  // A placeholder disappears the moment its saved step is in the list, so nothing shows twice.
  const saved = new Set(optimistic.filter((s) => !s.pending).map((s) => s.title));
  const visible = optimistic.filter((s) => !s.pending || !saved.has(s.title));
  const done = visible.filter((s) => s.done_at).length;

  return (
    <div className="flex flex-col gap-4">
      {editable ? (
        <p className="num text-[14px] text-muted" aria-live="polite">
          {visible.length ? `${done} of ${visible.length} steps done` : "No steps yet"}
        </p>
      ) : null}
      {visible.length ? (
        <ul className="flex flex-col gap-1.5">
          <AnimatePresence initial={false}>
            {visible.map((step) => {
              const isDone = Boolean(step.done_at);
              const overdue = !isDone && step.due_date && step.due_date < today;
              return (
                <motion.li
                  key={step.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: step.pending ? 0.6 : 1, y: 0 }}
                  // A placeholder leaves instantly when its saved step replaces it; a removed step fades.
                  exit={reduce || step.pending ? undefined : { opacity: 0, height: 0 }}
                  className="group flex items-center gap-3 rounded-[16px] bg-raised px-3 py-2.5"
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isDone}
                    aria-label={`${isDone ? "Mark not done" : "Mark done"}: ${step.title}`}
                    disabled={step.pending}
                    onClick={() => toggle(step)}
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border-[1.5px] transition-[background-color,border-color,transform] duration-200 active:scale-90",
                      isDone ? "border-positive bg-positive text-white" : "border-control bg-surface hover:border-ink",
                    )}
                  >
                    <motion.span initial={false} animate={{ scale: isDone ? 1 : 0, opacity: isDone ? 1 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}>
                      <Check className="size-4" strokeWidth={3} aria-hidden />
                    </motion.span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[15px] transition-colors", isDone ? "text-muted line-through decoration-muted/60" : "text-ink")}>{step.title}</p>
                    {step.due_date ? (
                      <p className={cn("text-[13px]", overdue ? "font-medium text-negative" : "text-muted")}>
                        {overdue ? `Was due ${formatDate(step.due_date, { day: "numeric", month: "short" })}` : relativeDay(step.due_date, today)}
                      </p>
                    ) : null}
                  </div>
                  {editable && !step.pending ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => remove(step)}
                      aria-label={`Remove step: ${step.title}`}
                      className="text-faint opacity-100 hover:text-negative sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    >
                      <Trash2 />
                    </Button>
                  ) : null}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      ) : null}
      {editable ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <Input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a step" aria-label="New step" maxLength={160} className="flex-1" />
          <div className="flex gap-2">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Date for the new step" className="sm:w-[170px]" />
            <Button type="submit" variant="secondary" size="icon" aria-label="Add step" className="h-12 w-12 shrink-0">
              <Plus />
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
