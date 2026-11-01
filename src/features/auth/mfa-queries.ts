import "server-only";
import { createClient } from "@/lib/supabase/server";

/** The member's working authenticator app, if they set one up. */
export async function getTotpFactor(): Promise<{ id: string; createdAt: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw new Error(`Could not load sign-in settings: ${error.message}`);
  const factor = data.totp.find((f) => f.status === "verified");
  return factor ? { id: factor.id, createdAt: factor.created_at } : null;
}
