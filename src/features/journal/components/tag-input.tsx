"use client";

import { Hash, X } from "lucide-react";
import { useId, useState } from "react";
import { notify } from "@/lib/notify";
import { MAX_TAGS, normaliseTag } from "../schemas";

/** Tags under the title: type and press Enter or comma; Backspace on an empty field removes the last. */
export function TagInput({ value, onChange, suggestions }: { value: string[]; onChange: (tags: string[]) => void; suggestions: string[] }) {
  const [text, setText] = useState("");
  const listId = useId();

  const add = (raw: string) => {
    const tag = normaliseTag(raw);
    setText("");
    if (!tag || value.includes(tag)) return;
    if (value.length >= MAX_TAGS) return void notify.error(`Up to ${MAX_TAGS} tags per entry.`);
    onChange([...value, tag]);
  };

  return (
    <div className="mb-5 flex flex-wrap items-center gap-1.5">
      {value.map((tag) => (
        <span key={tag} className="inline-flex h-8 items-center gap-1 rounded-full bg-raised pr-1 pl-3 text-[14px] text-ink">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`Remove tag ${tag}`}
            className="grid size-6 place-items-center rounded-full text-muted hover:bg-active hover:text-ink focus-visible:outline-2 focus-visible:outline-focus"
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      {value.length < MAX_TAGS ? (
        <label className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-faint focus-within:bg-raised">
          <Hash className="size-4" aria-hidden />
          <span className="sr-only">Add a tag</span>
          <input
            value={text}
            list={suggestions.length ? listId : undefined}
            onChange={(e) => {
              const next = e.target.value;
              if (next.endsWith(",")) add(next.slice(0, -1));
              else setText(next);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(text);
              } else if (e.key === "Backspace" && !text && value.length) {
                onChange(value.slice(0, -1));
              }
            }}
            onBlur={() => text.trim() && add(text)}
            maxLength={30}
            placeholder={value.length ? "Add tag" : "Add a tag, like work or family"}
            className="w-[200px] max-w-full bg-transparent text-[14px] text-ink placeholder:text-faint focus:outline-none"
          />
          {suggestions.length ? (
            <datalist id={listId}>
              {suggestions.filter((s) => !value.includes(s)).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          ) : null}
        </label>
      ) : null}
    </div>
  );
}
