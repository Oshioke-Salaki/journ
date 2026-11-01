import { areaLabel } from "@/features/check-in/constants";
import { routes } from "@/lib/routes";

/**
 * What to offer after a check-in, from what she noticed. Plain rules, no AI: tension or worry
 * suggests a breathing practice, overwhelm the circle of control, low energy gentle movement, and
 * the mood sets the writing prompt. At most three, most specific first.
 */

export type SuggestionVideo = { id: string; title: string; topic_slug: string | null; tier: "free" | "premium" };
export type SuggestionCheckIn = { mood: number; energy: number | null; body: { area: string; sensation: string | null }[]; feelings: string[] };
export type Suggestion = { key: string; reason: string; title: string; href: string; cta: string };

const TENSE = new Set(["tension", "restless", "ache", "heaviness"]);
const WORRIED = new Set(["anxious", "overwhelmed", "irritable"]);

export function suggestionsFor(checkIn: SuggestionCheckIn, videos: SuggestionVideo[], premium: boolean): Suggestion[] {
  const out: Suggestion[] = [];
  const pick = (topic: string, prefer?: RegExp) => {
    const open = videos.filter((v) => v.topic_slug === topic && (premium || v.tier === "free"));
    return open.find((v) => prefer?.test(v.title)) ?? open[0] ?? null;
  };

  const tense = checkIn.body.filter((n) => n.sensation && TENSE.has(n.sensation));
  const worried = checkIn.feelings.filter((f) => WORRIED.has(f));

  if (tense.length || worried.length) {
    const video = pick("breathing");
    if (video) {
      const where = tense.length ? `the ${tense[0].sensation} in your ${areaLabel(tense[0].area).toLowerCase()}` : `feeling ${worried[0]}`;
      out.push({ key: "breathe", reason: `For ${where}`, title: video.title, href: routes.video(video.id), cta: "Start practice" });
    }
  }

  if (checkIn.feelings.includes("overwhelmed") || checkIn.feelings.includes("anxious")) {
    out.push({
      key: "control",
      reason: "When everything feels urgent",
      title: "Sort what's on your mind into what you can and can't control",
      href: routes.control,
      cta: "Open my circle",
    });
  }

  if (checkIn.energy !== null && checkIn.energy <= 2) {
    const video = pick("movement", /low-energy|gentle/i);
    if (video) out.push({ key: "move", reason: "For a low-energy day", title: video.title, href: routes.video(video.id), cta: "Watch" });
  }

  const hard = checkIn.mood <= 2 || checkIn.feelings.includes("sad") || checkIn.feelings.includes("lonely");
  const good = checkIn.mood >= 4 || checkIn.feelings.includes("grateful") || checkIn.feelings.includes("proud");
  if (hard) {
    out.push({ key: "write", reason: "A gentle prompt", title: "What would help, even a little, right now?", href: `${routes.newJournalEntry}?from=hard-day`, cta: "Write" });
  } else if (good) {
    out.push({ key: "write", reason: "Keep hold of it", title: "What went well today, and what part did you play in it?", href: `${routes.newJournalEntry}?from=good-day`, cta: "Write" });
  } else {
    out.push({ key: "write", reason: "A prompt for today", title: "What's behind how you feel today?", href: `${routes.newJournalEntry}?from=check-in`, cta: "Write" });
  }

  return out.slice(0, 3);
}

/** The opening line in the editor for each place a new entry can start from. */
export const WRITING_STARTS: Record<string, string> = {
  "check-in": "What's behind how you feel today?",
  "hard-day": "What would help, even a little, right now?",
  "good-day": "What went well today, and what part did you play in it?",
};
