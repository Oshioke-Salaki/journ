import { expect, test } from "@playwright/test";
import { expectToast, grantAdmin, navigate, signUpAndOnboard } from "./helpers";

test("the journal is one tap away, everywhere", async ({ page }) => {
  await signUpAndOnboard(page, "Tumi", "nav-journal");
  await page.goto("/journal/new");
  await page.getByRole("textbox", { name: "Your entry" }).click();
  await page.keyboard.type("Found my way back here");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/journal\/[0-9a-f-]{36}$/);

  await page.goto("/today");
  await navigate(page, "Journal");
  await expect(page.getByRole("heading", { name: "Journal", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Found my way back here/ })).toBeVisible();

  await navigate(page, "My Space");
  await expect(page.getByRole("region", { name: "My journal" }).getByRole("link", { name: /Found my way back here/ })).toBeVisible();
  const shortcuts = page.getByRole("navigation", { name: "My Space shortcuts" });
  for (const name of ["My journal", "What can I control?", "My goals", "Vision board"]) await expect(shortcuts.getByRole("link", { name })).toBeVisible();
  await shortcuts.getByRole("link", { name: "What can I control?" }).click();
  await expect(page.getByRole("heading", { name: "What can I control?", level: 1 })).toBeVisible();
});

test("past days open from My Space with everything from that day", async ({ page }) => {
  await signUpAndOnboard(page, "Nala", "day");
  await page.goto("/check-in?mood=4");
  await page.getByRole("button", { name: "Continue" }).click();
  for (let i = 0; i < 2; i++) await page.getByRole("button", { name: "Skip" }).click();
  await page.getByLabel(/A line about today/).filter({ visible: true }).fill("Calm evening.");
  await page.getByRole("button", { name: "Save check-in" }).click();
  await expect(page.getByRole("heading", { name: "Checked in for today" })).toBeVisible();

  await page.goto("/journal/new");
  await page.getByRole("textbox", { name: "Your entry" }).click();
  await page.keyboard.type("Notes from today");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/journal\/[0-9a-f-]{36}$/);

  await page.goto("/space");
  await page.getByRole("link", { name: /^Open .*/ }).filter({ visible: true }).last().click();
  await expect(page).toHaveURL(/\/space\/day\/\d{4}-\d{2}-\d{2}$/);
  await expect(page.getByText("Today", { exact: true }).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByRole("region", { name: "Check-in" }).getByRole("heading", { name: "Good" })).toBeVisible();
  await expect(page.getByText("“Calm evening.”").filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Notes from today/ })).toBeVisible();

  await page.getByRole("link", { name: "Previous day" }).click();
  await expect(page.getByText("No check-in this day").filter({ visible: true })).toBeVisible();
  await expect(page.getByText("Nothing written this day.").filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Next day" })).toBeVisible();

  await page.goto("/space/day/2999-01-01");
  await expect(page.getByRole("heading", { name: "This page isn’t here" })).toBeVisible();
});

test("goal steps can be edited in place", async ({ page }) => {
  await signUpAndOnboard(page, "Juma", "step-edit");
  await page.goto("/space/goals/new");
  await page.getByLabel("What do you want to achieve?").filter({ visible: true }).fill("Sleep earlier");
  await page.getByLabel("Step 1", { exact: true }).filter({ visible: true }).fill("Phone away at 10");
  await page.getByRole("button", { name: "Set goal" }).click();
  await expect(page).toHaveURL(/\/space\/goals\/[0-9a-f-]{36}$/);

  await page.getByRole("button", { name: "Edit step: Phone away at 10" }).click();
  await page.getByRole("textbox", { name: "Step", exact: true }).fill("Phone away at 9:30");
  await page.getByLabel("Step date").filter({ visible: true }).fill("2030-01-15");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expectToast(page, "Step updated");
  await page.reload();
  await expect(page.getByRole("button", { name: "Edit step: Phone away at 9:30" })).toBeVisible();
  await expect(page.getByText("15 Jan").filter({ visible: true })).toBeVisible();

  await page.getByRole("button", { name: "Edit step: Phone away at 9:30" }).click();
  await page.getByRole("textbox", { name: "Step", exact: true }).fill("Changed my mind");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Edit step: Phone away at 9:30" })).toBeVisible();
});

test("admins manage the admin team", async ({ page, browser }) => {
  test.setTimeout(process.env.E2E_REMOTE ? 240_000 : 90_000);
  // A second member to promote, in their own browser.
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  const { email: helperEmail } = await signUpAndOnboard(otherPage, "Helper", "team-helper");
  await other.close();

  const { email } = await signUpAndOnboard(page, "Lead", "team-lead");
  grantAdmin(email);
  await page.goto("/admin");
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Team" }).click();
  await expect(page.getByRole("heading", { name: "Team", level: 1 })).toBeVisible();
  await expect(page.getByText("You").filter({ visible: true })).toBeVisible();

  await page.getByLabel("Add an admin by email").filter({ visible: true }).fill("nobody-here@example.test");
  await page.getByRole("button", { name: "Add admin" }).click();
  await expectToast(page, "No JournApp account uses that email");

  await page.getByLabel("Add an admin by email").filter({ visible: true }).fill(helperEmail);
  await page.getByRole("button", { name: "Add admin" }).click();
  await expectToast(page, "Admin added");
  await expect(page.getByRole("region", { name: /admins?$/ }).getByRole("listitem").filter({ hasText: helperEmail })).toBeVisible();

  await page.getByRole("region", { name: /admins?$/ }).getByRole("listitem").filter({ hasText: helperEmail }).getByRole("button", { name: "Remove" }).click();
  await page.getByRole("button", { name: "Remove admin" }).click();
  await expectToast(page, "Admin removed");
  await expect(page.getByRole("region", { name: /admins?$/ }).getByRole("listitem").filter({ hasText: helperEmail })).toHaveCount(0);
});
