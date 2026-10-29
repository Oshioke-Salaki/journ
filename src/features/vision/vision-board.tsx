"use client";

import { ImagePlus, Trash2, Type } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Landscape } from "@/components/brand/landscape";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Label } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { notify, toastResult } from "@/lib/notify";
import { createClient } from "@/lib/supabase/client";
import { useHydrated } from "@/lib/use-hydrated";
import { addImage, addWords, removeVisionItem } from "./actions";
import { compressImage } from "./compress";
import type { VisionItem } from "./queries";

const TINTS = ["bg-sand", "bg-accent-soft", "bg-raised"];
const MAX_BYTES = 15 * 1024 * 1024;

export function VisionBoard({ items, userId }: { items: VisionItem[]; userId: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [wordsOpen, setWordsOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const hydrated = useHydrated();

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) return notify.error("Choose a photo or picture file.");
    if (file.size > MAX_BYTES) return notify.error("That picture is too large. Choose one under 15 MB.");
    setUploading(true);
    try {
      const blob = await compressImage(file);
      const path = `${userId}/${crypto.randomUUID()}.webp`;
      const { error } = await createClient().storage.from("vision").upload(path, blob, { contentType: "image/webp", upsert: false });
      if (error) throw error;
      const result = await addImage({ path });
      if (!result.ok) return void notify.error(result.error);
      notify.success("Picture added");
      router.refresh();
    } catch (error) {
      console.error("[vision] upload", error);
      notify.error("That picture didn't upload. Check your connection and try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = (id: string) => {
    setRemoving(id);
    startTransition(async () => {
      toastResult(await removeVisionItem(id));
      setRemoving(null);
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => fileRef.current?.click()} loading={uploading} disabled={!hydrated}>
          <ImagePlus aria-hidden />
          Add a picture
        </Button>
        <Button variant="secondary" onClick={() => setWordsOpen(true)} disabled={!hydrated}>
          <Type aria-hidden />
          Add words
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>

      {items.length ? (
        <ul className="columns-2 gap-3 sm:gap-4 lg:columns-3 xl:columns-4">
          <AnimatePresence initial={false}>
            {items.map((item, i) => (
              <motion.li
                key={item.id}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: removing === item.id ? 0.4 : 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
                className="group relative mb-3 break-inside-avoid sm:mb-4"
              >
                {item.kind === "image" ? (
                  <figure className="overflow-hidden rounded-[18px] bg-raised">
                    {item.url ? (
                      // Signed, private and short-lived: served straight from storage, not the image optimiser.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt={item.caption ?? "A picture on your vision board"} loading="lazy" decoding="async" className="block h-auto w-full" />
                    ) : (
                      <div className="grid aspect-[4/3] place-items-center text-[14px] text-muted">Picture unavailable</div>
                    )}
                    {item.caption ? <figcaption className="px-4 py-3 text-[14px] text-ink">{item.caption}</figcaption> : null}
                  </figure>
                ) : (
                  <div className={cn("flex flex-col gap-2 rounded-[18px] p-5 sm:p-6", TINTS[i % TINTS.length])}>
                    <p className="font-serif text-[24px] leading-[1.2] tracking-[-0.01em] text-ink sm:text-[28px]">{item.words}</p>
                    {item.caption ? <p className="text-[14px] text-muted">{item.caption}</p> : null}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  disabled={removing === item.id}
                  aria-label={`Remove ${item.kind === "image" ? "picture" : `“${item.words}”`} from your board`}
                  className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-surface text-ink shadow-[var(--shadow-float)] transition-opacity hover:text-negative sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="grid items-center gap-6 rounded-[var(--radius-panel)] bg-raised p-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,280px)] sm:p-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">Picture the life you are working towards</h2>
            <p className="text-[16px] text-muted">
              Add photos of places, people and moments that matter to you, and the words you want to live by. Only you can see your board.
            </p>
          </div>
          <Landscape mood={5} energy={4} seed={77} radius={14} className="rounded-[18px]" />
        </div>
      )}

      <WordsDialog open={wordsOpen} onOpenChange={setWordsOpen} />
    </div>
  );
}

function WordsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [words, setWords] = useState("");
  const [caption, setCaption] = useState("");
  const [pending, startTransition] = useTransition();
  const save = () =>
    startTransition(async () => {
      const result = await addWords({ words, caption });
      if (!result.ok) return void notify.error(result.error);
      notify.success("Added to your board");
      setWords("");
      setCaption("");
      onOpenChange(false);
    });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Add words" description="A word, a line or an intention to keep in view.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex flex-col gap-5"
        >
          <Field>
            <Label>Words</Label>
            <Textarea value={words} onChange={(e) => setWords(e.target.value)} maxLength={160} rows={3} placeholder="Strong, calm and kind" className="font-serif text-[19px]" autoFocus />
          </Field>
          <Field>
            <Label optional>Caption</Label>
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={120} placeholder="How I want to feel this year" />
          </Field>
          <Button type="submit" loading={pending} disabled={!words.trim()} className="self-end">
            Add to board
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
