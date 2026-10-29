"use client";

import { RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { PageContainer } from "@/components/shell/page";
import { Button, buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";

/** A screen that failed to load, shown inside the app so navigation still works. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer width="narrow">
      <div role="alert" className="flex flex-col items-start gap-4 rounded-[var(--radius-panel)] bg-raised p-6 sm:p-8">
        <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em] text-ink">This screen didn&rsquo;t load</h1>
        <p className="text-[16px] text-muted">
          It is usually a brief connection problem. Everything you have saved is safe. Try again, or go back to Today.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={reset}>
            <RotateCw aria-hidden />
            Try again
          </Button>
          <Link href={routes.today} className={buttonVariants({ variant: "secondary" })}>
            Go to Today
          </Link>
        </div>
        {error.digest ? <p className="num text-[13px] text-faint">Reference {error.digest}</p> : null}
      </div>
    </PageContainer>
  );
}
