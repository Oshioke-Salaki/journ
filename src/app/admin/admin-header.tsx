import type { ReactNode } from "react";

export function AdminHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
        {description ? <p className="text-[15px] text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
