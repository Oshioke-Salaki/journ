export const GOAL_AREAS = [
  { value: "body", label: "Body" },
  { value: "mind", label: "Mind" },
  { value: "relationships", label: "Relationships" },
  { value: "work", label: "Work" },
  { value: "growth", label: "Growth" },
  { value: "other", label: "Something else" },
] as const;

export type GoalArea = (typeof GOAL_AREAS)[number]["value"];

export const GOAL_STATUS_LABEL = { active: "In progress", achieved: "Achieved", paused: "Paused" } as const;

export function areaName(area: string) {
  return GOAL_AREAS.find((a) => a.value === area)?.label ?? area;
}
