import { expect, test } from "@playwright/test";
import { expectToast, PASSWORD, signUpAndOnboard } from "./helpers";

test("change password from settings", async ({ page }) => {
  const { email } = await signUpAndOnboard(page, "Achieng", "password");
  await page.goto("/settings");
  const section = page.getByRole("region", { name: "Password" });

  await section.getByLabel("Current password").fill("Not-my-password-1");
  await section.getByLabel("New password", { exact: true }).fill("Brand-new-mornings-2026");
  await section.getByLabel("Repeat new password").fill("Brand-new-mornings-2026");
  await section.getByRole("button", { name: "Change password" }).click();
  await expect(section.getByText("That isn't your current password.")).toBeVisible();

  await section.getByLabel("Current password").fill(PASSWORD);
  await section.getByRole("button", { name: "Change password" }).click();
  await expectToast(page, "Password changed");
  await expect(section.getByLabel("Current password")).toHaveValue("");

  // Still signed in; then the new password works and the old one doesn't.
  await page.goto("/today");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Achieng");
  await page.context().clearCookies();
  await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
  await page.getByLabel("Email").filter({ visible: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expectToast(page, "That email and password don't match");
  await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill("Brand-new-mornings-2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/today/);
});

test("profile, preferences, theme, export and delete", async ({ page }) => {
  const { email } = await signUpAndOnboard(page, "Rael", "settings");
  await page.goto("/settings");

  await page.getByLabel("First name").filter({ visible: true }).fill("Rael M");
  const place = page.getByRole("combobox", { name: /Place of birth/ });
  await place.fill("Nairobi");
  // A live place search (Open-Meteo). If it is unreachable, the typed text is kept instead.
  const firstPlace = page.getByRole("option").first();
  if (await firstPlace.waitFor({ state: "visible", timeout: 10_000 }).then(() => true, () => false)) await firstPlace.click();
  else await place.blur();
  const country = page.getByRole("combobox", { name: /Country you live in/ });
  await country.fill("Ken");
  await page.getByRole("option", { name: "Kenya" }).click();
  await page.getByRole("button", { name: "she/her" }).click();
  await page.getByRole("button", { name: "Save profile" }).click();
  await expectToast(page, "Profile saved");

  await page.reload();
  await expect(page.getByRole("combobox", { name: /Place of birth/ })).toHaveValue(/^Nairobi/);
  await expect(page.getByRole("combobox", { name: /Country you live in/ })).toHaveValue("Kenya");
  await expect(page.getByRole("button", { name: "she/her" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("switch", { name: /A daily check-in reminder/ }).click();
  await page.getByLabel("Remind me at").filter({ visible: true }).fill("07:30");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expectToast(page, "Preferences saved");

  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("radio", { name: "Match device" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download my data" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^journapp-data-\d{4}-\d{2}-\d{2}\.json$/);
  const json = JSON.parse(await (await file.createReadStream()).toArray().then((c) => Buffer.concat(c).toString()));
  expect(json.profile.display_name).toBe("Rael M");
  expect(json.profile.country).toBe("KE");
  expect(json.profile.birth_place).toMatch(/^Nairobi/);
  // Chosen from the place search: the location astrology needs is stored with it.
  expect(json.profile.birth_timezone).toBe("Africa/Nairobi");
  expect(Number(json.profile.birth_latitude)).toBeCloseTo(-1.28, 1);
  expect(json.profile.role).toBeUndefined();

  await page.getByRole("button", { name: "Delete account" }).click();
  const confirm = page.getByRole("button", { name: "Delete everything" });
  await expect(confirm).toBeDisabled();
  await page.getByLabel("Type DELETE to confirm").filter({ visible: true }).fill("delete");
  await confirm.click();
  await expect(page).toHaveURL(/\/$/);
  await expectToast(page, "Your account has been deleted");

  await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
  await page.getByLabel("Email").filter({ visible: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expectToast(page, "That email and password don't match");
});
