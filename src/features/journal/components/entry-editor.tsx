"use client";

import { ArrowLeft, Shuffle, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { notify } from "@/lib/notify";
import { routes } from "@/lib/routes";
import { useOnReveal } from "@/lib/use-on-reveal";
import { createEntry, updateEntry } from "../actions";
import { wordCount } from "../schemas";
import { useDraft } from "./use-draft";

type Prompt = { id: string; body: string };

type Props = { userId: string } & (
  | { mode: "new"; prompts: Prompt[]; initialPromptId: string | null; placeholder?: string }
  | { mode: "edit"; entryId: string; initial: { title: string; body: string }; promptBody: string | null; prompts?: never }
);

export function EntryEditor(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isNew = props.mode === "new";
  // Drafts are per member, so two people sharing a device never see each other's words.
  const draftKey = `${props.userId}:${isNew ? "new" : props.entryId}`;

  const [title, setTitle] = useState(isNew ? "" : props.initial.title);
  const [body, setBody] = useState(isNew ? "" : props.initial.body);
  const [promptId, setPromptId] = useState<string | null>(isNew ? props.initialPromptId : null);
  const [dirty, setDirty] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const draft = useDraft(draftKey, { title, body, promptId }, dirty);
  const prompt = isNew ? props.prompts.find((p) => p.id === promptId) ?? null : null;
  const promptText = isNew ? prompt?.body ?? null : props.promptBody;
  const words = wordCount(body);

  // On every visit: start from the saved entry (or blank), then bring back any unsaved draft.
  // Words already being typed are never reset; an untouched editor picks up the latest entry or prompt.
  useOnReveal(() => {
    if (dirty) return;
    if (!isNew) {
      setTitle(props.initial.title);
      setBody(props.initial.body);
    } else {
      setPromptId(props.initialPromptId);
    }
    const saved = draft.restore();
    if (!saved) return;
    const differs = isNew ? saved.body.trim() !== "" : saved.body !== props.initial.body || saved.title !== props.initial.title;
    if (!differs) return;
    setTitle(saved.title);
    setBody(saved.body);
    if (isNew) setPromptId(saved.promptId);
    setDirty(true);
    notify.info("Draft restored", "We kept what you were writing on this device.");
  });

  // Grow the writing area with its text.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 280)}px`;
  }, [body]);

  // Warn before leaving with unsaved words.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const save = () => {
    if (!body.trim()) {
      notify.error("Write something before saving.");
      bodyRef.current?.focus();
      return;
    }
    startTransition(async () => {
      const input = { title, body, promptId };
      let destination: string;
      if (props.mode === "new") {
        const result = await createEntry(input);
        if (!result.ok) return void notify.error(result.error);
        notify.success(result.message ?? "Saved");
        destination = routes.journalEntry(result.data.id);
        // The next new entry starts blank, even though Next.js keeps this page alive.
        setTitle("");
        setBody("");
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
        <div className="mx-auto flex h-[60px] max-w-[760px] items-center justify-between gap-3 px-4 sm:px-8">
          <Link href={backHref} aria-label={isNew ? "Close" : "Back to entry"} className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "-ml-2")}>
            {isNew ? <X /> : <ArrowLeft />}
          </Link>
          <p className="num text-[14px] text-muted" aria-live="polite">
            {words === 1 ? "1 word" : `${words.toLocaleString("en")} words`}
            {dirty ? <span className="hidden sm:inline"> · Draft kept on this device</span> : null}
          </p>
          <Button onClick={save} loading={pending} disabled={!body.trim()} size="sm" className="min-w-20">
            {isNew ? "Save" : "Save changes"}
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 pt-8 pb-24 sm:px-8 sm:pt-12">
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
          maxLength={120}
          placeholder="Title (optional)"
          className="w-full bg-transparent text-[26px] leading-tight font-semibold tracking-[-0.02em] text-ink placeholder:text-faint/70 focus:outline-none sm:text-[30px]"
        />
        <label htmlFor="entry-body" className="sr-only">
          Your entry
        </label>
        <textarea
          id="entry-body"
          ref={bodyRef}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setDirty(true);
          }}
          autoFocus={isNew}
          maxLength={50000}
          placeholder={isNew ? props.placeholder ?? "Start wherever you are." : undefined}
          className="mt-5 w-full resize-none bg-transparent font-serif text-[19px] leading-[1.7] text-ink placeholder:text-faint/70 focus:outline-none sm:text-[21px]"
        />
      </main>
    </div>
  );
}
