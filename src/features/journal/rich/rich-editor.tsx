"use client";

import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Bold, Italic, Underline } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import type { DocNode } from "./document";
import { journalExtensions } from "./extensions";
import { HIGHLIGHTS } from "./palette";
import { Toolbar, useKeyboardOffset } from "./toolbar";

type Props = {
  initial: DocNode;
  placeholder: string;
  autoFocus?: boolean;
  onChange: (doc: DocNode, text: string) => void;
  /** Lets the parent replace the content (restoring a draft, resetting after a save). */
  onReady?: (editor: Editor) => void;
};

/**
 * The journal editor: a formatting toolbar (floating at the top on larger screens, docked above the
 * keyboard on phones), a selection menu for quick marks, and the shared journal document schema.
 */
export function RichEditor({ initial, placeholder, autoFocus, onChange, onReady }: Props) {
  const keyboard = useKeyboardOffset();
  const editor = useEditor({
    extensions: [...journalExtensions, Placeholder.configure({ placeholder })],
    content: initial,
    immediatelyRender: false,
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: {
        class: "journal-doc min-h-[45vh] pb-8",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Your entry",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getJSON() as DocNode, e.getText({ blockSeparator: "\n" })),
  });

  useEffect(() => {
    if (editor) onReady?.(editor);
  }, [editor, onReady]);

  if (!editor) return <div className="journal-doc min-h-[45vh] text-faint/70">{placeholder}</div>;

  return (
    <>
      {/* Larger screens: a floating pill at the top of the page. */}
      <div className="sticky top-[calc(env(safe-area-inset-top)+68px)] z-10 mb-6 hidden justify-center md:flex">
        <div className="scrollbar-none max-w-full overflow-x-auto rounded-full bg-surface p-1.5 shadow-[var(--shadow-float)]">
          <Toolbar editor={editor} placement="top" />
        </div>
      </div>

      <BubbleMenu
        editor={editor}
        appendTo={() => document.body}
        options={{ strategy: "fixed", placement: "top", offset: 10, flip: true, shift: { padding: 12 }, inline: true }}
        shouldShow={({ editor: e, state }) => !state.selection.empty && e.isEditable && window.matchMedia("(pointer: fine)").matches}
        className="z-50 flex items-center gap-0.5 rounded-full bg-ink p-1 text-surface shadow-[var(--shadow-float)]"
      >
        <BubbleButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold strokeWidth={2.4} />
        </BubbleButton>
        <BubbleButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic />
        </BubbleButton>
        <BubbleButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline />
        </BubbleButton>
        <span className="w-1.5" aria-hidden />
        {HIGHLIGHTS.map((h) => (
          <button
            key={h.value}
            type="button"
            aria-label={`Highlight ${h.label.toLowerCase()}`}
            title={`Highlight ${h.label.toLowerCase()}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHighlight({ color: h.value }).run()}
            className="grid size-8 place-items-center rounded-full hover:bg-white/10"
          >
            <span className={cn("size-[18px] rounded-full ring-1 ring-white/30", editor.isActive("highlight", { color: h.value }) && "ring-2 ring-white")} style={{ background: h.value }} />
          </button>
        ))}
      </BubbleMenu>

      <EditorContent editor={editor} />

      {/* Phones and tablets: docked above the keyboard. */}
      <div
        className="fixed inset-x-0 z-30 border-t border-rule bg-surface md:hidden"
        style={{ bottom: keyboard, paddingBottom: keyboard ? 0 : "env(safe-area-inset-bottom)" }}
      >
        <div className="scrollbar-none overflow-x-auto px-2 py-1.5">
          <Toolbar editor={editor} placement="bottom" />
        </div>
      </div>
    </>
  );
}

function BubbleButton({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn("grid size-8 place-items-center rounded-full transition-colors [&_svg]:size-4", active ? "bg-surface text-ink" : "hover:bg-white/10")}
    >
      {children}
    </button>
  );
}
