"use client";

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  Ellipsis,
  Highlighter,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/cn";
import { COLORS, FONTS, HIGHLIGHTS, SIZES } from "./palette";

type Placement = "top" | "bottom";

const STYLES = [
  { id: "body", label: "Body" },
  { id: "h2", label: "Heading" },
  { id: "h3", label: "Subheading" },
  { id: "quote", label: "Quote" },
] as const;

const ALIGN_ICONS = { left: AlignLeft, center: AlignCenter, right: AlignRight, justify: AlignJustify } as const;

/** What the toolbar shows, read from the editor only when it changes. */
function useToolbarState(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const style = e.isActive("heading", { level: 2 }) ? "h2" : e.isActive("heading", { level: 3 }) ? "h3" : e.isActive("blockquote") ? "quote" : "body";
      const ts = e.getAttributes("textStyle");
      const align: keyof typeof ALIGN_ICONS = (["center", "right", "justify"] as const).find((a) => e.isActive({ textAlign: a })) ?? "left";
      return {
        style,
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        strike: e.isActive("strike"),
        bullet: e.isActive("bulletList"),
        ordered: e.isActive("orderedList"),
        task: e.isActive("taskList"),
        color: (ts.color as string | undefined) ?? null,
        font: (ts.fontFamily as string | undefined) ?? FONTS[0].value,
        size: (ts.fontSize as string | undefined) ?? null,
        highlight: (e.getAttributes("highlight").color as string | undefined) ?? null,
        align,
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      };
    },
  });
}

/** Keeps the editor's selection when a toolbar control is pressed. */
const keepFocus = (e: React.MouseEvent) => e.preventDefault();

function ToolButton({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  children,
  className,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={shortcut ? `${label} (${shortcut})` : label}
      disabled={disabled}
      onMouseDown={keepFocus}
      onClick={onClick}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full text-ink transition-[background-color,color,transform] duration-150 active:scale-90 disabled:opacity-35 [&_svg]:size-[18px]",
        active ? "bg-ink text-surface" : "hover:bg-raised",
        className,
      )}
    >
      {children}
    </button>
  );
}

function MenuButton({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <PopoverTrigger
      aria-label={label}
      title={label}
      onMouseDown={keepFocus}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-[14px] font-medium text-ink transition-colors hover:bg-raised data-[state=open]:bg-raised [&_svg]:size-[15px]",
        className,
      )}
    >
      {children}
    </PopoverTrigger>
  );
}

function Option({ selected, onSelect, children, className }: { selected: boolean; onSelect: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onMouseDown={keepFocus}
      onClick={onSelect}
      className={cn("flex w-full items-center justify-between gap-4 rounded-[12px] px-3 py-2 text-left text-ink hover:bg-raised", selected && "bg-raised", className)}
    >
      {children}
      {selected ? <Check className="size-4 shrink-0 text-accent" aria-hidden /> : <span className="size-4" />}
    </button>
  );
}

export function Toolbar({ editor, placement }: { editor: Editor; placement: Placement }) {
  const s = useToolbarState(editor);
  const side = placement === "bottom" ? "top" : "bottom";
  const [open, setOpen] = useState<string | null>(null);
  const menu = (id: string) => ({ open: open === id, onOpenChange: (o: boolean) => setOpen(o ? id : null) });
  const run = (fn: (c: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => {
    fn(editor.chain().focus()).run();
    setOpen(null);
  };
  const currentFont = FONTS.find((f) => f.value === s.font) ?? FONTS[0];

  /** A font applies to the selection; with nothing selected, to the whole entry. */
  const setFont = (value: string) => {
    const { from, to, empty } = editor.state.selection;
    const isDefault = value === FONTS[0].value;
    const chain = editor.chain().focus();
    if (empty) chain.selectAll();
    if (isDefault) chain.unsetFontFamily();
    else chain.setFontFamily(value);
    if (empty) chain.setTextSelection({ from, to });
    chain.run();
    setOpen(null);
  };

  return (
    <div role="toolbar" aria-label="Formatting" aria-orientation="horizontal" className="flex items-center gap-0.5">
      <Popover {...menu("style")}>
        <MenuButton label="Text style" className="min-w-[104px] justify-between">
          {STYLES.find((x) => x.id === s.style)?.label}
          <ChevronDown aria-hidden />
        </MenuButton>
        <PopoverContent side={side} align="start" className="w-[220px]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div role="menu" aria-label="Text style">
            <Option selected={s.style === "body"} onSelect={() => run((c) => c.setParagraph())}>
              <span className="font-serif text-[17px]">Body</span>
            </Option>
            <Option selected={s.style === "h2"} onSelect={() => run((c) => c.toggleHeading({ level: 2 }))}>
              <span className="font-serif text-[22px] font-semibold">Heading</span>
            </Option>
            <Option selected={s.style === "h3"} onSelect={() => run((c) => c.toggleHeading({ level: 3 }))}>
              <span className="font-serif text-[19px] font-semibold">Subheading</span>
            </Option>
            <Option selected={s.style === "quote"} onSelect={() => run((c) => c.toggleBlockquote())}>
              <span className="border-l-2 border-accent pl-2 font-serif text-[17px] text-muted italic">Quote</span>
            </Option>
          </div>
        </PopoverContent>
      </Popover>

      <Popover {...menu("font")}>
        <MenuButton label={`Font: ${currentFont.label}`}>
          <span style={{ fontFamily: currentFont.value }} className="text-[17px] leading-none">
            Aa
          </span>
          <ChevronDown aria-hidden />
        </MenuButton>
        <PopoverContent side={side} align="start" className="w-[248px]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <p className="px-3 pt-1 pb-2 text-[12px] text-muted">Applies to selected text, or the whole entry</p>
          <div role="menu" aria-label="Font">
            {FONTS.map((f) => (
              <Option key={f.value} selected={s.font === f.value} onSelect={() => setFont(f.value)}>
                <span className="flex flex-col">
                  <span style={{ fontFamily: f.value }} className="text-[21px] leading-tight">
                    {f.sample}
                  </span>
                  <span className="text-[12px] text-muted">{f.label}</span>
                </span>
              </Option>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover {...menu("size")}>
        <MenuButton label="Text size">
          <span className="text-[13px]">A</span>
          <span className="-ml-0.5 text-[17px]">A</span>
          <ChevronDown aria-hidden />
        </MenuButton>
        <PopoverContent side={side} align="start" className="w-[200px]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div role="menu" aria-label="Text size">
            {SIZES.map((z) => (
              <Option
                key={z.label}
                selected={s.size === z.value}
                onSelect={() => run((c) => (z.value ? c.setFontSize(z.value) : c.unsetFontSize()))}
              >
                <span className="font-serif" style={{ fontSize: z.value ? `calc(17px * ${z.value === "var(--js-small)" ? 0.84 : z.value === "var(--js-large)" ? 1.26 : 1.6})` : "17px" }}>
                  {z.label}
                </span>
              </Option>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <span className="w-2 shrink-0" aria-hidden />
      <ToolButton label="Bold" shortcut="⌘B" active={s.bold} onClick={() => run((c) => c.toggleBold())}>
        <Bold strokeWidth={2.4} />
      </ToolButton>
      <ToolButton label="Italic" shortcut="⌘I" active={s.italic} onClick={() => run((c) => c.toggleItalic())}>
        <Italic />
      </ToolButton>
      <ToolButton label="Underline" shortcut="⌘U" active={s.underline} onClick={() => run((c) => c.toggleUnderline())}>
        <Underline />
      </ToolButton>

      <span className="w-2 shrink-0" aria-hidden />
      <Popover {...menu("color")}>
        <PopoverTrigger
          aria-label="Text colour"
          title="Text colour"
          onMouseDown={keepFocus}
          className="relative grid size-9 shrink-0 place-items-center rounded-full text-ink hover:bg-raised data-[state=open]:bg-raised"
        >
          <span className="font-serif text-[19px] leading-none font-semibold" style={{ color: s.color ?? undefined }}>
            A
          </span>
          <span className="absolute bottom-[7px] h-[3px] w-4 rounded-full" style={{ background: s.color ?? "var(--ink)" }} aria-hidden />
        </PopoverTrigger>
        <PopoverContent side={side} className="w-[236px] p-3" onOpenAutoFocus={(e) => e.preventDefault()}>
          <p className="pb-2 text-[12px] text-muted">Text colour</p>
          <div role="menu" aria-label="Text colour" className="grid grid-cols-7 gap-1.5">
            {COLORS.map((c) => {
              const on = s.color === c.value;
              return (
                <button
                  key={c.label}
                  type="button"
                  role="menuitemradio"
                  aria-checked={on}
                  aria-label={c.label}
                  title={c.label}
                  onMouseDown={keepFocus}
                  onClick={() => run((ch) => (c.value ? ch.setColor(c.value) : ch.unsetColor()))}
                  className={cn("grid size-7 place-items-center rounded-full transition-transform hover:scale-110", on && "ring-2 ring-ink ring-offset-2 ring-offset-surface")}
                  style={{ background: c.swatch }}
                >
                  {on ? <Check className="size-3.5 text-surface" strokeWidth={3} aria-hidden /> : null}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <Popover {...menu("highlight")}>
        <PopoverTrigger
          aria-label="Highlighter"
          title="Highlighter"
          onMouseDown={keepFocus}
          className="relative grid size-9 shrink-0 place-items-center rounded-full text-ink hover:bg-raised data-[state=open]:bg-raised"
        >
          <Highlighter className="size-[18px]" aria-hidden />
          <span className="absolute bottom-[6px] h-[4px] w-5 rounded-full" style={{ background: s.highlight ?? "var(--jh-yellow)" }} aria-hidden />
        </PopoverTrigger>
        <PopoverContent side={side} className="w-[244px] p-3" onOpenAutoFocus={(e) => e.preventDefault()}>
          <p className="pb-2 text-[12px] text-muted">Highlighter</p>
          <div role="menu" aria-label="Highlighter" className="flex flex-col gap-1">
            {HIGHLIGHTS.map((h) => {
              const on = s.highlight === h.value;
              return (
                <button
                  key={h.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={on}
                  onMouseDown={keepFocus}
                  onClick={() => run((c) => c.toggleHighlight({ color: h.value }))}
                  className={cn("flex items-center justify-between rounded-[12px] px-2 py-1.5 hover:bg-raised", on && "bg-raised")}
                >
                  <span className="rounded-[5px] px-2 py-0.5 font-serif text-[16px] text-ink" style={{ background: h.value }}>
                    {h.label}
                  </span>
                  {on ? <Check className="size-4 text-accent" aria-hidden /> : null}
                </button>
              );
            })}
            <button
              type="button"
              onMouseDown={keepFocus}
              onClick={() => run((c) => c.unsetHighlight())}
              className="mt-1 rounded-[12px] px-2 py-1.5 text-left text-[14px] text-muted hover:bg-raised hover:text-ink"
            >
              Remove highlight
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <span className="w-2 shrink-0" aria-hidden />
      <ToolButton label="Bulleted list" active={s.bullet} onClick={() => run((c) => c.toggleBulletList())}>
        <List />
      </ToolButton>
      <ToolButton label="Numbered list" active={s.ordered} onClick={() => run((c) => c.toggleOrderedList())}>
        <ListOrdered />
      </ToolButton>
      <ToolButton label="Checklist" active={s.task} onClick={() => run((c) => c.toggleTaskList())}>
        <ListChecks />
      </ToolButton>

      <Popover {...menu("more")}>
        <PopoverTrigger
          aria-label="More formatting"
          title="More formatting"
          onMouseDown={keepFocus}
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink hover:bg-raised data-[state=open]:bg-raised"
        >
          <Ellipsis className="size-[18px]" aria-hidden />
        </PopoverTrigger>
        <PopoverContent side={side} align="end" className="w-[252px]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div role="menu" aria-label="More formatting" className="flex flex-col">
            <MoreItem icon={<Strikethrough />} label="Strikethrough" hint="⌘⇧S" active={s.strike} onSelect={() => run((c) => c.toggleStrike())} />
            <MoreItem icon={<Quote />} label="Quote" hint=">" active={s.style === "quote"} onSelect={() => run((c) => c.toggleBlockquote())} />
            <MoreItem icon={<Minus />} label="Divider" hint="---" onSelect={() => run((c) => c.setHorizontalRule())} />
            <div className="my-1.5 flex justify-between gap-1 px-1" role="group" aria-label="Alignment">
              {(Object.keys(ALIGN_ICONS) as (keyof typeof ALIGN_ICONS)[]).map((a) => {
                const Icon = ALIGN_ICONS[a];
                return (
                  <ToolButton key={a} label={`Align ${a}`} active={s.align === a} onClick={() => run((c) => (a === "left" ? c.unsetTextAlign() : c.setTextAlign(a)))}>
                    <Icon />
                  </ToolButton>
                );
              })}
            </div>
            <MoreItem icon={<RemoveFormatting />} label="Clear formatting" onSelect={() => run((c) => c.unsetAllMarks().clearNodes())} />
          </div>
        </PopoverContent>
      </Popover>

      <span className="w-2 shrink-0" aria-hidden />
      <ToolButton label="Undo" shortcut="⌘Z" disabled={!s.canUndo} onClick={() => run((c) => c.undo())}>
        <Undo2 />
      </ToolButton>
      <ToolButton label="Redo" shortcut="⌘⇧Z" disabled={!s.canRedo} onClick={() => run((c) => c.redo())}>
        <Redo2 />
      </ToolButton>
    </div>
  );
}

function MoreItem({ icon, label, hint, active, onSelect }: { icon: ReactNode; label: string; hint?: string; active?: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role={active === undefined ? "menuitem" : "menuitemcheckbox"}
      aria-checked={active}
      onMouseDown={keepFocus}
      onClick={onSelect}
      className={cn("flex items-center gap-3 rounded-[12px] px-3 py-2 text-left text-[15px] text-ink hover:bg-raised [&_svg]:size-[18px]", active && "bg-raised")}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {hint ? <span className="text-[12px] text-faint">{hint}</span> : null}
      {active ? <Check className="size-4 text-accent" aria-hidden /> : null}
    </button>
  );
}

/** On phones the toolbar sits just above the on-screen keyboard. */
export function useKeyboardOffset() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setOffset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return offset;
}
