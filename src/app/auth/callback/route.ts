import { NextResponse, type NextRequest } from "next/server";
import { routes, safeNextPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

/** Email links (confirm sign-up, reset password) land here with a PKCE code to exchange. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
    console.error("[auth] exchangeCodeForSession", error.code, error.message);
  }

  const url = new URL(routes.signIn, origin);
  url.searchParams.set("error", "link");
  return NextResponse.redirect(url);
}
