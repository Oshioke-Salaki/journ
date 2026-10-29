import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/** Public pages may be indexed; everything a member signs in for stays out of search engines. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/help", "/privacy", "/terms", "/sign-up", "/sign-in"],
      disallow: ["/today", "/check-in", "/journal", "/discover", "/community", "/space", "/control", "/settings", "/onboarding", "/admin", "/api", "/auth"],
    },
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
