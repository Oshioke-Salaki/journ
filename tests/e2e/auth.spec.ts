import { expect, test } from "@playwright/test";
import { expectToast, navigate, PASSWORD, signUpAndOnboard, uniqueEmail } from "./helpers";

test.describe("accounts", () => {
  test("a visitor is sent to sign in, and returns where they were going", async ({ page }) => {
    await page.goto("/space/goals");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fspace%2Fgoals/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("sign-up validates every field before sending", async ({ page }) => {
    await page.goto("/sign-up");
  await expect(page.getByRole("button", { name: "Create account" })).toBeEnabled();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Tell us what to call you.").filter({ visible: true })).toBeVisible();
    await expect(page.getByText("Enter a valid email address.").filter({ visible: true })).toBeVisible();
    await expect(page.getByText("Use at least 8 characters.").filter({ visible: true })).toBeVisible();
    await expect(page.getByText("Please accept the terms and privacy policy to continue.").filter({ visible: true })).toBeVisible();

    await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill("lowercaseonly1");
    await page.getByLabel("Password", { exact: true }).filter({ visible: true }).blur();
    await expect(page.getByText("Add an uppercase letter.").filter({ visible: true })).toBeVisible();
  });

  test("sign up, onboard, sign out and sign back in", async ({ page }) => {
    const { email } = await signUpAndOnboard(page, "Wanjiru", "cycle");

    await page.goto("/settings");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Notice what you can control." })).toBeVisible();

    await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
    await page.getByLabel("Email").filter({ visible: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill("Wrong-password-1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expectToast(page, "That email and password don't match");

    await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/today/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Wanjiru");
  });

  test("signing up twice with one email is refused", async ({ page }) => {
    const email = uniqueEmail("twice");
    for (let i = 0; i < 2; i++) {
      if (i === 1) {
        await page.context().clearCookies();
      }
      await page.goto("/sign-up");
  await expect(page.getByRole("button", { name: "Create account" })).toBeEnabled();
      await page.getByLabel("Your first name").filter({ visible: true }).fill("Lina");
      await page.getByLabel("Email").filter({ visible: true }).fill(email);
      await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill(PASSWORD);
      await page.getByRole("checkbox", { name: /I agree/ }).click();
      await page.getByRole("button", { name: "Create account" }).click();
      if (i === 0) await expect(page).toHaveURL(/\/onboarding/);
    }
    await expectToast(page, "An account with this email already exists");
  });

  test("signed-in members skip the welcome page", async ({ page }) => {
    await signUpAndOnboard(page, "Zara", "guest");
    await page.goto("/");
    await expect(page).toHaveURL(/\/today/);
    await navigate(page, "Discover");
    await expect(page.getByRole("heading", { name: "Discover", level: 1 })).toBeVisible();
  });

  test("forgot password confirms without revealing whether the email exists", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("button", { name: "Send reset link" })).toBeEnabled();
    await page.getByLabel("Email").filter({ visible: true }).fill(uniqueEmail("nobody"));
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(/If there is an account for/).filter({ visible: true })).toBeVisible();
  });
});
