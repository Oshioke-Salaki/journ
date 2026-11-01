"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Mark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { clearAllDrafts } from "@/features/journal/components/use-draft";
import { checkCode, lastActive, lockSnapshot, markActive, readLock, removeLock, subscribeLock } from "@/lib/app-lock";
import { notify } from "@/lib/notify";

const subscribeLocked = (listener: () => void) => {
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-locked"] });
  return () => observer.disconnect();
};
const isLocked = () => document.documentElement.hasAttribute("data-locked");

/**
 * Covers the app until the code is entered, when an app lock is set on this device. The head
 * script hides the page before first paint; this shows the code screen and re-locks after the
 * chosen time away.
 */
export function AppLock() {
  const config = useSyncExternalStore(subscribeLock, lockSnapshot, () => null);
  const locked = useSyncExternalStore(subscribeLocked, isLocked, () => false);

  // Keep "last active" fresh while in use; lock when coming back after too long away.
  useEffect(() => {
    if (!config) return;
    const onVisibility = () => {
      const lock = readLock();
      if (!lock || isLocked()) return;
      if (document.visibilityState === "hidden") return markActive();
      if (Date.now() - lastActive() > lock.minutes * 60_000) document.documentElement.setAttribute("data-locked", "");
      else markActive();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const tick = setInterval(() => document.visibilityState === "visible" && !isLocked() && markActive(), 20_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(tick);
    };
  }, [config]);

  if (!config || !locked) return null;
  return <LockScreen />;
}

function LockScreen() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const [checking, startChecking] = useTransition();
  const [leaving, startLeaving] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);

  const unlock = () =>
    startChecking(async () => {
      if (Date.now() < waitUntil) return setError("Too many tries. Wait a moment, then try again.");
      if (await checkCode(code)) {
        markActive();
        document.documentElement.removeAttribute("data-locked");
        return;
      }
      const next = failures + 1;
      setFailures(next);
      setCode("");
      // After five wrong codes, each further try waits longer.
      if (next >= 5) setWaitUntil(Date.now() + Math.min(300, 15 * 2 ** (next - 5)) * 1000);
      setError(next >= 5 ? "Too many tries. Wait a moment, then try again." : "That code isn't right.");
      input.current?.focus();
    });

  const forgot = () =>
    startLeaving(async () => {
      const result = await signOut();
      if (!result.ok) return void notify.error(result.error);
      clearAllDrafts();
      removeLock();
      window.location.assign(result.data.next);
    });

  return (
    <div data-app-lock role="dialog" aria-modal="true" aria-labelledby="lock-title" className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-surface px-6 pt-safe">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length >= 4) unlock();
        }}
        className="flex w-full max-w-[320px] flex-col items-center gap-6 text-center"
      >
        <Mark className="size-14 rounded-[16px]" title={null} />
        <div className="flex flex-col gap-1">
          <h1 id="lock-title" className="text-[24px] font-semibold tracking-[-0.02em] text-ink">
            JournApp is locked
          </h1>
          <p className="text-[15px] text-muted">Enter your code to open it.</p>
        </div>
        <label htmlFor="lock-code" className="sr-only">
          App lock code
        </label>
        <input
          ref={input}
          id="lock-code"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, ""));
            setError(null);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "lock-error" : undefined}
          className="num h-14 w-full rounded-[16px] border border-border bg-surface text-center text-[28px] tracking-[0.5em] text-ink focus:border-accent focus:ring-4 focus:ring-accent/15 focus:outline-none"
        />
        {error ? (
          <p id="lock-error" role="alert" className="-mt-3 text-[14px] font-medium text-negative">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" loading={checking} disabled={code.length < 4 || leaving}>
          Unlock
        </Button>
        <Button type="button" variant="link" onClick={forgot} loading={leaving} disabled={checking}>
          Forgot your code? Sign out
        </Button>
      </form>
    </div>
  );
}
