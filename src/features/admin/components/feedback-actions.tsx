"use client";

import { Check, RotateCcw } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markFeedback } from "@/features/feedback/actions";
import { toastResult } from "@/lib/notify";

export function MarkFeedbackButton({ id, done }: { id: string; done: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant={done ? "ghost" : "secondary"}
      size="sm"
      loading={pending}
      onClick={() => startTransition(async () => void toastResult(await markFeedback(id, !done)))}
    >
      {done ? <RotateCcw aria-hidden /> : <Check aria-hidden />}
      {done ? "Mark as new" : "Mark handled"}
    </Button>
  );
}
