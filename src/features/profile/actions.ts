"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { isValidTimeZone } from "@/lib/dates";
import { fail, invalid, ok, UNEXPECTED_ERROR, type ActionResult } from "@/lib/result";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import {
  aboutYouSchema,
  onboardingSchema,
  preferencesSchema,
  profileUpdateSchema,
  type OnboardingInput,
  type PreferencesInput,
  type ProfileUpdateInput,
} from "./schemas";
import { z } from "zod";

type AboutYou = z.output<typeof aboutYouSchema>;
type Preferences = z.output<typeof preferencesSchema>;

function aboutColumns(about: AboutYou): TablesUpdate<"profiles"> {
  return {
    date_of_birth: about.dateOfBirth ?? null,
    birth_time: about.birthTime ?? null,
    birth_place: about.birthPlace ?? null,
    birth_latitude: about.birthPlace && about.birthLocation ? about.birthLocation.latitude : null,
    birth_longitude: about.birthPlace && about.birthLocation ? about.birthLocation.longitude : null,
    birth_timezone: about.birthPlace && about.birthLocation ? about.birthLocation.timezone : null,
    birth_country: about.birthPlace && about.birthLocation ? about.birthLocation.countryCode : null,
    country: about.country ?? null,
    pronouns: about.pronouns ?? null,
    language: about.language,
  };
}

function preferenceColumns(p: Preferences): TablesUpdate<"profiles"> {
  return {
    goal_prompts_enabled: p.goalPromptsEnabled,
    reminders_enabled: p.remindersEnabled,
    reminder_time: p.reminderTime,
  };
}

async function updateOwnProfile(values: TablesUpdate<"profiles">): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(values).eq("id", user.id);
  if (error) {
    console.error("[profile] update", error.code, error.message);
    return fail(UNEXPECTED_ERROR);
  }
  return ok(undefined);
}

export async function completeOnboarding(input: OnboardingInput): Promise<ActionResult<{ next: string }>> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { name, about, preferences, timezone } = parsed.data;
  const result = await updateOwnProfile({
    display_name: name,
    ...aboutColumns(about),
    ...preferenceColumns(preferences),
    ...(timezone && isValidTimeZone(timezone) ? { timezone } : {}),
    onboarded_at: new Date().toISOString(),
  });
  if (!result.ok) return result;
  revalidatePath("/", "layout");
  return ok({ next: routes.today });
}

export async function updateProfile(input: ProfileUpdateInput): Promise<ActionResult> {
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const result = await updateOwnProfile({ display_name: parsed.data.name, ...aboutColumns(parsed.data.about) });
  if (!result.ok) return result;
  revalidatePath("/", "layout");
  return ok(undefined, "Profile saved");
}

export async function updatePreferences(input: PreferencesInput): Promise<ActionResult> {
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const result = await updateOwnProfile(preferenceColumns(parsed.data));
  if (!result.ok) return result;
  revalidatePath("/", "layout");
  return ok(undefined, "Preferences saved");
}

export async function updateTimezone(timezone: string): Promise<ActionResult> {
  if (!isValidTimeZone(timezone)) return fail("That timezone isn't recognised.");
  return updateOwnProfile({ timezone });
}

export async function confirmMatureContent(): Promise<ActionResult> {
  const result = await updateOwnProfile({ mature_content_confirmed_at: new Date().toISOString() });
  if (!result.ok) return result;
  revalidatePath(routes.community, "layout");
  return ok(undefined);
}
