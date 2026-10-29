import { expect, test } from "@playwright/test";
import { expectToast, grantAdmin, signUpAndOnboard, testPng } from "./helpers";

test("trackers save as you tap and survive a reload", async ({ page }) => {
  await signUpAndOnboard(page, "Wambui", "trackers");
  const panel = page.getByRole("region", { name: "Other things to track" });
  for (let i = 0; i < 3; i++) await panel.getByRole("button", { name: "More water" }).click();
  await expect(panel.getByText("3 glasses").filter({ visible: true })).toBeVisible();
  await panel.getByRole("radio", { name: "Well", exact: true }).click();
  // Wait until every tap is saved.
  await expect(panel.locator("ul[aria-busy=false]")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("region", { name: "Other things to track" }).getByText("3 glasses").filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Other things to track" }).getByRole("radio", { name: "Well", exact: true })).toHaveAttribute("aria-checked", "true");
});

test("circle of control: sort a thought and turn it into a goal", async ({ page }) => {
  await signUpAndOnboard(page, "Njeri", "control");
  await page.getByRole("link", { name: "Start sorting" }).click();
  await expect(page.getByRole("heading", { name: "What can I control?", level: 1 })).toBeVisible();

  await page.getByRole("textbox", { name: "A thought, worry or task" }).fill("Prepare slides for Friday");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("textbox", { name: "A thought, worry or task" }).fill("The weather on the weekend");
  await page.getByRole("button", { name: "Add", exact: true }).click();

  await page.getByRole("group", { name: "Sort: Prepare slides for Friday" }).getByRole("button", { name: "I control" }).click();
  await page.getByRole("group", { name: "Sort: The weather on the weekend" }).getByRole("button", { name: "Not mine" }).click();
  await expect(page.getByRole("img", { name: "1 in your control, 0 you can influence, 1 outside your control." })).toBeVisible();

  await page.getByRole("button", { name: "Make it a step" }).click();
  await page.getByRole("dialog", { name: "Make it a step" }).getByRole("button", { name: "Add step" }).click();
  await expectToast(page, "New goal created");
  await expect(page.getByText("Added to your goals").filter({ visible: true })).toBeVisible();

  await page.goto("/space/goals");
  await expect(page.getByRole("link", { name: /Prepare slides for Friday/ })).toBeVisible();
});

test("vision board: words and a picture, then remove", async ({ page }) => {
  await signUpAndOnboard(page, "Akinyi", "vision");
  await page.goto("/space/vision");
  await expect(page.getByRole("heading", { name: "Picture the life you are working towards" })).toBeVisible();

  await expect(page.getByRole("button", { name: "Add words" })).toBeEnabled();
  await page.getByRole("button", { name: "Add words" }).click();
  await page.getByRole("dialog", { name: "Add words" }).getByRole("textbox", { name: "Words" }).fill("Strong, calm and kind");
  await page.getByRole("button", { name: "Add to board" }).click();
  await expectToast(page, "Added to your board");
  await expect(page.getByText("Strong, calm and kind").filter({ visible: true })).toBeVisible();

  await expect(page.getByRole("button", { name: "Add a picture" })).toBeEnabled();
  await page.locator('input[type="file"]').setInputFiles({ name: "shore.png", mimeType: "image/png", buffer: testPng() });
  await expectToast(page, "Picture added");
  await expect(page.getByRole("img", { name: "A picture on your vision board" })).toBeVisible();

  await page.goto("/space");
  await expect(page.getByRole("region", { name: "My vision board" }).getByText("Strong, calm and kind")).toBeVisible();

  await page.goto("/space/vision");
  await page.getByRole("button", { name: "Remove picture from your board" }).click();
  await expectToast(page, "Removed");
  await expect(page.getByRole("img", { name: "A picture on your vision board" })).toHaveCount(0);
});

test("journal search finds entries by their words", async ({ page }) => {
  await signUpAndOnboard(page, "Chiamaka", "search");
  for (const body of ["A long walk by the lake", "Dinner with my sister"]) {
    await page.goto("/journal/new");
    await page.getByRole("textbox", { name: "Your entry" }).fill(body);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page).toHaveURL(/\/journal\/[0-9a-f-]{36}$/);
  }
  await page.goto("/journal");
  await page.getByRole("searchbox", { name: "Search your journal" }).fill("lake");
  await expect(page.getByText("1 entry matching “lake”").filter({ visible: true })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search your journal" }).fill("nothing like this");
  await expect(page.getByText("Nothing matches “nothing like this”").filter({ visible: true })).toBeVisible();
});

test("support is reachable without signing in", async ({ page }) => {
  await page.goto("/help");
  await expect(page.getByRole("heading", { name: "Get support now" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Call 999" })).toHaveAttribute("href", "tel:999");
  await expect(page.getByRole("link", { name: /findahelpline\.com/ })).toBeVisible();
});

test("admin: hidden from members, works for admins", async ({ page }) => {
  // Granting admin on the hosted database goes through the Supabase CLI and takes ~20 s.
  test.setTimeout(process.env.E2E_REMOTE ? 180_000 : 60_000);
  const { email } = await signUpAndOnboard(page, "Rael", "admin");
  const tag = Date.now().toString(36);
  const quote = `Small steps, taken daily, change a life (${tag}).`;
  const video = `Evening wind-down ${tag}`;
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "This page isn’t here" })).toBeVisible();

  await page.goto("/today");
  await expect(page.getByRole("link", { name: /^Admin/ })).toHaveCount(0);

  grantAdmin(email);
  await page.goto("/today");
  await page.getByRole("link", { name: /^Admin/ }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Overview", level: 1 })).toBeVisible();
  await expect(page.getByText(/no admin can read anyone's check-ins/)).toBeVisible();

  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Quotes" }).click();
  await page.getByRole("button", { name: "Add a quote" }).click();
  await page.getByRole("dialog", { name: "Add a quote" }).getByRole("textbox", { name: "Quote" }).fill(quote);
  await page.getByRole("dialog", { name: "Add a quote" }).getByRole("button", { name: "Save" }).click();
  await expectToast(page, "Quote added");
  await expect(page.getByText(quote).filter({ visible: true })).toBeVisible();
  // Clean up so other tests see the seed content only.
  await page.getByRole("button", { name: `Delete ${quote.slice(0, 60)}` }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expectToast(page, "Deleted");

  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Videos" }).click();
  await page.getByRole("link", { name: "Add a video" }).click();
  await page.getByRole("textbox", { name: "Title" }).fill(video);
  await page.getByRole("textbox", { name: "Description" }).fill("Ten quiet minutes before sleep.");
  await page.getByRole("switch", { name: /Published/ }).click();
  await page.getByRole("button", { name: "Add video" }).click();
  await expectToast(page, "Video added");

  await page.goto("/discover");
  await expect(page.getByRole("link", { name: new RegExp(video) })).toBeVisible();
  await page.goto("/admin/videos");
  await page.getByRole("button", { name: `Delete ${video}` }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expectToast(page, "Deleted");

  await page.goto("/settings");
  await expect(page.getByRole("link", { name: "Open admin" })).toBeVisible();
});
