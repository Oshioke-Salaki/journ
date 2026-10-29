import { cn } from "@/lib/cn";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn("inline-block size-[18px]", className)}>
      <svg viewBox="0 0 24 24" className="size-full animate-spin" aria-hidden>
        <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2.5" />
        <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
