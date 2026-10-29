import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { env } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * A Supabase client bound to the current request's cookies. Create one per request; never share.
 * Member data is always read at request time (`connection()`): it is never prerendered or
 * prefetched, and the session's expiry check runs against the real clock. Call this inside a
 * Suspense boundary, a route handler or an action.
 */
export async function createClient() {
  const cookieStore = await cookies();
  await connection();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only. The proxy refreshes
            // the session on every request, so this is safe to ignore.
          }
        },
      },
    },
  );
}
