"use client";

import { LocateFixed } from "lucide-react";
import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboOption } from "@/components/ui/combobox";
import { Description, Field, Label } from "@/components/ui/field";
import { updateTimezone } from "@/features/profile/actions";
import { deviceTimeZone, timeZoneLabel } from "@/lib/dates";
import { toastResult } from "@/lib/notify";

function allZones(): ComboOption[] {
  const zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return ["UTC", ...zones.filter((z) => z !== "UTC")].map((z) => ({ value: z, label: timeZoneLabel(z), detail: z }));
}

/** The zone that decides when each of the member's days starts and ends. */
export function TimezoneForm({ current }: { current: string }) {
  const [value, setValue] = useState(current);
  const [pending, startTransition] = useTransition();
  const options = useMemo(() => allZones(), []);
  const device = useSyncExternalStore(
    () => () => {},
    deviceTimeZone,
    () => null,
  );

  const save = (zone: string) =>
    startTransition(async () => {
      const result = toastResult(await updateTimezone(zone));
      if (result.ok) setValue(zone);
    });

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <Label>Time zone</Label>
        <Description>Your day starts at midnight here. Check-ins, trackers and journal dates follow it.</Description>
        <Combobox value={value} onChange={(o) => o && setValue(o.value)} options={options} placeholder="Search for a city" emptyText="No time zone matches" />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {device && device !== value ? (
          <Button type="button" variant="ghost" size="sm" className="-ml-3" disabled={pending} onClick={() => save(device)}>
            <LocateFixed aria-hidden />
            Use this device: {timeZoneLabel(device)}
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" loading={pending} disabled={value === current} onClick={() => save(value)}>
          Save time zone
        </Button>
      </div>
    </div>
  );
}
