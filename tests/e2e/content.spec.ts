import { expect, test } from "@playwright/test";
import { navigate, signUpAndOnboard } from "./helpers";

test("discover filters by topic and opens a video", async ({ page }) => {
  await signUpAndOnboard(page, "Fola", "discover");
  await navigate(page, "Discover");
  // Other tests add videos through admin, so check the filter by its effect, not a fixed total.
  await expect(page.getByText(/^\d+ videos$/).filter({ visible: true })).toBeVisible();
  await page.getByRole("tab", { name: "Breathing" }).click();
  await expect(page.getByRole("link", { name: /Four-count breathing/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Eating for steady energy/ })).toHaveCount(0);
  await expect(page).toHaveURL(/topic=breathing/);

  await page.getByRole("link", { name: /Four-count breathing/ }).click();
  await expect(page.getByRole("heading", { name: "Four-count breathing for a busy mind" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "being recorded" })).toBeVisible();
});

test("community topics, prompts and the adults-only gate", async ({ page }) => {
  await signUpAndOnboard(page, "Abena", "community");
  await navigate(page, "Community");
  for (const name of ["Nutrition", "Breathing", "Women's health", "Movement", "Sexuality", "Coaching"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }

  await page.getByRole("link", { name: /Sexuality/ }).click();
  await expect(page.getByRole("heading", { name: "This area is for adults" })).toBeVisible();
  await page.getByRole("button", { name: "I am 18 or over" }).click();
  await expect(page.getByRole("heading", { name: "Reflect" })).toBeVisible();

  await page.getByRole("link", { name: /What helps you feel at home in your own body/ }).click();
  await expect(page).toHaveURL(/\/journal\/new\?prompt=/);
  await expect(page.getByText("What helps you feel at home in your own body?").filter({ visible: true })).toBeVisible();
});

test("the welcome page's live check-in answers the mood", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Notice what you can control." })).toBeVisible();
  await page.getByRole("radio", { name: "Low", exact: true }).click();
  await expect(page.getByText("What is weighing on you, and which part of it can you act on?").filter({ visible: true })).toBeVisible();
  await page.getByRole("button", { name: "Watch the introduction" }).click();
  await expect(page.getByRole("dialog", { name: "Welcome to JournApp" })).toBeVisible();
});
