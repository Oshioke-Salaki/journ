"use client";

import { X } from "lucide-react";
import { AlertDialog as AlertPrimitive, Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const overlayClass =
  "fixed inset-0 z-50 bg-overlay data-[state=open]:animate-[fade-in_180ms_ease-out] data-[state=closed]:animate-[fade-out_140ms_ease-in]";
const contentClass = cn(
  "fixed z-50 flex max-h-[min(88dvh,720px)] w-full flex-col overflow-y-auto bg-surface shadow-[var(--shadow-float)] outline-none",
  // Phone: a sheet from the bottom. Larger: a centred dialog.
  "inset-x-0 bottom-0 rounded-t-[26px] px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]",
  "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-w-[440px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[24px] sm:p-7",
  "data-[state=open]:animate-[sheet-in_260ms_var(--ease-out-soft)] sm:data-[state=open]:animate-[dialog-in_220ms_var(--ease-out-soft)]",
);

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  title,
  description,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { title: string; description?: ReactNode }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClass} />
      <DialogPrimitive.Content className={cn(contentClass, className)} {...props}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <DialogPrimitive.Title className="text-[19px] font-semibold tracking-[-0.01em] text-ink">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="text-[15px] text-muted">{description}</DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            className="-mt-1 -mr-1 grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink"
            aria-label="Close"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const AlertDialog = AlertPrimitive.Root;
export const AlertDialogTrigger = AlertPrimitive.Trigger;
export const AlertDialogCancel = AlertPrimitive.Cancel;
export const AlertDialogAction = AlertPrimitive.Action;

/** A confirmation that names what will happen. Used before anything that cannot be undone. */
export function AlertDialogContent({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AlertPrimitive.Portal>
      <AlertPrimitive.Overlay className={overlayClass} />
      <AlertPrimitive.Content className={cn(contentClass, className)}>
        <AlertPrimitive.Title className="text-[19px] font-semibold tracking-[-0.01em] text-ink">{title}</AlertPrimitive.Title>
        <AlertPrimitive.Description className="mt-2 text-[15px] text-muted">{description}</AlertPrimitive.Description>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>
      </AlertPrimitive.Content>
    </AlertPrimitive.Portal>
  );
}
