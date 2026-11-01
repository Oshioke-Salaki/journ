"use client";

import { Globe2 } from "lucide-react";
import { useState, useSyncExternalStore, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateTimezone } from "@/features/profile/actions";
import { deviceTimeZone, sameWallClock, timeZoneLabel } from "@/lib/dates";
import { toastResult } from "@/lib/notify";

const DISMISSED = "journapp:timezone-kept";

function readKept() {
  try {
    return localStorage.getItem(DISMISSED);
  } catch {
    return null;
  }
}

/**
 * When the device is somewhere whose clock differs from the profile's zone (she travelled), offers
 * to move her days there. "Keep" is remembered per pair of zones, so it asks again on the next trip.
 */
export function TimezoneNudge({ saved }: { saved: string }) {
  const device = useSyncExternalStore(() => () => {}, deviceTimeZone, () => null);
  const kept = useSyncExternalStore(() => () => {}, readKept, () => null);
  const [hidden, setHidden] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!device || hidden || sameWallClock(device, saved) || kept === `${saved}>${device}`) return null;

  const keep = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISSED, `${saved}>${device}`);
    } catch {}
  };
  const move = () =>
    startTransition(async () => {
      const result = toastResult(await updateTimezone(device));
      if (result.ok) setHidden(true);
    });

  return (
    <aside aria-label="Time zone" className="flex items-start gap-4 rounded-[var(--radius-panel)] bg-raised p-4 sm:items-center lg:col-span-12">
      <Globe2 className="mt-0.5 size-5 shrink-0 text-muted sm:mt-0" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-ink">
          Looks like you&apos;re in {timeZoneLabel(device)}. Your days still follow {timeZoneLabel(saved)}.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" loading={pending} onClick={move}>
            Use {timeZoneLabel(device).split(" (")[0]}
          </Button>
          <Button size="sm" variant="ghost" onClick={keep} disabled={pending}>
            Keep
          </Button>
        </div>
      </div>
    </aside>
  );
}
