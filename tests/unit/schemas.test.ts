import { describe, expect, it } from "vitest";
import { passwordSchema, resetPasswordSchema, signUpSchema } from "@/features/auth/schemas";
import { checkInSchema } from "@/features/check-in/schemas";
import { goalSchema } from "@/features/goals/schemas";
import { entrySchema, wordCount } from "@/features/journal/schemas";
import { aboutYouSchema } from "@/features/profile/schemas";

describe("validation", () => {
  it("requires a strong password", () => {
    expect(passwordSchema.safeParse("Calm-mornings-2026").success).toBe(true);
    expect(passwordSchema.safeParse("short1A").success).toBe(false);
    expect(passwordSchema.safeParse("alllowercase1").success).toBe(false);
    expect(passwordSchema.safeParse("NoNumbersHere").success).toBe(false);
  });

  it("normalises email and requires consent at sign-up", () => {
    const ok = signUpSchema.parse({ name: " Amara ", email: " Amara@Example.COM ", password: "Calm-mornings-2026", acceptTerms: true });
    expect(ok.email).toBe("amara@example.com");
    expect(ok.name).toBe("Amara");
    expect(signUpSchema.safeParse({ name: "A", email: "a@b.co", password: "Calm-mornings-2026", acceptTerms: false }).success).toBe(false);
  });

  it("checks that new passwords match", () => {
    expect(resetPasswordSchema.safeParse({ password: "Calm-mornings-2026", confirm: "Calm-mornings-2027" }).success).toBe(false);
  });

  it("keeps optional profile details optional", () => {
    const v = aboutYouSchema.parse({ dateOfBirth: "", birthTime: "", birthPlace: "", country: "", pronouns: "", language: "en" });
    expect(v).toMatchObject({ dateOfBirth: null, birthTime: null, birthPlace: null, country: null, pronouns: null });
    expect(aboutYouSchema.safeParse({ country: "XX", language: "en" }).success).toBe(false);
    expect(aboutYouSchema.safeParse({ birthTime: "25:00", language: "en" }).success).toBe(false);
    expect(aboutYouSchema.safeParse({ dateOfBirth: "2999-01-01", language: "en" }).success).toBe(false);
  });

  it("validates a check-in", () => {
    const base = { mood: 4, energy: null, efficiency: 3, selfSatisfaction: null, body: [{ area: "shoulders", sensation: "tension" }], feelings: ["calm"], note: "  " };
    expect(checkInSchema.parse(base).note).toBeNull();
    expect(checkInSchema.safeParse({ ...base, mood: 6 }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...base, body: [{ area: "tail", sensation: null }] }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...base, feelings: ["ecstatic"] }).success).toBe(false);
  });

  it("validates journal entries and counts words", () => {
    expect(entrySchema.safeParse({ title: "", body: "   ", promptId: null }).success).toBe(false);
    expect(entrySchema.parse({ title: "", body: "Hello", promptId: null }).title).toBeNull();
    expect(wordCount("  one two\nthree  ")).toBe(3);
    expect(wordCount("")).toBe(0);
  });

  it("validates goals and their steps", () => {
    expect(goalSchema.safeParse({ title: "", why: "", area: "body", targetDate: "", steps: [] }).success).toBe(false);
    expect(goalSchema.safeParse({ title: "Walk", why: "", area: "space", targetDate: "", steps: [] }).success).toBe(false);
    expect(goalSchema.parse({ title: "Walk", why: "", area: "body", targetDate: "", steps: [{ title: "Shoes", dueDate: "" }] }).steps[0].dueDate).toBeNull();
  });
});
