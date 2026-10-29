import { expect, test } from "@playwright/test";
import { expectToast, signUpAndOnboard } from "./helpers";

test("write, read, edit and delete a journal entry", async ({ page }) => {
  await signUpAndOnboard(page, "Imani", "journal");

  await page.getByRole("link", { name: "Write about this" }).click();
  await expect(page).toHaveURL(/\/journal\/new\?prompt=today/);
  const prompt = page.locator("main p.italic").first();
  await expect(prompt).toBeVisible();

  await page.getByLabel("Title").filter({ visible: true }).fill("Morning pages");
  await page.getByLabel("Your entry").filter({ visible: true }).fill("I can control how I start the morning.\nThe rest can wait.");
  await expect(page.getByText("12 words").filter({ visible: true })).toBeVisible();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expectToast(page, "Entry saved");

  await expect(page).toHaveURL(/\/journal\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "Morning pages" })).toBeVisible();
  await expect(page.getByText("The rest can wait.").filter({ visible: true })).toBeVisible();

  await page.getByRole("link", { name: "Edit" }).click();
  await page.getByLabel("Your entry").filter({ visible: true }).fill("Edited: one step at a time.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expectToast(page, "Changes saved");
  await expect(page.getByText("Edited: one step at a time.").filter({ visible: true })).toBeVisible();

  await page.goto("/journal");
  await expect(page.getByText("1 entry").filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Morning pages/ })).toBeVisible();

  await page.getByRole("link", { name: /Morning pages/ }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("alertdialog", { name: "Delete this entry?" })).toBeVisible();
  await page.getByRole("button", { name: "Delete entry" }).click();
  await expectToast(page, "Entry deleted");
  await expect(page).toHaveURL(/\/journal$/);
  await expect(page.getByText("Your journal is empty").filter({ visible: true })).toBeVisible();
});

test("an unsaved draft survives a reload", async ({ page }) => {
  await signUpAndOnboard(page, "Halima", "draft");
  await page.goto("/journal/new");
  await page.getByLabel("Your entry").filter({ visible: true }).fill("Words I don't want to lose");
  await page.waitForTimeout(700);
  page.on("dialog", (d) => d.accept());
  await page.reload();
  await expect(page.getByLabel("Your entry").filter({ visible: true })).toHaveValue("Words I don't want to lose");
  await expectToast(page, "Draft restored");
});

test("an entry that isn't yours shows not found", async ({ page }) => {
  await signUpAndOnboard(page, "Esi", "notfound");
  await page.goto("/journal/00000000-0000-0000-0000-000000000000");
  await expect(page.getByRole("heading", { name: "This page isn’t here" })).toBeVisible();
});
