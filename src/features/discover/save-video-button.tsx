"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toastResult } from "@/lib/notify";
import { setVideoSaved } from "./actions";

export function SaveVideoButton({ videoId, saved }: { videoId: string; saved: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      aria-pressed={optimistic}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          toastResult(await setVideoSaved(videoId, !optimistic));
        })
      }
    >
      {optimistic ? <BookmarkCheck aria-hidden /> : <Bookmark aria-hidden />}
      {optimistic ? "Saved" : "Save for later"}
    </Button>
  );
}
