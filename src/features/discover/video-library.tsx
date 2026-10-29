"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Landscape } from "@/components/brand/landscape";
import { cn } from "@/lib/cn";

type Item = { id: string; topic: string | null; node: React.ReactNode };

/** Filters the library by topic in place, with no round trip, and keeps the choice in the URL. */
export function VideoLibrary({ items, topics, initialTopic }: { items: Item[]; topics: { slug: string; title: string }[]; initialTopic: string | null }) {
  const reduce = useReducedMotion();
  const [topic, setTopic] = useState<string | null>(initialTopic);
  const visible = topic ? items.filter((i) => i.topic === topic) : items;

  const choose = (slug: string | null) => {
    setTopic(slug);
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("topic", slug);
    else url.searchParams.delete("topic");
    window.history.replaceState(null, "", url);
  };

  const options = [{ slug: null, title: "All" }, ...topics];

  return (
    <div className="flex flex-col gap-8">
      <div role="tablist" aria-label="Topics" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {options.map((o) => {
          const selected = topic === o.slug;
          return (
            <button
              key={o.slug ?? "all"}
              role="tab"
              aria-selected={selected}
              onClick={() => choose(o.slug)}
              className={cn(
                "h-10 shrink-0 rounded-full px-4 text-[15px] font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.97]",
                selected ? "bg-primary text-on-primary" : "bg-raised text-ink hover:bg-active",
              )}
            >
              {o.title}
            </button>
          );
        })}
      </div>
      <p className="num -mt-4 text-[14px] text-muted" aria-live="polite">
        {visible.length === 1 ? "1 video" : `${visible.length} videos`}
      </p>
      {visible.length === 0 ? (
        <div className="grid items-center gap-6 rounded-[var(--radius-panel)] bg-raised p-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,240px)] sm:p-8">
          <div className="flex flex-col items-start gap-3">
            <h2 className="text-[19px] font-semibold tracking-[-0.01em] text-ink">
              {items.length ? `No ${options.find((o) => o.slug === topic)?.title.toLowerCase()} videos yet` : "Videos are on their way"}
            </h2>
            <p className="text-[15px] text-muted">
              {items.length
                ? "New lessons and practices are being recorded. Explore another topic in the meantime."
                : "The first lessons, practices and coaching sessions are being recorded. They will appear here as soon as they are ready."}
            </p>
            {items.length ? (
              <button type="button" onClick={() => choose(null)} className="rounded-full bg-surface px-4 py-2 text-[14px] font-medium text-ink hover:bg-active">
                Show all videos
              </button>
            ) : null}
          </div>
          <Landscape mood={3} energy={3} seed={9} radius={14} className="rounded-[18px]" />
        </div>
      ) : null}
      <ul className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((item) => (
            <motion.li
              key={item.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {item.node}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
