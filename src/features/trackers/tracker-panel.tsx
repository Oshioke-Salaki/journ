"use client";

import { Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { notify } from "@/lib/notify";
import { setTracker } from "./actions";
import { formatTracker, TRACKERS, type TrackerKind } from "./constants";
import type { TrackerTotals } from "./queries";

/**
 * "Other things to track". Every tap updates the number at once; the save happens once the member
 * stops tapping, and a failed save puts the last saved value back.
 */
export function TrackerPanel({ initial }: { initial: TrackerTotals }) {
  const [values, setValues] = useState<TrackerTotals>(initial);
  const [saving, setSaving] = useState(0);
  const [waiting, setWaiting] = useState(0);
  const saved = useRef<TrackerTotals>(initial);
  const queued = useRef<Partial<Record<TrackerKind, number>>>({});
  const timers = useRef<Partial<Record<TrackerKind, ReturnType<typeof setTimeout>>>>({});

  const save = useCallback(async (kind: TrackerKind) => {
    const timer = timers.current[kind];
    if (timer) clearTimeout(timer);
    delete timers.current[kind];
    const value = queued.current[kind];
    if (value === undefined) return;
    delete queued.current[kind];
    setWaiting((n) => n - 1);
    setSaving((n) => n + 1);
    const result = await setTracker({ kind, value });
    setSaving((n) => n - 1);
    if (result.ok) {
      saved.current = { ...saved.current, [kind]: result.data.value };
    } else {
      notify.error(result.error);
      setValues((v) => ({ ...v, [kind]: saved.current[kind] ?? 0 }));
    }
  }, []);

  // Leaving the page or switching apps saves straight away, so no tap is ever lost.
  useEffect(() => {
    const flush = () => (Object.keys(queued.current) as TrackerKind[]).forEach((k) => void save(k));
    const onVisibility = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, [save]);

  const change = (kind: TrackerKind, value: number) => {
    setValues((v) => ({ ...v, [kind]: value }));
    if (queued.current[kind] === undefined) setWaiting((n) => n + 1);
    queued.current[kind] = value;
    const existing = timers.current[kind];
    if (existing) clearTimeout(existing);
    timers.current[kind] = setTimeout(() => void save(kind), 500);
  };

  return (
    <ul className="flex flex-col divide-y divide-rule" aria-busy={saving > 0 || waiting > 0}>
      {TRACKERS.map((t) => {
        const value = values[t.kind] ?? 0;
        return (
          <li key={t.kind} className="flex min-h-[60px] items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-[15px] font-medium text-ink">{t.label}</p>
              <p className="num text-[14px] text-muted" aria-live="polite">
                {t.scale ? (value ? t.scale[value - 1] : "Not logged") : formatTracker(t.kind, value)}
                {t.goal && !t.scale ? <span className="text-faint"> of {t.goal}</span> : null}
              </p>
            </div>
            {t.scale ? (
              <div role="radiogroup" aria-label={`${t.label} today`} className="flex gap-1">
                {t.scale.map((label, i) => {
                  const level = i + 1;
                  const on = value === level;
                  return (
                    <button
                      key={label}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={label}
                      title={label}
                      onClick={() => change(t.kind, on ? 0 : level)}
                      className={cn(
                        "size-9 rounded-full border text-[13px] font-medium transition-[background-color,border-color,transform] active:scale-90",
                        on ? "border-primary bg-primary text-on-primary" : level <= value ? "border-accent/40 bg-accent-soft text-accent-ink" : "border-border bg-surface text-muted hover:bg-raised",
                      )}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <StepButton label={`Less ${t.label.toLowerCase()}`} disabled={value <= 0} onClick={() => change(t.kind, Math.max(0, value - t.step))}>
                  <Minus />
                </StepButton>
                <span className="num w-10 text-center text-[17px] text-ink" aria-hidden>
                  {Number.isInteger(value) ? value : value.toFixed(1)}
                </span>
                <StepButton label={`More ${t.label.toLowerCase()}`} disabled={value >= t.max} onClick={() => change(t.kind, Math.min(t.max, value + t.step))}>
                  <Plus />
                </StepButton>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function StepButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-9 place-items-center rounded-full bg-surface text-ink transition-[background-color,transform] hover:bg-active active:scale-90 disabled:opacity-40 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}
