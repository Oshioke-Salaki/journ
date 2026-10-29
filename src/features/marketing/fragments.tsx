import { Check } from "lucide-react";
import { Landscape } from "@/components/brand/landscape";
import { cn } from "@/lib/cn";

/** Pieces of the real interface, drawn for the welcome page (marked data-ui). */

export function CheckInFragment() {
  const levels = [
    { label: "Energy", value: 4 },
    { label: "Efficiency", value: 3 },
    { label: "Self-satisfaction", value: 4 },
  ];
  return (
    <div data-ui aria-hidden className="flex flex-col gap-5 rounded-[24px] bg-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-muted">Feeling</p>
          <p className="text-[24px] font-semibold tracking-[-0.02em] text-ink">Good</p>
        </div>
        <Landscape mood={4} energy={4} seed={5} className="w-28 rounded-[12px]" />
      </div>
      <div className="flex flex-col gap-3">
        {levels.map((l) => (
          <div key={l.label} className="flex items-center justify-between gap-4">
            <span className="text-[14px] text-ink">{l.label}</span>
            <span className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={cn("h-2 w-6 rounded-full", n <= l.value ? "bg-accent" : "bg-active")} />
              ))}
            </span>
          </div>
        ))}
      </div>
      <p className="rounded-[14px] bg-raised px-4 py-3 text-[14px] text-ink">
        <span className="text-muted">In your body: </span>tension in shoulders, calm in chest
      </p>
    </div>
  );
}

export function JournalFragment() {
  return (
    <div data-ui aria-hidden className="flex flex-col gap-4 rounded-[24px] bg-surface p-5">
      <p className="rounded-[16px] bg-sand px-4 py-3 font-serif text-[17px] leading-snug text-ink italic">
        What is one thing within your control today, and one thing you can let go of?
      </p>
      <p className="font-serif text-[18px] leading-[1.7] text-ink">
        I can control how I start the morning. A walk before opening my laptop. I can let go of the email I sent yesterday; it is done.
      </p>
      <p className="num text-[13px] text-muted">31 words · Today</p>
    </div>
  );
}

export function GoalFragment() {
  const steps = [
    { title: "Lay out walking shoes the night before", done: true },
    { title: "Walk 10 minutes before work, three days", done: true },
    { title: "Walk 20 minutes, five days", done: false },
  ];
  return (
    <div data-ui aria-hidden className="flex flex-col gap-4 rounded-[24px] bg-surface p-5">
      <div>
        <p className="text-[13px] text-muted">In progress · Body</p>
        <p className="text-[19px] font-semibold tracking-[-0.01em] text-ink">Walk every morning</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-active">
        <div className="h-full w-2/3 rounded-full bg-accent" />
      </div>
      <ul className="flex flex-col gap-1.5">
        {steps.map((s) => (
          <li key={s.title} className="flex items-center gap-3 rounded-[14px] bg-raised px-3 py-2.5">
            <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-[1.5px]", s.done ? "border-positive bg-positive text-white" : "border-control bg-surface")}>
              {s.done ? <Check className="size-3.5" strokeWidth={3} /> : null}
            </span>
            <span className={cn("text-[14px]", s.done ? "text-muted line-through" : "text-ink")}>{s.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
