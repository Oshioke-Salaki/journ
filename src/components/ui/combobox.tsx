"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { controlClass } from "./input";
import { useField } from "./field";
import { Spinner } from "./spinner";

export type ComboOption = { value: string; label: string; detail?: string };

type Props = {
  value: string | null;
  /** Shown in the field when `value` is set (defaults to the matching option's label). */
  displayValue?: string;
  onChange: (option: ComboOption | null) => void;
  placeholder?: string;
  /** A fixed list, filtered as the member types. */
  options?: ComboOption[];
  /** Or: look options up as the member types (debounced). Return null when the search failed. */
  search?: (query: string, signal: AbortSignal) => Promise<ComboOption[] | null>;
  /** With `search`: keep typed text that matches nothing, as a free-text answer. */
  allowFreeText?: boolean;
  emptyText?: string;
  minChars?: number;
  icon?: ReactNode;
};

/**
 * A searchable dropdown (WAI-ARIA combobox with a listbox). Type to filter, arrow keys to move,
 * Enter to choose, Escape to close. Works with a fixed list or a live search.
 */
export function Combobox({
  value,
  displayValue,
  onChange,
  placeholder,
  options,
  search,
  allowFreeText = false,
  emptyText = "No matches",
  minChars = 1,
  icon,
}: Props) {
  const field = useField();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedLabel = displayValue ?? options?.find((o) => o.value === value)?.label ?? "";

  const [query, setQuery] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState<ComboOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);

  // Follow outside changes (a form reset) while the member is not typing.
  const shown = editing ? query : selectedLabel;

  const searchable = shown.trim().length >= Math.max(2, minChars);
  const filtered = useMemo(() => {
    if (!options) return searchable ? remote : [];
    const q = shown.trim().toLowerCase();
    if (!editing || !q) return options;
    const starts = options.filter((o) => o.label.toLowerCase().startsWith(q));
    const contains = options.filter((o) => !o.label.toLowerCase().startsWith(q) && o.label.toLowerCase().includes(q));
    return [...starts, ...contains];
  }, [options, remote, shown, editing, searchable]);

  useEffect(() => {
    if (!search || !editing) return;
    const q = query.trim();
    if (q.length < Math.max(2, minChars)) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const result = await search(q, controller.signal);
        if (controller.signal.aborted) return;
        setFailed(result === null);
        setRemote(result ?? []);
        setActive(0);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, search, editing, minChars]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (option: ComboOption) => {
    onChange(option);
    setEditing(false);
    setOpen(false);
    setQuery(option.label);
  };

  const close = () => {
    setOpen(false);
    if (!editing) return;
    setEditing(false);
    const typed = query.trim();
    if (allowFreeText && typed && typed !== selectedLabel) onChange({ value: "", label: typed });
    else if (!typed) onChange(null);
  };

  const clear = () => {
    onChange(null);
    setQuery("");
    setEditing(true);
    setOpen(true);
    inputRef.current?.focus();
  };

  const showList = open && (filtered.length > 0 || loading || (editing && shown.trim().length >= minChars));
  const activeId = showList && filtered[active] ? `${listId}-${active}` : undefined;

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint [&_svg]:size-[18px]" aria-hidden>
        {icon ?? <Search />}
      </span>
      <input
        ref={inputRef}
        id={field?.id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-invalid={field?.invalid || undefined}
        aria-describedby={field?.invalid ? field.errorId : undefined}
        autoComplete="off"
        spellCheck={false}
        value={shown}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setEditing(true);
          setOpen(true);
          setActive(0);
          if (search) setLoading(e.target.value.trim().length >= Math.max(2, minChars));
        }}
        onFocus={() => {
          setQuery(selectedLabel);
          setOpen(Boolean(options));
        }}
        onBlur={close}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(filtered.length - 1, i + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(0, i - 1));
          } else if (e.key === "Enter" && showList && filtered[active]) {
            e.preventDefault();
            choose(filtered[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
            setEditing(false);
            setQuery(selectedLabel);
          }
        }}
        className={cn(controlClass, "h-12 pr-20 pl-11")}
      />
      <span className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center">
        {loading ? (
          <span className="grid size-9 place-items-center text-muted">
            <Spinner className="size-4" label="Searching" />
          </span>
        ) : shown ? (
          <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={clear} aria-label="Clear" className="grid size-9 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink">
            <X className="size-4" />
          </button>
        ) : null}
        {options ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={showList ? "Close list" : "Open list"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setOpen((o) => !o);
              inputRef.current?.focus();
            }}
            className="grid size-9 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink"
          >
            <ChevronDown className={cn("size-[18px] transition-transform", showList && "rotate-180")} />
          </button>
        ) : null}
      </span>

      {showList ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-40 max-h-[280px] overflow-y-auto overscroll-contain rounded-[16px] bg-surface p-1.5 shadow-[var(--shadow-float)]"
        >
          {filtered.map((o, i) => {
            const selected = o.value === value && o.value !== "";
            return (
              <li
                key={`${o.value}-${i}`}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={selected}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
                onMouseMove={() => setActive(i)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-[15px]",
                  i === active ? "bg-raised" : "",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-ink">{o.label}</span>
                  {o.detail ? <span className="block truncate text-[13px] text-muted">{o.detail}</span> : null}
                </span>
                {selected ? <Check className="size-4 shrink-0 text-accent" aria-hidden /> : null}
              </li>
            );
          })}
          {!filtered.length && !loading ? (
            <li role="presentation" className="px-3 py-2.5 text-[14px] text-muted">
              {failed ? "Search isn't available right now. Your text will be saved as you typed it." : allowFreeText ? `${emptyText}. We'll keep “${shown.trim()}” as you typed it.` : emptyText}
            </li>
          ) : null}
          {loading && !filtered.length ? (
            <li role="presentation" className="px-3 py-2.5 text-[14px] text-muted">
              Searching…
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
