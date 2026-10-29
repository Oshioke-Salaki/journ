import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { GUEST_ONLY_PATHS, isProtectedPath, routes } from "@/lib/routes";
import type { Database } from "./database.types";

/**
 * Refreshes the member's session on every request and makes the optimistic routing decision.
 * This is not the security boundary: every page and action verifies the user again, and row
 * level security in Postgres has the final say.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers ?? {})) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  // Do not run code between creating the client and getClaims(): it refreshes the session.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  if (!signedIn && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = routes.signIn;
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return redirectWithCookies(url, response);
  }

  if (signedIn && (GUEST_ONLY_PATHS as readonly string[]).includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = routes.today;
    url.search = "";
    return redirectWithCookies(url, response);
  }

  return response;
}

/** A redirect that keeps any refreshed session cookies from the pass-through response. */
function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}
