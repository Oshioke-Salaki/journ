"use client";

import { Controller, type FieldErrors, type UseFormReturn } from "react-hook-form";
import { Globe, MapPin } from "lucide-react";
import { useCallback, useMemo, useRef } from "react";
import type { Place } from "@/app/api/places/route";
import { Combobox } from "@/components/ui/combobox";
import { Chips } from "@/components/ui/chips";
import { Description, Field, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { countryOptions } from "../countries";
import { PRONOUN_OPTIONS, type AboutYouInput } from "../schemas";

type WithAbout = { about: AboutYouInput };

/** The optional details from the sign-up sketch. Shared by onboarding and settings. */
export function AboutYouFields<T extends WithAbout>({ form }: { form: UseFormReturn<T> }) {
  const f = form as unknown as UseFormReturn<WithAbout>;
  const errors = (f.formState.errors.about ?? {}) as FieldErrors<AboutYouInput>;
  const countries = useMemo(() => countryOptions().map((c) => ({ value: c.code, label: c.name })), []);
  // Results from the place search, kept so the chosen one's coordinates can be saved with it.
  const places = useRef(new Map<string, Place>());
  const searchPlaces = useCallback(async (query: string, signal: AbortSignal) => {
    const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { places: Place[] };
    return data.places.map((p) => {
      const value = String(p.id);
      places.current.set(value, p);
      const label = [p.name, p.region && p.region !== p.name ? p.region : null, p.country].filter(Boolean).join(", ");
      return { value, label, detail: p.timezone ?? undefined };
    });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field error={errors.dateOfBirth?.message}>
          <Label optional>Date of birth</Label>
          <Input type="date" max={new Date().toISOString().slice(0, 10)} {...f.register("about.dateOfBirth")} />
        </Field>
        <Field error={errors.birthTime?.message}>
          <Label optional>Time of birth</Label>
          <Input type="time" {...f.register("about.birthTime")} />
        </Field>
      </div>
      <Field error={errors.birthPlace?.message}>
        <Label optional>Place of birth</Label>
        <Description>Start typing your town or city. With your birth date and time, this lets us offer astrology insights later.</Description>
        <Controller
          control={f.control}
          name="about.birthPlace"
          render={({ field }) => (
            <Combobox
              value={field.value ? "chosen" : null}
              displayValue={field.value ?? ""}
              placeholder="Search for a town or city"
              icon={<MapPin />}
              search={searchPlaces}
              allowFreeText
              emptyText="No places match"
              minChars={2}
              onChange={(option) => {
                field.onChange(option?.label ?? "");
                const place = option ? places.current.get(option.value) : undefined;
                f.setValue("about.birthLocation", place ? { latitude: place.latitude, longitude: place.longitude, timezone: place.timezone, countryCode: place.countryCode } : null, { shouldDirty: true });
              }}
            />
          )}
        />
      </Field>
      <Field error={errors.country?.message}>
        <Label optional>Country you live in</Label>
        <Controller
          control={f.control}
          name="about.country"
          render={({ field }) => (
            <Combobox
              value={field.value || null}
              options={countries}
              placeholder="Search for a country"
              icon={<Globe />}
              emptyText="No countries match"
              onChange={(option) => field.onChange(option?.value ?? "")}
            />
          )}
        />
      </Field>
      <Field error={errors.pronouns?.message}>
        <Label optional id="pronouns-label">Pronouns</Label>
        <Controller
          control={f.control}
          name="about.pronouns"
          render={({ field }) => {
            const value = field.value ?? "";
            const preset = (PRONOUN_OPTIONS as readonly string[]).includes(value);
            return (
              <div className="flex flex-col gap-3">
                <Chips
                  single
                  label="Pronouns"
                  options={[...PRONOUN_OPTIONS.map((p) => ({ value: p, label: p })), { value: "other", label: "Something else" }]}
                  value={value === "" ? [] : preset ? [value] : ["other"]}
                  onChange={(v) => field.onChange(v[0] === "other" ? (preset || !value ? " " : value) : (v[0] ?? ""))}
                />
                {value !== "" && !preset ? (
                  <Input
                    aria-label="Your pronouns"
                    placeholder="Your pronouns"
                    maxLength={40}
                    value={value.trimStart()}
                    onChange={(e) => field.onChange(e.target.value === "" ? " " : e.target.value)}
                    autoFocus
                  />
                ) : null}
              </div>
            );
          }}
        />
      </Field>
    </div>
  );
}
