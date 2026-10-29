import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { routes, safeNextPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

/**
 * Email links built from `{{ .TokenHash }}` land here. Unlike the PKCE callback, these work when the
 * link is opened on a different device from the one that asked for it. See docs/DEPLOYMENT.md.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
    console.error("[auth] verifyOtp", error.code, error.message);
  }

  const url = new URL(routes.signIn, origin);
  url.searchParams.set("error", "link");
  return NextResponse.redirect(url);
}
