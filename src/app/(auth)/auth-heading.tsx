import type { ReactNode } from "react";

export function AuthHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-2">
      <h1 className="text-[30px] leading-[1.1] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
      {children ? <p className="text-[16px] text-muted">{children}</p> : null}
    </div>
  );
}
