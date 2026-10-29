import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { localDate } from "@/lib/dates";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Data access layer for the signed-in member. Every page and action goes through these, so the
 * session is verified in one place. Each helper is memoised for the length of one request.
 *
 * These read cookies, so call them inside a <Suspense> boundary (pages) or from an action.
 */

export type SessionUser = { id: string; email: string | null };

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? null };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(routes.signIn);
  return user;
}

export type Profile = Tables<"profiles">;

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw new Error(`Could not load profile: ${error.message}`);
  return data;
});

export type Member = { user: SessionUser; profile: Profile; today: string };

/** A signed-in member who has finished onboarding. Sends everyone else where they need to go. */
export async function requireMember(): Promise<Member> {
  const user = await requireUser();
  const profile = await getProfile();
  if (!profile) redirect(routes.signIn);
  if (!profile.onboarded_at) redirect(routes.onboarding);
  return { user, profile, today: localDate(profile.timezone) };
}

/** First name for greetings: the first word of the display name. */
export function firstName(profile: Pick<Profile, "display_name">) {
  return profile.display_name?.trim().split(/\s+/)[0] ?? null;
}

/** An admin. Anyone else gets a plain 404, so the admin area does not reveal that it exists. */
export async function requireAdmin(): Promise<{ user: SessionUser; profile: Profile }> {
  const user = await requireUser();
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") notFound();
  return { user, profile };
}
