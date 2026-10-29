import { describe, expect, it } from "vitest";
import { isProtectedPath, safeNextPath } from "@/lib/routes";

describe("routes", () => {
  it("only accepts same-site paths after sign-in", () => {
    expect(safeNextPath("/space/goals")).toBe("/space/goals");
    expect(safeNextPath("//evil.example")).toBe("/today");
    expect(safeNextPath("/\\evil.example")).toBe("/today");
    expect(safeNextPath("https://evil.example")).toBe("/today");
    expect(safeNextPath(null)).toBe("/today");
  });

  it("protects member areas and leaves public pages open", () => {
    for (const p of ["/today", "/check-in", "/journal/abc", "/space/vision", "/admin/videos", "/control"]) expect(isProtectedPath(p)).toBe(true);
    for (const p of ["/", "/sign-in", "/help", "/privacy", "/todayish"]) expect(isProtectedPath(p)).toBe(false);
  });
});
