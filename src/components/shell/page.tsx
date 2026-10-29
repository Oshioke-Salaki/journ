import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** The page's content column: one pair of margins at every width. */
export function PageContainer({ children, className, width = "wide" }: { children: ReactNode; className?: string; width?: "wide" | "narrow" }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 pt-6 pb-10 sm:px-6 sm:pt-8 lg:px-10 lg:pt-14 lg:pb-16",
        width === "wide" ? "max-w-[1180px]" : "max-w-[760px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-10", className)}>
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-[1.1] font-semibold tracking-[-0.02em] text-ink sm:text-[32px]">{title}</h1>
        {description ? <p className="max-w-[60ch] text-[16px] text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
