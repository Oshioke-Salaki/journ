"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toastResult } from "@/lib/notify";
import { dismissChecklist } from "./actions";

export function DismissChecklistButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="ghost" size="sm" className="-mr-2" loading={pending} onClick={() => startTransition(async () => void toastResult(await dismissChecklist()))}>
      Hide
    </Button>
  );
}
