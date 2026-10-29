import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/** A flat placeholder at the real size of what it stands for. No shimmer, no layout shift. */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden style={style} className={cn("block animate-pulse rounded-md bg-active/70", className)} />;
}
