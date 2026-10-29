"use client";

import { ArrowUpRight, Check, Plus, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { notify } from "@/lib/notify";
import { routes } from "@/lib/routes";
import { addControlItem, deleteControlItem, makeStep, setZone } from "./actions";
import { ZONES, type Zone } from "./constants";

type Item = { id: string; body: string; zone: Zone | null; goal_step_id: string | null; pending?: boolean };
type Change = { type: "add"; item: Item } | { type: "zone"; id: string; zone: Zone | null } | { type: "remove"; id: string };

export function ControlBoard({ items, goals }: { items: Item[]; goals: { id: string; title: string }[] }) {
  const reduce = useReducedMotion();
  const [, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [stepFor, setStepFor] = useState<Item | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [optimistic, apply] = useOptimistic(items, (state: Item[], c: Change) => {
    if (c.type === "add") return state.some((i) => !i.pending && i.body === c.item.body) ? state : [...state, c.item];
    if (c.type === "zone") return state.map((i) => (i.id === c.id ? { ...i, zone: c.zone } : i));
    return state.filter((i) => i.id !== c.id);
  });
  const saved = new Set(optimistic.filter((i) => !i.pending).map((i) => i.body));
  const list = optimistic.filter((i) => !i.pending || !saved.has(i.body));

  const add = () => {
    const value = text.trim();
    if (!value) return inputRef.current?.focus();
    setText("");
    startTransition(async () => {
      apply({ type: "add", item: { id: `pending-${Date.now()}`, body: value, zone: null, goal_step_id: null, pending: true } });
      const result = await addControlItem(value);
      if (!result.ok) {
        notify.error(result.error);
        setText(value);
      }
    });
    inputRef.current?.focus();
  };

  const sort = (item: Item, zone: Zone | null) =>
    startTransition(async () => {
      apply({ type: "zone", id: item.id, zone });
      const result = await setZone(item.id, zone);
      if (!result.ok) notify.error(result.error);
    });

  const remove = (item: Item) =>
    startTransition(async () => {
      apply({ type: "remove", id: item.id });
      const result = await deleteControlItem(item.id);
      if (!result.ok) notify.error(result.error);
    });

  const unsorted = list.filter((i) => !i.zone);
  const counts = Object.fromEntries(ZONES.map((z) => [z.value, list.filter((i) => i.zone === z.value).length])) as Record<Zone, number>;

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <section aria-labelledby="mind-heading" className="flex flex-col gap-5 rounded-[var(--radius-panel)] bg-raised p-5 sm:p-6 lg:col-span-7">
        <h2 id="mind-heading" className="text-[17px] font-semibold text-ink">
          What&rsquo;s on your mind?
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="flex gap-2"
        >
          <Input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="The deadline on Friday" maxLength={200} aria-label="A thought, worry or task" />
          <Button type="submit" size="icon" className="h-12 w-12 shrink-0" aria-label="Add">
            <Plus />
          </Button>
        </form>

        {unsorted.length ? (
          <ul className="flex flex-col gap-2" aria-label="Not sorted yet">
            <AnimatePresence initial={false}>
              {unsorted.map((item) => (
                <motion.li
                  key={item.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: item.pending ? 0.6 : 1, y: 0 }}
                  exit={reduce || item.pending ? undefined : { opacity: 0, scale: 0.98 }}
                  className="flex flex-col gap-3 rounded-[16px] bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[16px] text-ink">{item.body}</p>
                    <button type="button" onClick={() => remove(item)} disabled={item.pending} aria-label={`Remove: ${item.body}`} className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full text-faint hover:bg-raised hover:text-ink">
                      <X className="size-4" />
                    </button>
                  </div>
                  <div role="group" aria-label={`Sort: ${item.body}`} className="grid grid-cols-3 gap-1.5">
                    {ZONES.map((z) => (
                      <button
                        key={z.value}
                        type="button"
                        disabled={item.pending}
                        onClick={() => sort(item, z.value)}
                        className="h-10 rounded-full border border-border px-2 text-[13px] font-medium text-ink transition-[background-color,transform] hover:bg-raised active:scale-[0.97] sm:text-[14px]"
                      >
                        {z.short}
                      </button>
                    ))}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <p className="text-[15px] text-muted">
            {list.length ? "Everything is sorted. Add another thought, or act on what you control." : "Write each worry, task or thought on its own line. Short is fine."}
          </p>
        )}
      </section>

      <section aria-label="Your circles" className="flex items-center justify-center rounded-[var(--radius-panel)] bg-sand p-6 lg:col-span-5">
        <Circles counts={counts} />
      </section>

      {ZONES.map((z) => {
        const zoneItems = list.filter((i) => i.zone === z.value);
        return (
          <section key={z.value} aria-labelledby={`zone-${z.value}`} className="flex flex-col gap-4 rounded-[var(--radius-panel)] bg-raised p-5 sm:p-6 lg:col-span-4">
            <div>
              <h2 id={`zone-${z.value}`} className="text-[17px] font-semibold text-ink">
                {z.title} <span className="num font-normal text-muted">{zoneItems.length}</span>
              </h2>
              <p className="text-[14px] text-muted">{z.hint}</p>
            </div>
            {zoneItems.length ? (
              <ul className="flex flex-col gap-1.5">
                {zoneItems.map((item) => (
                  <li key={item.id} className="group flex flex-col gap-2 rounded-[14px] bg-surface px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className={cn("text-[15px]", z.value === "outside" ? "text-muted" : "text-ink")}>{item.body}</p>
                      <button type="button" onClick={() => sort(item, null)} aria-label={`Move back to unsorted: ${item.body}`} className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full text-faint hover:bg-raised hover:text-ink">
                        <X className="size-4" />
                      </button>
                    </div>
                    {z.value === "control" ? (
                      item.goal_step_id ? (
                        <p className="inline-flex items-center gap-1.5 text-[13px] font-medium text-positive">
                          <Check className="size-3.5" aria-hidden />
                          Added to your goals
                        </p>
                      ) : (
                        <button type="button" onClick={() => setStepFor(item)} disabled={item.pending} className="inline-flex items-center gap-1 self-start text-[14px] font-medium text-accent-ink hover:underline">
                          Make it a step
                          <ArrowUpRight className="size-4" aria-hidden />
                        </button>
                      )
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-[14px] border border-dashed border-control px-4 py-3 text-[14px] text-muted">Nothing here yet.</p>
            )}
          </section>
        );
      })}

      <MakeStepDialog item={stepFor} goals={goals} onClose={() => setStepFor(null)} />
    </div>
  );
}

function MakeStepDialog({ item, goals, onClose }: { item: Item | null; goals: { id: string; title: string }[]; onClose: () => void }) {
  const [goalId, setGoalId] = useState<string>("new");
  const [pending, startTransition] = useTransition();
  const save = () =>
    startTransition(async () => {
      if (!item) return;
      const result = await makeStep(item.id, goalId);
      if (!result.ok) return void notify.error(result.error);
      notify.success(result.message ?? "Added", "You'll find it in My goals.");
      onClose();
    });
  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent title="Make it a step" description={item ? `“${item.body}”` : undefined}>
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-[14px] font-medium text-ink">
            Add it to
            <Select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
              <option value="new">A new goal of its own</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Link href={routes.goals} className="self-center text-[14px] text-muted hover:text-ink">
              See my goals
            </Link>
            <Button onClick={save} loading={pending}>
              Add step
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Three rings, as in the classic circle of control, each labelled with how much sits in it. */
function Circles({ counts }: { counts: Record<Zone, number> }) {
  return (
    <svg viewBox="0 0 300 300" className="h-auto w-full max-w-[300px]" role="img" aria-label={`${counts.control} in your control, ${counts.influence} you can influence, ${counts.outside} outside your control.`}>
      <circle cx="150" cy="150" r="146" className="fill-surface" />
      <circle cx="150" cy="150" r="98" className="fill-accent-soft" />
      <circle cx="150" cy="150" r="52" className="fill-accent" />
      <text x="150" y="146" textAnchor="middle" className="num fill-on-accent text-[26px] font-semibold">
        {counts.control}
      </text>
      <text x="150" y="166" textAnchor="middle" className="fill-on-accent text-[12px] font-medium">
        I control
      </text>
      <text x="150" y="76" textAnchor="middle" className="fill-accent-ink text-[12px] font-medium">
        I influence · <tspan className="num">{counts.influence}</tspan>
      </text>
      <text x="150" y="28" textAnchor="middle" className="fill-muted text-[12px] font-medium">
        Outside my control · <tspan className="num">{counts.outside}</tspan>
      </text>
    </svg>
  );
}
