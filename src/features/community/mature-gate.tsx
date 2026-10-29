"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import { confirmMatureContent } from "@/features/profile/actions";

/** Asked once per member before showing content for adults. */
export function MatureGate({ topic }: { topic: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const confirm = () =>
    startTransition(async () => {
      const result = await confirmMatureContent();
      if (!result.ok) return void notify.error(result.error);
      router.refresh();
    });
  return (
    <div className="flex max-w-xl flex-col items-start gap-4 rounded-[var(--radius-panel)] bg-raised p-6 sm:p-8">
      <span className="grid size-11 place-items-center rounded-full bg-accent-soft text-accent-ink">
        <ShieldCheck className="size-5" aria-hidden />
      </span>
      <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">This area is for adults</h2>
      <p className="text-[16px] text-muted">
        {topic} talks openly about desire, intimacy and the body. Please confirm you are 18 or over to continue. We will only ask once.
      </p>
      <Button onClick={confirm} loading={pending}>
        I am 18 or over
      </Button>
    </div>
  );
}
