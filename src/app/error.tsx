"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-[560px] flex-col justify-center gap-4 px-5 py-16" role="alert">
      <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-ink">Something didn&rsquo;t load</h1>
      <p className="text-[17px] text-muted">
        It is probably a brief connection problem. Your entries are safe. Try again, and if it keeps happening, sign out and back in.
      </p>
      {error.digest ? <p className="num text-[13px] text-faint">Reference {error.digest}</p> : null}
      <Button onClick={reset} className="self-start">
        Try again
      </Button>
    </div>
  );
}
