"use client";

import { Share, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Mark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";

const DISMISSED = "journapp:install-dismissed";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

type Env = { show: boolean; ios: boolean };
const HIDDEN: Env = { show: false, ios: false };
let cached: Env | null = null;

function readEnv(): Env {
  if (cached) return cached;
  try {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const dismissed = localStorage.getItem(DISMISSED) === "1";
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    cached = { show: touch && !standalone && !dismissed, ios };
  } catch {
    cached = HIDDEN;
  }
  return cached;
}

/** Suggests adding JournApp to the home screen, on phones and tablets that haven't yet. */
export function InstallCard() {
  const env = useSyncExternalStore(
    () => () => {},
    readEnv,
    () => HIDDEN,
  );
  const [hidden, setHidden] = useState(false);
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {}
  };

  if (!env.show || hidden || (!env.ios && !prompt)) return null;

  return (
    <aside aria-label="Install JournApp" className="flex items-start gap-4 rounded-[var(--radius-panel)] bg-raised p-4 lg:col-span-12">
      <Mark className="size-11 rounded-[12px]" title={null} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-[15px] font-medium text-ink">Add JournApp to your home screen</p>
        {env.ios ? (
          <p className="text-[14px] text-muted">
            Tap <Share className="inline size-4 align-[-3px]" aria-label="Share" /> in Safari, then <span className="font-medium text-ink">Add to Home Screen</span>. It opens full screen,
            like any app.
          </p>
        ) : (
          <>
            <p className="text-[14px] text-muted">Open it in one tap, full screen, like any app.</p>
            <Button
              size="sm"
              className="mt-2 self-start"
              onClick={async () => {
                if (!prompt) return;
                await prompt.prompt();
                const choice = await prompt.userChoice;
                if (choice.outcome === "accepted") dismiss();
                setPrompt(null);
              }}
            >
              Install
            </Button>
          </>
        )}
      </div>
      <button type="button" onClick={dismiss} aria-label="Not now" className="-mt-1 -mr-1 grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-active hover:text-ink">
        <X className="size-4" />
      </button>
    </aside>
  );
}
