import { expect, test } from "@playwright/test";
import { signUpAndOnboard } from "./helpers";

test("a full check-in lands on Today and in My Space", async ({ page }) => {
  await signUpAndOnboard(page, "Nia", "checkin");
  await expect(page.getByText("You haven't checked in yet today.").filter({ visible: true })).toBeVisible();

  // One tap on Today starts the check-in with the mood set.
  await page.getByRole("link", { name: "Good", exact: true }).click();
  await expect(page).toHaveURL(/\/check-in\?mood=4/);
  await expect(page.getByRole("radio", { name: "Good", exact: true })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "Continue" }).click();

  // Body map: tap shoulders and the lower back, describe one.
  await expect(page.getByRole("heading", { name: "Where do you feel it in your body?" })).toBeVisible();
  await page.getByRole("checkbox", { name: "Shoulders" }).click();
  await page.getByRole("button", { name: "Lower back" }).click();
  await page.getByRole("group", { name: "What your shoulders feels like" }).getByRole("button", { name: "Tension" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "And the rest of you?" })).toBeVisible();
  await page.getByRole("radiogroup", { name: "How is your energy?" }).getByRole("radio", { name: "2 of 5" }).click();
  await page.getByRole("radiogroup", { name: "How efficient do you feel?" }).getByRole("radio", { name: "4 of 5" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Grateful" }).click();
  await page.getByRole("button", { name: "Tired" }).click();
  await page.getByLabel(/A line about today/).filter({ visible: true }).fill("Long day, good people.");
  await page.getByRole("button", { name: "Save check-in" }).click();

  await expect(page.getByRole("heading", { name: "Checked in for today" })).toBeVisible();
  await page.getByRole("link", { name: "Back to Today" }).click();

  await expect(page).toHaveURL(/\/today/);
  await expect(page.getByText("You checked in feeling good.").filter({ visible: true })).toBeVisible();
  const summary = page.getByRole("region", { name: "Today's check-in" });
  await expect(summary.getByRole("heading", { name: "Good" })).toBeVisible();
  await expect(summary.getByText("tension in shoulders, lower back").filter({ visible: true })).toBeVisible();
  await expect(summary.getByText("Grateful, Tired").filter({ visible: true })).toBeVisible();
  await expect(summary.getByText("“Long day, good people.”").filter({ visible: true })).toBeVisible();

  // Updating keeps one check-in per day.
  await summary.getByRole("link", { name: "Update" }).click();
  await page.getByRole("radio", { name: "Great", exact: true }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: /Continue|Skip/ }).last().click();
  await page.getByRole("button", { name: "Update check-in" }).click();
  await expect(page.getByRole("heading", { name: "Today's check-in is updated" })).toBeVisible();

  await page.goto("/space");
  await expect(page.getByRole("img", { name: /Mood over the last 30 days, 1 days with a check-in/ })).toBeVisible();
  await expect(page.getByText("Shoulders").filter({ visible: true })).toBeVisible();
});

test("a check-in cannot be saved without a mood", async ({ page }) => {
  await signUpAndOnboard(page, "Ayo", "nomood");
  await page.goto("/check-in");
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
});
