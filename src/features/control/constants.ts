import type { Database } from "@/lib/supabase/database.types";

export type Zone = Database["public"]["Enums"]["control_zone"];

export const ZONES: { value: Zone; title: string; short: string; hint: string }[] = [
  { value: "control", title: "In my control", short: "I control", hint: "Act on it. Turn it into a step." },
  { value: "influence", title: "I can influence", short: "I influence", hint: "Do your part, then let the rest unfold." },
  { value: "outside", title: "Outside my control", short: "Not mine", hint: "Notice it, then set it down." },
];
