/** Route map. Import paths from here instead of typing strings in components. */
export const routes = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  onboarding: "/onboarding",
  today: "/today",
  checkIn: "/check-in",
  control: "/control",
  help: "/help",
  vision: "/space/vision",
  admin: "/admin",
  journal: "/journal",
  newJournalEntry: "/journal/new",
  journalEntry: (id: string) => `/journal/${id}`,
  discover: "/discover",
  video: (id: string) => `/discover/${id}`,
  community: "/community",
  topic: (slug: string) => `/community/${slug}`,
  space: "/space",
  goals: "/space/goals",
  newGoal: "/space/goals/new",
  goal: (id: string) => `/space/goals/${id}`,
  settings: "/settings",
  privacy: "/privacy",
  terms: "/terms",
} as const;

/** Paths only a signed-in member may open. The proxy redirects everyone else to sign in. */
export const PROTECTED_PREFIXES = [
  "/today",
  "/check-in",
  "/control",
  "/admin",
  "/journal",
  "/discover",
  "/community",
  "/space",
  "/settings",
  "/onboarding",
] as const;

/** Paths a signed-in member has no reason to see; they are sent to Today instead. */
export const GUEST_ONLY_PATHS = ["/", "/sign-in", "/sign-up", "/forgot-password"] as const;

export function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Only same-site relative paths are accepted as a post-sign-in destination. */
export function safeNextPath(next: string | null | undefined, fallback: string = routes.today) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
