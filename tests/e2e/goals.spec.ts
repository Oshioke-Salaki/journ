import { expect, test } from "@playwright/test";
import { expectToast, signUpAndOnboard } from "./helpers";

function isoIn(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

test("set a goal, work through its steps and see it in plans", async ({ page }) => {
  await signUpAndOnboard(page, "Adaeze", "goals");
  await page.goto("/space/goals/new");

  await page.getByLabel("What do you want to achieve?").filter({ visible: true }).fill("Walk every morning");
  await page.getByLabel(/Why does it matter/).filter({ visible: true }).fill("I think more clearly when I move first.");
  await page.getByRole("button", { name: "Body" }).click();
  await page.getByLabel("Step 1", { exact: true }).filter({ visible: true }).fill("Lay out shoes the night before");
  await page.getByLabel("Date for step 1").filter({ visible: true }).fill(isoIn(1));
  await page.getByRole("button", { name: "Add a step" }).click();
  await page.getByLabel("Step 2", { exact: true }).filter({ visible: true }).fill("Walk ten minutes");
  await page.getByRole("button", { name: "Set goal" }).click();
  await expectToast(page, "Goal set");

  await expect(page).toHaveURL(/\/space\/goals\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "Walk every morning" })).toBeVisible();
  await expect(page.getByText("0 of 2 steps done").filter({ visible: true })).toBeVisible();

  await page.getByRole("checkbox", { name: "Mark done: Walk ten minutes" }).click();
  await expect(page.getByText("1 of 2 steps done").filter({ visible: true })).toBeVisible();

  await page.getByLabel("New step", { exact: true }).filter({ visible: true }).fill("Walk twenty minutes");
  await page.getByRole("button", { name: "Add step" }).click();
  await expect(page.getByText("1 of 3 steps done").filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Mark done: Walk twenty minutes" })).toBeEnabled();

  // Today shows the next step when goal prompts are on (they are by default).
  await page.goto("/today");
  await expect(page.getByRole("region", { name: "Towards your goals" }).getByText("Lay out shoes the night before").filter({ visible: true })).toBeVisible();

  await page.goto("/space");
  await expect(page.getByRole("region", { name: "My plans" }).getByText("Lay out shoes the night before").filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("region", { name: /My goals/ }).getByText("1 of 3 steps").filter({ visible: true })).toBeVisible();

  await page.getByRole("region", { name: /My goals/ }).getByRole("link", { name: /Walk every morning/ }).click();
  await page.getByRole("button", { name: "Mark achieved" }).click();
  await expectToast(page, "Goal achieved");
  await expect(page.getByText(/^Achieved · Body/).filter({ visible: true })).toBeVisible();

  await page.getByRole("button", { name: "Delete" }).first().click();
  await page.getByRole("button", { name: "Delete goal" }).click();
  await expectToast(page, "Goal deleted");
  await expect(page).toHaveURL(/\/space\/goals$/);
  await expect(page.getByText("You haven't set a goal yet").filter({ visible: true })).toBeVisible();
});

test("a goal needs a name", async ({ page }) => {
  await signUpAndOnboard(page, "Kemi", "goalname");
  await page.goto("/space/goals/new");
  await page.getByRole("button", { name: "Set goal" }).click();
  await expect(page.getByText("Give your goal a name.").filter({ visible: true })).toBeVisible();
});
