import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** An empty block keeps its frame and says, in one sentence, what goes here and how to start. */
export function EmptyState({
  title,
  children,
  action,
  art,
  className,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  art?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-dashed border-control/80 p-5", className)}>
      {art}
      <div className="flex flex-col gap-1">
        <p className="text-[15px] font-medium text-ink">{title}</p>
        {children ? <p className="text-[14px] text-muted">{children}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** A failure inside the block that failed, never a full-screen banner. */
export function ErrorState({
  title = "This didn't load",
  children,
  action,
  className,
}: {
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex items-start gap-3 rounded-[var(--radius-card)] bg-raised p-5", className)}>
      <CircleAlert className="mt-0.5 size-[18px] shrink-0 text-negative" aria-hidden />
      <div className="flex flex-col items-start gap-1">
        <p className="text-[15px] font-medium text-ink">{title}</p>
        {children ? <p className="text-[14px] text-muted">{children}</p> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}
