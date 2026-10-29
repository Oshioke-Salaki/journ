"use client";

import { Check } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer grid size-[22px] shrink-0 place-items-center rounded-[7px] border-[1.5px] border-control bg-surface transition-colors",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-on-primary",
        "aria-[invalid=true]:border-negative",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
