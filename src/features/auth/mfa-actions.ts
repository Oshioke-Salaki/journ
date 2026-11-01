"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser, requireUser } from "@/lib/auth/session";
import { fail, ok, UNEXPECTED_ERROR, type ActionResult } from "@/lib/result";
import { routes, safeNextPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

const code = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your app.");

/** Starts setting up an authenticator app: returns the QR code and the key to type in by hand. */
export async function startTotp(): Promise<ActionResult<{ factorId: string; qr: string; secret: string }>> {
  await requireUser();
  const supabase = await createClient();
  // A half-finished setup from before is replaced.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) {
    if (f.factor_type === "totp" && f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${Date.now()}`, issuer: "JournApp" });
  if (error) {
    console.error("[mfa] enroll", error.code, error.message);
    return fail(UNEXPECTED_ERROR);
  }
  return ok({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
}

/** Finishes setup with the first code from the app. The session is upgraded straight away. */
export async function confirmTotp(factorId: string, input: string): Promise<ActionResult> {
  const parsed = code.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message, { code: [parsed.error.issues[0].message] });
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: parsed.data });
  if (error) return fail("That code didn't work. Check the time on your phone and try the newest code.", { code: ["That code didn't work."] });
  revalidatePath(routes.settings);
  return ok(undefined, "Two-step sign-in is on");
}

/** Turns two-step sign-in off. Needs a session that has passed it (Supabase checks). */
export async function removeTotp(factorId: string): Promise<ActionResult> {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) {
    console.error("[mfa] unenroll", error.code, error.message);
    return fail(UNEXPECTED_ERROR);
  }
  revalidatePath(routes.settings);
  return ok(undefined, "Two-step sign-in is off");
}

/** The second step of signing in. */
export async function verifySignIn(input: string, next?: string): Promise<ActionResult<{ next: string }>> {
  const parsed = code.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message, { code: [parsed.error.issues[0].message] });
  const user = await getSessionUser();
  if (!user) return fail("Your sign-in expired. Please sign in again.");
  const supabase = await createClient();
  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp.find((f) => f.status === "verified");
  if (listError || !factor) return ok({ next: safeNextPath(next) });
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: parsed.data });
  if (error) return fail("That code didn't work. Try the newest code from your app.", { code: ["That code didn't work."] });
  return ok({ next: safeNextPath(next) });
}
