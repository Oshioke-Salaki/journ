import { Compass, Sprout, SunMedium, UsersRound, type LucideIcon } from "lucide-react";
import { routes } from "@/lib/routes";

export type NavItem = { href: string; label: string; icon: LucideIcon; match: string[] };

/** The four destinations from the JournApp sketches, in their order. */
export const navItems: NavItem[] = [
  { href: routes.today, label: "Today", icon: SunMedium, match: ["/today", "/check-in", "/journal", "/control"] },
  { href: routes.discover, label: "Discover", icon: Compass, match: ["/discover"] },
  { href: routes.community, label: "Community", icon: UsersRound, match: ["/community"] },
  { href: routes.space, label: "My Space", icon: Sprout, match: ["/space"] },
];

export function isActive(item: NavItem, pathname: string) {
  return item.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
