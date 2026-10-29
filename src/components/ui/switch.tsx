"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-[30px] w-[50px] shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-200",
        "bg-control data-[state=checked]:bg-positive disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-6 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.2)]",
          "transition-transform duration-200 ease-[var(--ease-spring)] data-[state=checked]:translate-x-5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
