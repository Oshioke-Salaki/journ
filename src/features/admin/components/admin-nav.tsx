"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/videos", label: "Videos" },
  { href: "/admin/quotes", label: "Quotes" },
  { href: "/admin/prompts", label: "Prompts" },
  { href: "/admin/topics", label: "Topics" },
];

export function AdminNav() {
  return (
    <Suspense fallback={<Links pathname={null} />}>
      <WithPath />
    </Suspense>
  );
}

function WithPath() {
  return <Links pathname={usePathname()} />;
}

function Links({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Admin" className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {ITEMS.map((item) => {
        const active = pathname !== null && (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "h-9 shrink-0 rounded-full px-4 text-[14px] leading-9 font-medium transition-colors",
              active ? "bg-active text-ink" : "text-muted hover:bg-raised hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
