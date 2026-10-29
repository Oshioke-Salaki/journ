import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * The JournApp mark: a sun over layered hills, redrawn from the brand artwork.
 * Colours are fixed (they are the brand), not theme tokens.
 */
export function Mark({ className, title = "JournApp" }: { className?: string; title?: string | null }) {
  const clip = useId();
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-8 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <clipPath id={clip}>
          <rect width="64" height="64" rx="15" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="64" height="64" fill="#F3CDAE" />
        <circle cx="32" cy="17" r="5.5" fill="#2F7370" />
        <path d="M0 46 L17 28 L30 40 L45 25 L64 43 V64 H0 Z" fill="#A9B3E0" />
        <path d="M14 64 L33 41 L52 64 Z" fill="#8592CF" />
        <path d="M0 64 V44 L21 41 L39 64 Z" fill="#B5DFCB" />
        <path d="M24 64 L45 39 L64 51 V64 Z" fill="#7FA68C" />
      </g>
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Mark className="size-7" title={null} />
      <span className="text-[17px] font-semibold tracking-[-0.01em] text-ink">JournApp</span>
    </span>
  );
}
