"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Spinner } from "@/components/ui/spinner";

/** Searches as you type (after a short pause), keeping the query in the URL. */
export function JournalSearch({ initial }: { initial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const update = (next: string) => {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const q = next.trim();
      startTransition(() => router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false }));
    }, 280);
  };

  return (
    <div className="relative mb-8">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-faint" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder="Search your journal"
        aria-label="Search your journal"
        className="h-12 w-full rounded-full border border-border bg-surface pr-12 pl-11 text-[16px] text-ink placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      <span className="absolute top-1/2 right-2 -translate-y-1/2">
        {pending ? (
          <span className="grid size-9 place-items-center text-muted">
            <Spinner className="size-4" label="Searching" />
          </span>
        ) : value ? (
          <button type="button" onClick={() => update("")} aria-label="Clear search" className="grid size-9 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink">
            <X className="size-4" />
          </button>
        ) : null}
      </span>
    </div>
  );
}
