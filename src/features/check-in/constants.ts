/** The words of the check-in. Order matters: index 0 is the lowest value (1). */

export const MOODS = [
  { value: 1, label: "Very low", short: "Very low" },
  { value: 2, label: "Low", short: "Low" },
  { value: 3, label: "Okay", short: "Okay" },
  { value: 4, label: "Good", short: "Good" },
  { value: 5, label: "Great", short: "Great" },
] as const;

export const SCALES = {
  energy: { question: "How is your energy?", low: "Drained", high: "Full of energy" },
  efficiency: { question: "How efficient do you feel?", low: "Scattered", high: "Focused" },
  selfSatisfaction: { question: "How do you feel about yourself today?", low: "Hard on myself", high: "Proud of myself" },
} as const;

export type ScaleKey = keyof typeof SCALES;

export const BODY_AREAS = [
  { id: "head", label: "Head" },
  { id: "jaw", label: "Jaw" },
  { id: "throat", label: "Throat" },
  { id: "shoulders", label: "Shoulders" },
  { id: "chest", label: "Chest" },
  { id: "stomach", label: "Stomach" },
  { id: "arms", label: "Arms" },
  { id: "hands", label: "Hands" },
  { id: "upper-back", label: "Upper back" },
  { id: "lower-back", label: "Lower back" },
  { id: "hips", label: "Hips" },
  { id: "legs", label: "Legs" },
  { id: "feet", label: "Feet" },
] as const;

export type BodyAreaId = (typeof BODY_AREAS)[number]["id"];
export const BODY_AREA_IDS = BODY_AREAS.map((a) => a.id) as [BodyAreaId, ...BodyAreaId[]];

export const SENSATIONS = [
  { id: "tension", label: "Tension" },
  { id: "ache", label: "Ache" },
  { id: "heaviness", label: "Heaviness" },
  { id: "restless", label: "Restless" },
  { id: "warmth", label: "Warmth" },
  { id: "lightness", label: "Lightness" },
  { id: "calm", label: "Calm" },
] as const;

export type SensationId = (typeof SENSATIONS)[number]["id"];
export const SENSATION_IDS = SENSATIONS.map((s) => s.id) as [SensationId, ...SensationId[]];

export const FEELINGS = [
  "calm",
  "grateful",
  "hopeful",
  "content",
  "motivated",
  "proud",
  "tired",
  "anxious",
  "overwhelmed",
  "irritable",
  "sad",
  "lonely",
] as const;

export type Feeling = (typeof FEELINGS)[number];

export function moodLabel(mood: number) {
  return MOODS.find((m) => m.value === mood)?.label ?? "Not set";
}

export function areaLabel(id: string) {
  return BODY_AREAS.find((a) => a.id === id)?.label ?? id;
}

export function sensationLabel(id: string) {
  return SENSATIONS.find((s) => s.id === id)?.label ?? id;
}

export function capitalise(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
