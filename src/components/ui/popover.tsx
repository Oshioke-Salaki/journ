"use client";

import { Popover as PopoverPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverClose = PopoverPrimitive.Close;

export function PopoverContent({ className, sideOffset = 10, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(
          "z-50 rounded-[18px] bg-surface p-2 shadow-[var(--shadow-float)] outline-none",
          "data-[state=open]:animate-[pop-in_160ms_var(--ease-out-soft)]",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
