import type { Database } from "@/lib/supabase/database.types";

export type TrackerKind = Database["public"]["Enums"]["tracker_kind"];

/**
 * How each tracker is logged. "add" trackers sum entries through the day (glasses, minutes);
 * "set" trackers hold one value per day (hours slept, how well you ate).
 */
export const TRACKERS: {
  kind: TrackerKind;
  label: string;
  mode: "add" | "set";
  unit: (n: number) => string;
  step: number;
  max: number;
  goal?: number;
  scale?: readonly string[];
}[] = [
  { kind: "water", label: "Water", mode: "add", unit: (n) => (n === 1 ? "glass" : "glasses"), step: 1, max: 30, goal: 8 },
  { kind: "sleep", label: "Sleep", mode: "set", unit: (n) => (n === 1 ? "hour" : "hours"), step: 0.5, max: 16 },
  { kind: "movement", label: "Movement", mode: "add", unit: () => "min", step: 10, max: 600, goal: 30 },
  { kind: "meditation", label: "Stillness", mode: "add", unit: () => "min", step: 5, max: 600 },
  {
    kind: "nutrition",
    label: "Eating",
    mode: "set",
    unit: () => "",
    step: 1,
    max: 5,
    scale: ["Poorly", "Not great", "Okay", "Well", "Very well"],
  },
];

export function tracker(kind: TrackerKind) {
  return TRACKERS.find((t) => t.kind === kind)!;
}

export function formatTracker(kind: TrackerKind, value: number) {
  const t = tracker(kind);
  if (t.scale) return value ? t.scale[Math.round(value) - 1] : "–";
  const n = Number.isInteger(value) ? value : Number(value.toFixed(1));
  return `${n} ${t.unit(n)}`.trim();
}
