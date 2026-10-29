import { cn } from "@/lib/cn";

/** A member's initial on a pale tint of the brand. */
export function Avatar({ name, className }: { name: string | null; className?: string }) {
  const initial = name?.trim().charAt(0).toUpperCase() || "J";
  return (
    <span
      aria-hidden
      className={cn("grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-[15px] font-semibold text-accent-ink", className)}
    >
      {initial}
    </span>
  );
}
