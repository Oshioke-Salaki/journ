"use server";

import { isValidTimeZone } from "@/lib/dates";
import { env } from "@/lib/env";
import { fail, invalid, ok, UNEXPECTED_ERROR, type ActionResult } from "@/lib/result";
import { routes, safeNextPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import { authErrorMessage } from "./errors";
import { requireUser } from "@/lib/auth/session";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  type ChangePasswordInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type SignInInput,
  type SignUpInput,
} from "./schemas";

type Redirect = { next: string };

export async function signUp(input: SignUpInput): Promise<ActionResult<Redirect | { confirmEmail: true }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { name, email, password, timezone } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name, timezone: timezone && isValidTimeZone(timezone) ? timezone : "UTC" },
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(routes.onboarding)}`,
    },
  });

  if (error) return fail(authErrorMessage(error));
  // With email confirmation off (local development) Supabase signs the member in straight away.
  if (data.session) return ok({ next: routes.onboarding });
  return ok({ confirmEmail: true as const });
}

export async function signIn(input: SignInInput): Promise<ActionResult<Redirect>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return fail(authErrorMessage(error));
  return ok({ next: safeNextPath(parsed.data.next) });
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(routes.resetPassword)}`,
  });
  // Rate limits are worth reporting; anything else is not, so nobody can learn which emails exist.
  if (error && (error.status === 429 || error.code?.startsWith("over_"))) return fail(authErrorMessage(error));
  if (error) console.error("[auth] resetPasswordForEmail", error.code, error.message);
  return ok(undefined);
}

export async function updatePassword(input: ResetPasswordInput): Promise<ActionResult<Redirect>> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return fail("This reset link has expired. Request a new one.");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(authErrorMessage(error));
  return ok({ next: routes.today }, "Your password has been changed.");
}

/** Changes the password of the signed-in member, after checking their current one. */
export async function changePassword(input: ChangePasswordInput): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const user = await requireUser();
  if (!user.email) return fail("This account has no email address, so its password can't be changed here.");

  const supabase = await createClient();
  const { error: checkError } = await supabase.auth.signInWithPassword({ email: user.email, password: parsed.data.current });
  if (checkError) {
    if (checkError.code === "invalid_credentials") return fail("Check the highlighted fields.", { current: ["That isn't your current password."] });
    return fail(authErrorMessage(checkError));
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return fail(authErrorMessage(error));
  return ok(undefined, "Password changed");
}

/**
 * Ends the session. The caller then does a full page load (not a client navigation), so pages
 * Next.js keeps alive for instant back-navigation can't carry one member's data into the next
 * session on a shared device.
 */
export async function signOut(): Promise<ActionResult<{ next: string }>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[auth] signOut", error.message);
    return fail(UNEXPECTED_ERROR);
  }
  return ok({ next: routes.home });
}
