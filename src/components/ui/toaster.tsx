"use client";

import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { Toaster as Sonner } from "sonner";

/** App-wide toasts. Success and error toasts come from `notify` in lib/notify.ts. */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      offset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
      mobileOffset={{ top: "calc(env(safe-area-inset-top) + 10px)", left: 12, right: 12 }}
      gap={8}
      visibleToasts={3}
      duration={4000}
      icons={{
        success: <CircleCheck className="size-[18px] text-positive" />,
        error: <CircleAlert className="size-[18px] text-negative" />,
        info: <Info className="size-[18px] text-accent" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-start gap-3 rounded-[18px] bg-surface px-4 py-3.5 text-ink shadow-[var(--shadow-float)] sm:w-[380px]",
          title: "text-[15px] font-medium leading-snug",
          description: "mt-0.5 text-[14px] text-muted",
          icon: "mt-px",
          actionButton: "ml-auto shrink-0 rounded-full bg-raised px-3 py-1 text-[14px] font-medium text-ink hover:bg-active",
          closeButton: "hidden",
        },
      }}
    />
  );
}
