"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { useControlProps } from "./field";

export const controlClass = cn(
  "w-full rounded-[var(--radius-field)] border border-border bg-surface px-4 text-[16px] text-ink",
  "placeholder:text-faint transition-[border-color,box-shadow] duration-150",
  "hover:border-control focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15",
  "aria-[invalid=true]:border-negative aria-[invalid=true]:focus:ring-negative/15",
  "disabled:cursor-not-allowed disabled:bg-raised disabled:text-muted",
);

export function Input({
  className,
  described,
  ...props
}: ComponentProps<"input"> & { /** True when the Field has a <Description>. */ described?: boolean }) {
  const control = useControlProps(props, described);
  return <input className={cn(controlClass, "h-12", className)} {...props} {...control} />;
}

export function Textarea({ className, described, ...props }: ComponentProps<"textarea"> & { described?: boolean }) {
  const control = useControlProps(props, described);
  return <textarea className={cn(controlClass, "min-h-28 py-3 leading-relaxed", className)} {...props} {...control} />;
}

export function Select({ className, described, ...props }: ComponentProps<"select"> & { described?: boolean }) {
  const control = useControlProps(props, described);
  return (
    <select
      className={cn(
        controlClass,
        "h-12 appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-11",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6a68' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        className,
      )}
      {...props}
      {...control}
    />
  );
}
