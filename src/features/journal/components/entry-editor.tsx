"use client";

import type { Editor } from "@tiptap/react";
import { ArrowLeft, Shuffle, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { notify } from "@/lib/notify";
import { routes } from "@/lib/routes";
import { useOnReveal } from "@/lib/use-on-reveal";
import { createEntry, updateEntry } from "../actions";
import { textToDoc, type DocNode } from "../rich/document";
import { RichEditor } from "../rich/rich-editor";
import { wordCount } from "../schemas";
import { useDraft } from "./use-draft";

type Prompt = { id: string; body: string };

type Props = { userId: string } & (
  | { mode: "new"; prompts: Prompt[]; initialPromptId: string | null; placeholder?: string }
  | { mode: "edit"; entryId: string; initial: { title: string; doc: DocNode; text: string }; promptBody: string | null; prompts?: never }
);

const EMPTY: DocNode = { type: "doc", content: [{ type: "paragraph" }] };

export function EntryEditor(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isNew = props.mode === "new";
  // Drafts are per member, so two people sharing a device never see each other's words.
  const draftKey = `${props.userId}:${isNew ? "new" : props.entryId}`;
  const startDoc = isNew ? EMPTY : props.initial.doc;
  const startText = isNew ? "" : props.initial.text;

  const [title, setTitle] = useState(isNew ? "" : props.initial.title);
  const [doc, setDoc] = useState<DocNode>(startDoc);
  const [text, setText] = useState(startText);
  const [promptId, setPromptId] = useState<string | null>(isNew ? props.initialPromptId : null);
  const [dirty, setDirty] = useState(false);

  // The editor appears after the first render; content chosen before then is applied when it does.
  const editorRef = useRef<Editor | null>(null);
  const wantedDoc = useRef<DocNode>(startDoc);
  const load = (next: DocNode, nextText: string) => {
    wantedDoc.current = next;
    setDoc(next);
    setText(nextText);
    editorRef.current?.commands.setContent(next, { emitUpdate: false });
  };
  const onReady = useCallback((editor: Editor) => {
    editorRef.current = editor;
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(wantedDoc.current)) editor.commands.setContent(wantedDoc.current, { emitUpdate: false });
  }, []);

  const draft = useDraft(draftKey, { title, body: text, doc, promptId }, dirty);
  const prompt = isNew ? props.prompts.find((p) => p.id === promptId) ?? null : null;
  const promptText = isNew ? prompt?.body ?? null : props.promptBody;
  const words = wordCount(text);

  // On every visit: start from the saved entry (or blank), then bring back any unsaved draft.
  // Words already being typed are never reset.
  useOnReveal(() => {
    if (dirty) return;
    if (!isNew) {
      setTitle(props.initial.title);
      load(props.initial.doc, props.initial.text);
    } else {
      setPromptId(props.initialPromptId);
    }
    const saved = draft.restore();
    if (!saved) return;
    const savedDoc = saved.doc ?? textToDoc(saved.body);
    const differs = isNew ? saved.body.trim() !== "" : saved.body !== props.initial.text || saved.title !== props.initial.title || JSON.stringify(savedDoc) !== JSON.stringify(props.initial.doc);
    if (!differs) return;
    setTitle(saved.title);
    load(savedDoc, saved.body);
    if (isNew) setPromptId(saved.promptId);
    setDirty(true);
    notify.info("Draft restored", "We kept what you were writing on this device.");
  });

  // Warn before leaving with unsaved words.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const save = () => {
    if (!text.trim()) {
      notify.error("Write something before saving.");
      editorRef.current?.commands.focus();
      return;
    }
    startTransition(async () => {
      // Editor JSON can contain objects without a normal prototype; send a plain copy to the server.
      const input = { title, doc: JSON.parse(JSON.stringify(doc)) as DocNode, promptId };
      let destination: string;
      if (props.mode === "new") {
        const result = await createEntry(input);
        if (!result.ok) return void notify.error(result.error);
        notify.success(result.message ?? "Saved");
        destination = routes.journalEntry(result.data.id);
        // The next new entry starts blank, even though Next.js keeps this page alive.
        setTitle("");
        load(EMPTY, "");
      } else {
        const result = await updateEntry(props.entryId, input);
        if (!result.ok) return void notify.error(result.error);
        notify.success(result.message ?? "Saved");
        destination = routes.journalEntry(props.entryId);
      }
      draft.clear();
      setDirty(false);
      router.replace(destination);
    });
  };

  // Cmd/Ctrl + S saves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const shufflePrompt = () => {
    if (!isNew || props.prompts.length === 0) return;
    const others = props.prompts.filter((p) => p.id !== promptId);
    const next = others[Math.floor(Math.random() * others.length)] ?? props.prompts[0];
    setPromptId(next.id);
    setDirty(true);
  };

  const backHref = isNew ? routes.today : routes.journalEntry(props.entryId);

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-20 border-b border-rule bg-surface pt-safe">
        <div className="mx-auto flex h-[60px] max-w-[820px] items-center justify-between gap-3 px-4 sm:px-8">
          <Link href={backHref} aria-label={isNew ? "Close" : "Back to entry"} className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "-ml-2")}>
            {isNew ? <X /> : <ArrowLeft />}
          </Link>
          <p className="num text-[14px] text-muted" aria-live="polite">
            {words === 1 ? "1 word" : `${words.toLocaleString("en")} words`}
            {dirty ? <span className="hidden sm:inline"> · Draft kept on this device</span> : null}
          </p>
          <Button onClick={save} loading={pending} disabled={!text.trim()} size="sm" className="min-w-20">
            {isNew ? "Save" : "Save changes"}
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[820px] flex-1 px-4 pt-6 pb-36 sm:px-8 sm:pt-8 md:pb-24">
        {promptText ? (
          <div className="mb-8 flex items-start justify-between gap-4 rounded-[20px] bg-sand px-5 py-4">
            <p className="font-serif text-[19px] leading-snug text-ink italic sm:text-[21px]">{promptText}</p>
            {isNew ? (
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon-sm" onClick={shufflePrompt} aria-label="Another prompt" title="Another prompt">
                  <Shuffle />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setPromptId(null)} aria-label="Write freely instead" title="Write freely instead">
                  <X />
                </Button>
              </div>
            ) : null}
          </div>
        ) : isNew && props.prompts.length ? (
          <Button variant="secondary" size="sm" onClick={shufflePrompt} className="mb-8">
            <Shuffle aria-hidden />
            Give me a prompt
          </Button>
        ) : null}

        <label htmlFor="entry-title" className="sr-only">
          Title
        </label>
        <input
          id="entry-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setDirty(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              editorRef.current?.commands.focus("start");
            }
          }}
          maxLength={120}
          placeholder="Title (optional)"
          className="mb-5 w-full bg-transparent text-[26px] leading-tight font-semibold tracking-[-0.02em] text-ink placeholder:text-faint/70 focus:outline-none sm:text-[30px]"
        />

        <RichEditor
          initial={startDoc}
          placeholder={isNew ? props.placeholder ?? "Start wherever you are." : "Write your entry"}
          autoFocus={isNew}
          onReady={onReady}
          onChange={(nextDoc, nextText) => {
            setDoc(nextDoc);
            setText(nextText);
            setDirty(true);
          }}
        />
      </main>
    </div>
  );
}
