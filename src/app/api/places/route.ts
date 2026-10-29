import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";

export type Place = {
  id: number;
  name: string;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
};

type OpenMeteoResult = {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

/**
 * Town and city search for "Place of birth", through Open-Meteo's free geocoding API (no key, no
 * account). Only the typed text is sent, never who is asking. Signed-in members only.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ places: [] }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  const country = request.nextUrl.searchParams.get("country")?.toUpperCase();
  if (q.length < 2) return NextResponse.json({ places: [] });

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", q);
  url.searchParams.set("count", "8");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  if (country && /^[A-Z]{2}$/.test(country)) url.searchParams.set("countryCode", country);

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as { results?: OpenMeteoResult[] };
    const places: Place[] = (data.results ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      region: r.admin1 ?? null,
      country: r.country ?? null,
      countryCode: r.country_code ?? null,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone ?? null,
    }));
    return NextResponse.json({ places }, { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch (error) {
    console.error("[places] search failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ places: [], error: "unavailable" }, { status: 502 });
  }
}
