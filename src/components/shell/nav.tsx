"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/cn";
import { isActive, navItems } from "./nav-items";

/*
 * The current path is only known at request time on dynamic routes, so each nav renders inside
 * Suspense with an identical fallback (no item highlighted). The highlight streams in with no
 * change of layout.
 */

export function SidebarNav() {
  return (
    <Suspense fallback={<SidebarLinks pathname={null} />}>
      <SidebarWithPath />
    </Suspense>
  );
}

export function TabBar() {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface pb-safe lg:hidden">
      <Suspense fallback={<TabLinks pathname={null} />}>
        <TabsWithPath />
      </Suspense>
    </nav>
  );
}

function SidebarWithPath() {
  return <SidebarLinks pathname={usePathname()} />;
}

function TabsWithPath() {
  return <TabLinks pathname={usePathname()} />;
}

function SidebarLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {navItems.map((item) => {
        const active = pathname !== null && isActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-[12px] px-3 text-[15px] transition-colors",
              active ? "bg-active font-medium text-ink" : "text-muted hover:bg-raised hover:text-ink",
            )}
          >
            <Icon className="size-[19px]" strokeWidth={active ? 2 : 1.6} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function TabLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="mx-auto grid h-[58px] max-w-lg grid-cols-4">
      {navItems.map((item) => {
        const active = pathname !== null && isActive(item, pathname);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-full flex-col items-center justify-center gap-1 text-[11.5px] font-medium transition-colors active:scale-95",
                active ? "text-ink" : "text-faint",
              )}
            >
              <Icon className="size-[22px]" strokeWidth={active ? 2.1 : 1.6} aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
