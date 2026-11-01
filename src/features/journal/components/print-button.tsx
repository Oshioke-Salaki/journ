"use client";

import { Printer } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/use-hydrated";

/** Prints in the light theme whatever the app is set to, so pages come out dark text on white. */
export function PrintButton({ disabled }: { disabled?: boolean }) {
  const hydrated = useHydrated();

  useEffect(() => {
    const root = document.documentElement;
    let previous: string | null = null;
    const before = () => {
      previous = root.getAttribute("data-theme");
      root.setAttribute("data-theme", "light");
    };
    const after = () => {
      if (previous) root.setAttribute("data-theme", previous);
      else root.removeAttribute("data-theme");
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  return (
    <Button onClick={() => window.print()} disabled={disabled || !hydrated}>
      <Printer aria-hidden />
      Print or save as PDF
    </Button>
  );
}
