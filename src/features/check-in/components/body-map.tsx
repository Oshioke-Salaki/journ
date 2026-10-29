"use client";

import { motion, useReducedMotion } from "motion/react";
import type { KeyboardEvent, ReactNode } from "react";
import { Chips } from "@/components/ui/chips";
import { cn } from "@/lib/cn";
import { areaLabel, BODY_AREAS, SENSATIONS, type BodyAreaId, type SensationId } from "../constants";
import type { BodyNote } from "../schemas";

/**
 * "Where in my body": a figure made of soft shapes, one per area. Tap an area to mark it, then
 * say what it feels like. The back areas, which a front view cannot show, are chips beside it.
 */

type Shape = { area: BodyAreaId; node: (props: { className: string }) => ReactNode };

const SHAPES: Shape[] = [
  { area: "head", node: (p) => <ellipse cx="100" cy="36" rx="25" ry="25" {...p} /> },
  { area: "jaw", node: (p) => <path d="M80 56 Q100 80 120 56 Q112 70 100 71 Q88 70 80 56 Z" {...p} /> },
  { area: "throat", node: (p) => <rect x="90" y="74" width="20" height="18" rx="8" {...p} /> },
  { area: "shoulders", node: (p) => <ellipse cx="62" cy="104" rx="24" ry="12" {...p} /> },
  { area: "shoulders", node: (p) => <ellipse cx="138" cy="104" rx="24" ry="12" {...p} /> },
  { area: "chest", node: (p) => <rect x="72" y="98" width="56" height="58" rx="22" {...p} /> },
  { area: "stomach", node: (p) => <rect x="75" y="160" width="50" height="48" rx="20" {...p} /> },
  { area: "arms", node: (p) => <rect x="30" y="120" width="21" height="104" rx="10.5" transform="rotate(6 40 172)" {...p} /> },
  { area: "arms", node: (p) => <rect x="149" y="120" width="21" height="104" rx="10.5" transform="rotate(-6 160 172)" {...p} /> },
  { area: "hands", node: (p) => <ellipse cx="37" cy="240" rx="12" ry="14" {...p} /> },
  { area: "hands", node: (p) => <ellipse cx="163" cy="240" rx="12" ry="14" {...p} /> },
  { area: "hips", node: (p) => <rect x="70" y="212" width="60" height="38" rx="19" {...p} /> },
  { area: "legs", node: (p) => <rect x="73" y="254" width="25" height="112" rx="12.5" {...p} /> },
  { area: "legs", node: (p) => <rect x="102" y="254" width="25" height="112" rx="12.5" {...p} /> },
  { area: "feet", node: (p) => <ellipse cx="84" cy="378" rx="15" ry="8" {...p} /> },
  { area: "feet", node: (p) => <ellipse cx="116" cy="378" rx="15" ry="8" {...p} /> },
];

const BACK_AREAS = BODY_AREAS.filter((a) => a.id === "upper-back" || a.id === "lower-back");

export function BodyMap({ value, onChange }: { value: BodyNote[]; onChange: (value: BodyNote[]) => void }) {
  const reduce = useReducedMotion();
  const selected = new Set(value.map((n) => n.area));

  const toggle = (area: BodyAreaId) => {
    if (selected.has(area)) onChange(value.filter((n) => n.area !== area));
    else onChange([...value, { area, sensation: null }]);
  };
  const setSensation = (area: BodyAreaId, sensation: SensationId | null) =>
    onChange(value.map((n) => (n.area === area ? { ...n, sensation } : n)));

  const onKey = (e: KeyboardEvent, area: BodyAreaId) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(area);
    }
  };

  // One focusable element per area, even when an area is drawn as two shapes.
  const firstOfArea = new Set<number>();
  const seen = new Set<string>();
  SHAPES.forEach((s, i) => {
    if (!seen.has(s.area)) {
      seen.add(s.area);
      firstOfArea.add(i);
    }
  });

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] md:items-start">
      <div className="mx-auto w-full max-w-[220px] md:max-w-none">
        <svg viewBox="0 0 200 400" className="h-auto w-full" role="group" aria-label="Body map. Choose the areas where you notice something.">
          {SHAPES.map((shape, i) => {
            const on = selected.has(shape.area);
            const focusable = firstOfArea.has(i);
            return (
              <g
                key={i}
                role={focusable ? "checkbox" : undefined}
                aria-checked={focusable ? on : undefined}
                aria-label={focusable ? areaLabel(shape.area) : undefined}
                aria-hidden={focusable ? undefined : true}
                tabIndex={focusable ? 0 : -1}
                onClick={() => toggle(shape.area)}
                onKeyDown={(e) => onKey(e, shape.area)}
                className="group cursor-pointer outline-none"
              >
                <motion.g
                  initial={false}
                  animate={{ scale: on && !reduce ? 1.04 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                >
                  {shape.node({
                    className: cn(
                      "transition-[fill,stroke] duration-200",
                      on
                        ? "fill-accent stroke-accent-ink [stroke-width:1.5]"
                        : "fill-sand stroke-transparent group-hover:fill-active group-focus-visible:stroke-focus [stroke-width:2]",
                    ),
                  })}
                </motion.g>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-[14px] font-medium text-ink">Back</p>
          <Chips
            label="Back"
            options={BACK_AREAS.map((a) => ({ value: a.id, label: a.label }))}
            value={BACK_AREAS.filter((a) => selected.has(a.id)).map((a) => a.id)}
            onChange={(next) => {
              for (const a of BACK_AREAS) {
                const want = (next as string[]).includes(a.id);
                if (want !== selected.has(a.id)) toggle(a.id);
              }
            }}
          />
        </div>

        {value.length === 0 ? (
          <p className="text-[15px] text-muted">
            Tap the places where you notice something: tension, an ache, warmth, ease. Or skip this if nothing stands out.
          </p>
        ) : (
          <ul className="flex flex-col gap-5" aria-label="What each area feels like">
            {value.map((note) => (
              <motion.li
                key={note.area}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-medium text-ink">{areaLabel(note.area)}</p>
                  <button
                    type="button"
                    onClick={() => toggle(note.area)}
                    className="text-[14px] text-muted hover:text-ink"
                    aria-label={`Remove ${areaLabel(note.area)}`}
                  >
                    Remove
                  </button>
                </div>
                <Chips
                  single
                  label={`What your ${areaLabel(note.area).toLowerCase()} feels like`}
                  options={SENSATIONS.map((s) => ({ value: s.id, label: s.label }))}
                  value={note.sensation ? [note.sensation] : []}
                  onChange={(v) => setSensation(note.area, (v[0] as SensationId | undefined) ?? null)}
                  className="gap-1.5 [&>button]:h-9 [&>button]:px-3.5 [&>button]:text-[14px]"
                />
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
