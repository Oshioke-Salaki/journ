import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { grantAdmin } from "./helpers";

const FOLDER = { laptop: "desktop", ipad: "tablet", iphone: "mobile" } as Record<string, string>;

/**
 * Photographs every screen on each device, in light and dark, into screenshots/<desktop|tablet|mobile>/,
 * and fails on any serious or critical accessibility violation.
 */

async function shoot(page: Page, device: string, name: string) {
  await page.waitForLoadState("load");
  await page.evaluate(() => document.fonts.ready);
  // Let streamed sections and images settle.
  await page.waitForFunction(() => [...document.images].every((img) => img.complete), undefined, { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(450);
  await page.screenshot({ path: `screenshots/${FOLDER[device] ?? device}/${name}.png`, fullPage: true });
}

async function audit(page: Page, name: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    serious.map((v) => `${name}: ${v.id} ${v.help} (${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")})`),
  ).toEqual([]);
}

test("every screen, light and dark", async ({ page }, info) => {
  test.setTimeout(600_000);
  const device = info.project.name;

  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    await shoot(page, device, `${scheme}-01-welcome`);
    await audit(page, `${scheme} welcome`);
    await page.goto("/sign-up");
  await expect(page.getByRole("button", { name: "Create account" })).toBeEnabled();
    await shoot(page, device, `${scheme}-02-sign-up`);
    await audit(page, `${scheme} sign-up`);
  }

  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/sign-up");
  await expect(page.getByRole("button", { name: "Create account" })).toBeEnabled();
  await page.getByLabel("Your first name").filter({ visible: true }).fill("Meriem");
  const email = `e2e-screens-${device}-${Date.now()}@example.test`;
  await page.getByLabel("Email").filter({ visible: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill("Calm-mornings-2026");
  await page.getByRole("checkbox", { name: /I agree/ }).click();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "What should we call you?" })).toBeVisible();
  await shoot(page, device, "light-03-onboarding-name");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "A little about you" })).toBeVisible();
  await shoot(page, device, "light-04-onboarding-about");
  await audit(page, "onboarding about");
  await page.getByLabel(/Date of birth/).filter({ visible: true }).fill("1994-03-18");
  await page.getByRole("combobox", { name: /Place of birth/ }).fill("Nairobi");
  if (await page.getByRole("option").first().waitFor({ state: "visible", timeout: 10_000 }).then(() => true, () => false)) {
    await page.screenshot({ path: `screenshots/${FOLDER[device] ?? device}/light-04b-place-search.png` });
    await page.getByRole("option").first().click();
  }
  await page.getByRole("combobox", { name: /Country you live in/ }).fill("Ke");
  await page.screenshot({ path: `screenshots/${FOLDER[device] ?? device}/light-04c-country-search.png` });
  await page.getByRole("option", { name: "Kenya" }).click();
  await page.getByRole("button", { name: "she/her" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await shoot(page, device, "light-05-onboarding-consent");
  await page.getByRole("button", { name: "Start my journal" }).click();
  await expect(page).toHaveURL(/\/today/);
  await shoot(page, device, "light-06-today-empty");
  await audit(page, "today empty");

  // Empty states of a brand-new account, and the two 404s.
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const [name, path] of [
      ["empty-journal", "/journal"],
      ["empty-space", "/space"],
      ["empty-goals", "/space/goals"],
      ["empty-control", "/control"],
      ["empty-vision", "/space/vision"],
      ["404-in-app", "/journal/00000000-0000-0000-0000-000000000000"],
      ["404-public", "/this-page-does-not-exist"],
    ] as const) {
      await page.goto(path);
      await shoot(page, device, `${scheme}-0${name === "404-public" || name === "404-in-app" ? "9" : "6"}-${name}`);
      await audit(page, `${scheme} ${name}`);
    }
  }
  await page.emulateMedia({ colorScheme: "light" });

  // A check-in, photographed step by step.
  await page.goto("/check-in");
  await page.getByRole("radio", { name: "Good", exact: true }).click();
  await shoot(page, device, "light-07-check-in-mood");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("checkbox", { name: "Shoulders" }).click();
  await page.getByRole("checkbox", { name: "Stomach" }).click();
  await page.getByRole("group", { name: "What your shoulders feels like" }).getByRole("button", { name: "Tension" }).click();
  await shoot(page, device, "light-08-check-in-body");
  await audit(page, "check-in body");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radiogroup", { name: "How is your energy?" }).getByRole("radio", { name: "4 of 5" }).click();
  await page.getByRole("radiogroup", { name: "How efficient do you feel?" }).getByRole("radio", { name: "3 of 5" }).click();
  await page.getByRole("radiogroup", { name: "How do you feel about yourself today?" }).getByRole("radio", { name: "4 of 5" }).click();
  await shoot(page, device, "light-09-check-in-levels");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Calm" }).click();
  await page.getByRole("button", { name: "Hopeful" }).click();
  await page.getByLabel(/A line about today/).filter({ visible: true }).fill("Slow start, then a good walk at lunch.");
  await shoot(page, device, "light-10-check-in-words");
  await page.getByRole("button", { name: "Save check-in" }).click();
  await expect(page.getByRole("heading", { name: "Checked in for today" })).toBeVisible();
  await shoot(page, device, "light-11-check-in-saved");

  // A journal entry and a goal, so the screens show real content.
  await page.goto("/journal/new?prompt=today");
  await page.getByLabel("Title").filter({ visible: true }).fill("Lunch walk");
  await page.getByLabel("Your entry").filter({ visible: true }).fill(
    "I noticed the tension in my shoulders before the meeting and took ten minutes outside instead of checking email.\n\nThat was within my control. The meeting itself was not, and it went fine anyway.",
  );
  await shoot(page, device, "light-12-journal-write");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/journal\/[0-9a-f-]{36}$/);
  await shoot(page, device, "light-13-journal-entry");

  await page.goto("/space/goals/new");
  await page.getByLabel("What do you want to achieve?").filter({ visible: true }).fill("Walk every morning");
  await page.getByLabel(/Why does it matter/).filter({ visible: true }).fill("I think more clearly on days I move first.");
  await page.getByRole("button", { name: "Body" }).click();
  await page.getByLabel("Step 1", { exact: true }).filter({ visible: true }).fill("Lay out walking shoes the night before");
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  await page.getByLabel("Date for step 1").filter({ visible: true }).fill(tomorrow);
  await page.getByRole("button", { name: "Add a step" }).click();
  await page.getByLabel("Step 2", { exact: true }).filter({ visible: true }).fill("Walk ten minutes before work");
  await shoot(page, device, "light-14-goal-new");
  await page.getByRole("button", { name: "Set goal" }).click();
  await expect(page).toHaveURL(/\/space\/goals\/[0-9a-f-]{36}$/);
  await page.getByRole("checkbox", { name: "Mark done: Walk ten minutes before work" }).click();
  await expect(page.getByText("1 of 2 steps done").filter({ visible: true })).toBeVisible();
  await shoot(page, device, "light-15-goal");
  await audit(page, "goal");

  // Trackers, a sorted circle and a vision board.
  await page.goto("/today");
  const trackers = page.getByRole("region", { name: "Other things to track" });
  for (let i = 0; i < 5; i++) await trackers.getByRole("button", { name: "More water" }).click();
  for (let i = 0; i < 3; i++) await trackers.getByRole("button", { name: "More movement" }).click();
  for (let i = 0; i < 15; i++) await trackers.getByRole("button", { name: "More sleep" }).click();
  await trackers.getByRole("radio", { name: "Well", exact: true }).click();
  await expect(trackers.locator("ul[aria-busy=false]")).toBeVisible();
  await page.goto("/control");
  for (const [text, zone] of [
    ["Prepare slides for Friday", "I control"],
    ["How the team reacts to the plan", "I influence"],
    ["The weather on the weekend", "Not mine"],
    ["Call my sister back", "I control"],
  ] as const) {
    await page.getByRole("textbox", { name: "A thought, worry or task" }).fill(text);
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("group", { name: `Sort: ${text}` }).getByRole("button", { name: zone }).click();
  }
  await page.getByRole("textbox", { name: "A thought, worry or task" }).fill("Book a doctor's appointment");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.goto("/space/vision");
  for (const words of ["Strong, calm and kind", "Mornings outside", "Less hurry, more presence"]) {
    await page.getByRole("button", { name: "Add words" }).click();
    await page.getByRole("dialog", { name: "Add words" }).getByRole("textbox", { name: "Words" }).fill(words);
    await page.getByRole("button", { name: "Add to board" }).click();
    await expect(page.getByText(words).filter({ visible: true })).toBeVisible();
  }

  const pages = [
    ["16-today", "/today"],
    ["17-discover", "/discover"],
    ["18-video", null],
    ["19-community", "/community"],
    ["20-topic", "/community/breathing"],
    ["21-space", "/space"],
    ["22-journal", "/journal"],
    ["23-settings", "/settings"],
    ["24-control", "/control"],
    ["25-vision", "/space/vision"],
    ["26-help", "/help"],
  ] as const;

  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const [name, path] of pages) {
      if (path) await page.goto(path);
      else {
        await page.goto("/discover");
        await page.getByRole("link", { name: /Four-count breathing/ }).click();
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      }
      await shoot(page, device, `${scheme}-${name}`);
      await audit(page, `${scheme} ${name}`);
    }
  }

  // The admin area, as an admin.
  grantAdmin(email);
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const [name, path] of [
      ["30-admin-overview", "/admin"],
      ["31-admin-videos", "/admin/videos"],
      ["32-admin-video-edit", null],
      ["33-admin-quotes", "/admin/quotes"],
      ["34-admin-prompts", "/admin/prompts"],
      ["35-admin-topics", "/admin/topics"],
    ] as const) {
      if (path) await page.goto(path);
      else {
        await page.goto("/admin/videos");
        await page.getByRole("link", { name: "Four-count breathing for a busy mind" }).click();
        await expect(page.getByRole("heading", { name: "Edit video" })).toBeVisible();
      }
      await shoot(page, device, `${scheme}-${name}`);
      await audit(page, `${scheme} ${name}`);
    }
  }
});
