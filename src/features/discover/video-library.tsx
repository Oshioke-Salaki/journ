"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Search, X } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Landscape } from "@/components/brand/landscape";
import { cn } from "@/lib/cn";

type Item = { id: string; topic: string | null; text: string; node: React.ReactNode };

const SAVED = "saved";

/** Filters the library by topic, saved videos or words, in place with no round trip; the topic is kept in the URL. */
export function VideoLibrary({
  items,
  topics,
  initialTopic,
  saved,
}: {
  items: Item[];
  topics: { slug: string; title: string }[];
  initialTopic: string | null;
  saved: string[];
}) {
  const reduce = useReducedMotion();
  const [topic, setTopic] = useState<string | null>(initialTopic);
  const [query, setQuery] = useState("");
  const words = useDeferredValue(query).toLowerCase().split(/\s+/).filter(Boolean);
  const inTopic = topic === SAVED ? saved.flatMap((id) => items.find((i) => i.id === id) ?? []) : topic ? items.filter((i) => i.topic === topic) : items;
  const visible = words.length ? inTopic.filter((i) => words.every((w) => i.text.includes(w))) : inTopic;

  const choose = (slug: string | null) => {
    setTopic(slug);
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("topic", slug);
    else url.searchParams.delete("topic");
    window.history.replaceState(null, "", url);
  };

  const options = [{ slug: null, title: "All" }, { slug: SAVED, title: saved.length ? `Saved ${saved.length}` : "Saved" }, ...topics];
  const topicName = topic === SAVED ? "saved" : options.find((o) => o.slug === topic)?.title.toLowerCase();

  return (
    <div className="flex flex-col gap-8">
      <div className="relative max-w-[420px]">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-faint" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search videos"
          aria-label="Search videos"
          className="h-12 w-full rounded-full border border-border bg-surface pr-12 pl-11 text-[16px] text-ink placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
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
              {!items.length
                ? "Videos are on their way"
                : words.length
                  ? `Nothing matches “${query.trim()}”`
                  : topic === SAVED
                    ? "Nothing saved yet"
                    : `No ${topicName} videos yet`}
            </h2>
            <p className="text-[15px] text-muted">
              {!items.length
                ? "The first lessons, practices and coaching sessions are being recorded. They will appear here as soon as they are ready."
                : words.length
                  ? "Try another word, or look in all topics."
                  : topic === SAVED
                    ? "Open a video and choose Save for later. It will wait for you here."
                    : "New lessons and practices are being recorded. Explore another topic in the meantime."}
            </p>
            {items.length ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  choose(null);
                }}
                className="rounded-full bg-surface px-4 py-2 text-[14px] font-medium text-ink hover:bg-active focus-visible:outline-2 focus-visible:outline-focus"
              >
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
