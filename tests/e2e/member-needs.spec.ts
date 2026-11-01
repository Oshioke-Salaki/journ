import { createHmac } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { expectToast, grantAdmin, PASSWORD, signUpAndOnboard } from "./helpers";

/** The calendar date `days` from now on this machine (the browser shares its time zone). */
function localDay(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** RFC 6238 code for a base32 secret, as an authenticator app would show it. */
function totp(secret: string, at = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const ch of secret.replace(/[\s=]/g, "").toUpperCase()) bits += alphabet.indexOf(ch).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)));
  const h = createHmac("sha1", key).update(counter).digest();
  const o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

async function checkIn(page: Page, url: string, feelings: string[] = []) {
  await page.goto(url);
  await page.getByRole("button", { name: "Continue" }).click();
  for (let i = 0; i < 2; i++) await page.getByRole("button", { name: "Skip" }).click();
  for (const f of feelings) await page.getByRole("group", { name: "Feelings" }).getByRole("button", { name: f }).click();
}

test("the first week checklist tracks progress and can be hidden", async ({ page }) => {
  await signUpAndOnboard(page, "Imani", "first-week");
  const list = page.getByRole("region", { name: "Your first week" });
  await expect(list).toContainText("0 of 5 done");
  await list.getByRole("link", { name: /^Sort one thought/ }).click();
  await expect(page).toHaveURL(/\/control/);

  await checkIn(page, "/check-in?mood=4");
  await page.getByRole("button", { name: "Save check-in" }).click();
  await page.getByRole("link", { name: "Back to Today" }).click();
  await expect(list).toContainText("1 of 5 done");
  await expect(list.getByRole("link", { name: /^Check in \(done\)/ })).toBeVisible();

  await list.getByRole("button", { name: "Hide" }).click();
  await expectToast(page, "Checklist hidden");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Imani");
  await expect(page.getByRole("region", { name: "Your first week" })).toHaveCount(0);
});

test("a check-in brings suggestions for how she feels", async ({ page }) => {
  await signUpAndOnboard(page, "Wambui", "suggest");
  await checkIn(page, "/check-in?mood=2", ["Overwhelmed"]);
  await page.getByRole("button", { name: "Save check-in" }).click();
  await page.getByRole("link", { name: "Back to Today" }).click();

  const forYou = page.getByRole("region", { name: "For how you feel" });
  await expect(forYou.getByRole("link", { name: /Start practice/ })).toBeVisible();
  await expect(forYou).toContainText("For feeling overwhelmed");
  await expect(forYou.getByRole("link", { name: /Open my circle/ })).toBeVisible();
  await forYou.getByRole("link", { name: /What would help, even a little/ }).click();
  await expect(page.locator('[data-placeholder="What would help, even a little, right now?"]').filter({ visible: true })).toBeVisible();
});

test("a missed day can be checked in afterwards, within a week", async ({ page }) => {
  await signUpAndOnboard(page, "Achieng", "backfill");
  const yesterday = localDay(-1);
  await checkIn(page, `/check-in?date=${yesterday}&mood=2`);
  await expect(page.getByRole("heading", { name: "Any words for it?" })).toBeVisible();
  await page.getByRole("button", { name: "Save check-in" }).click();
  await expect(page.getByRole("heading", { name: "Yesterday's check-in is saved" })).toBeVisible();
  await page.getByRole("link", { name: /^Back to / }).click();
  await expect(page).toHaveURL(new RegExp(`/space/day/${yesterday}$`));
  await expect(page.getByRole("region", { name: "Check-in" }).getByRole("heading", { name: "Low" })).toBeVisible();

  // Too long ago: the day can be looked at, but not checked in.
  await page.goto(`/space/day/${localDay(-9)}`);
  await expect(page.getByText("Days without a check-in keep their place in your reports.").filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Add a check-in" })).toHaveCount(0);

  await page.goto("/space/calendar");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  if (yesterday.slice(0, 7) === localDay().slice(0, 7)) {
    await expect(page.getByRole("link", { name: /: low$/ })).toBeVisible();
  }
});

test("journal entries can be tagged, filtered and printed", async ({ page }) => {
  await signUpAndOnboard(page, "Neema", "tags");
  await page.goto("/journal/new");
  await page.getByRole("textbox", { name: "Your entry" }).click();
  await page.keyboard.type("A long day at the office");
  await page.getByLabel("Add a tag").fill("Work,");
  await page.getByLabel("Add a tag").fill("Big Wins");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Remove tag big wins" })).toBeVisible();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/journal\/[0-9a-f-]{36}$/);

  await page.getByRole("list", { name: "Tags" }).getByRole("link", { name: "#work" }).click();
  await expect(page).toHaveURL(/\/journal\?tag=work/);
  await expect(page.getByText("1 entry tagged #work")).toBeVisible();
  await page.getByRole("navigation", { name: "Filter by tag" }).getByRole("link", { name: /#work/ }).click();
  await expect(page).toHaveURL(/\/journal$/);

  await page.getByRole("link", { name: "Print" }).click();
  await expect(page.getByRole("heading", { name: "Print your journal" })).toBeVisible();
  await expect(page.getByRole("article").getByText("A long day at the office")).toBeVisible();
  await expect(page.getByRole("button", { name: "Print or save as PDF" })).toBeEnabled();
});

test("members send feedback and admins handle it in the inbox", async ({ page }) => {
  const { email } = await signUpAndOnboard(page, "Zawadi", "feedback");
  await page.goto("/settings#feedback");
  const form = page.getByRole("region", { name: "Send feedback" });
  await form.getByRole("button", { name: "Something's wrong" }).click();
  await form.getByLabel("Your message").fill("Hi");
  await form.getByRole("button", { name: "Send" }).click();
  await expect(form.getByText("Tell us a little more.")).toBeVisible();
  await form.getByLabel("Your message").fill("The calendar would be lovely with a week view.");
  await form.getByRole("button", { name: "Send" }).click();
  await expectToast(page, "Thank you. The team will read it.");

  grantAdmin(email);
  await page.goto("/admin/feedback");
  const message = page.getByRole("listitem").filter({ hasText: email });
  await expect(message).toContainText("The calendar would be lovely with a week view.");
  await message.getByRole("button", { name: "Mark handled" }).click();
  await expectToast(page, "Marked as handled");
  await expect(message).toHaveCount(0);
  await page.getByRole("link", { name: "Handled" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: email })).toBeVisible();
});

test("time zone: set in Settings, and Today offers to follow the device", async ({ page }) => {
  await signUpAndOnboard(page, "Mumbi", "timezone");
  await page.goto("/settings#timezone");
  const section = page.getByRole("region", { name: "Time zone" });
  await section.getByRole("combobox").fill("Auckland");
  await page.getByRole("option", { name: /Auckland/ }).click();
  await section.getByRole("button", { name: "Save time zone" }).click();
  await expectToast(page, "Time zone updated");

  await page.goto("/today");
  const nudge = page.getByRole("complementary", { name: "Time zone" });
  await expect(nudge).toContainText("Your days still follow Auckland (Pacific)");
  await nudge.getByRole("button", { name: /^Use / }).click();
  await expectToast(page, "Time zone updated");
  await expect(nudge).toHaveCount(0);
});

test("app lock hides JournApp until the code is entered", async ({ page }) => {
  await signUpAndOnboard(page, "Adhiambo", "lock");
  await page.goto("/settings#app-lock");
  const section = page.getByRole("region", { name: "App lock" });
  await section.getByLabel("New code").fill("2468");
  await section.getByLabel("Type it again").fill("2469");
  await section.getByRole("button", { name: "Turn on app lock" }).click();
  await expect(section.getByText("The codes don't match.")).toBeVisible();
  await section.getByLabel("Type it again").fill("2468");
  await section.getByRole("button", { name: "Immediately" }).click();
  await section.getByRole("button", { name: "Turn on app lock" }).click();
  await expectToast(page, "App lock is on");

  // A new tab is a cold start: locked.
  const other = await page.context().newPage();
  await other.goto("/journal");
  await expect(other.getByRole("heading", { name: "JournApp is locked" })).toBeVisible();
  await expect(other.getByRole("heading", { name: "Journal", level: 1 })).toBeHidden();
  await other.getByLabel("App lock code").fill("1111");
  await other.getByRole("button", { name: "Unlock" }).click();
  await expect(other.getByText("That code isn't right.")).toBeVisible();
  await other.getByLabel("App lock code").fill("2468");
  await other.getByRole("button", { name: "Unlock" }).click();
  await expect(other.getByRole("heading", { name: "Journal", level: 1 })).toBeVisible();
  await other.close();

  await page.reload();
  await page.getByLabel("App lock code").fill("2468");
  await page.getByRole("button", { name: "Unlock" }).click();
  await page.getByRole("region", { name: "App lock" }).getByLabel("Current code").fill("2468");
  await page.getByRole("region", { name: "App lock" }).getByRole("button", { name: "Turn off" }).click();
  await expectToast(page, "App lock is off");
  await page.reload();
  await expect(page.getByRole("heading", { name: "JournApp is locked" })).toHaveCount(0);
});

test("two-step sign-in with an authenticator app", async ({ page }) => {
  test.setTimeout(120_000);
  const { email } = await signUpAndOnboard(page, "Halima", "two-step");
  await page.goto("/settings#two-step");
  const section = page.getByRole("region", { name: "Two-step sign-in" });
  await section.getByRole("button", { name: "Set up two-step sign-in" }).click();
  const secret = (await section.locator("code").textContent())!.replace(/\s/g, "");
  await section.getByLabel("Code from the app").fill("000000");
  await section.getByRole("button", { name: "Turn on" }).click();
  await expect(section.getByText("That code didn't work.")).toBeVisible();
  await section.getByLabel("Code from the app").fill(totp(secret));
  await section.getByRole("button", { name: "Turn on" }).click();
  await expectToast(page, "Two-step sign-in is on");
  await expect(section.getByText("On", { exact: true })).toBeVisible();

  // Sign out, then back in: the password alone is not enough.
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/(\?.*)?$/);
  await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  await page.getByLabel("Email").filter({ visible: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/verify/);
  await page.goto("/journal");
  await expect(page).toHaveURL(/\/verify/);

  // A fresh code (the next 30-second window, so it is not the one used to set up).
  const step = Math.floor(Date.now() / 30_000);
  await page.waitForTimeout(Math.max(0, (step + 1) * 30_000 - Date.now() + 500));
  await page.getByLabel("6-digit code").fill(totp(secret));
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/today/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Halima");
});

test("videos can be searched and saved for later", async ({ page }) => {
  await signUpAndOnboard(page, "Faith", "videos");
  await page.goto("/discover");
  await page.getByRole("searchbox", { name: "Search videos" }).fill("breathing");
  await expect(page.getByText(/^\d+ videos?$/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Four-count breathing/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Eating for steady energy/ })).toHaveCount(0);
  await page.getByRole("searchbox", { name: "Search videos" }).fill("zzzz nothing");
  await expect(page.getByRole("heading", { name: "Nothing matches “zzzz nothing”" })).toBeVisible();

  await page.getByRole("tab", { name: "Saved" }).click();
  await page.getByRole("button", { name: "Show all videos" }).click();
  await page.getByRole("tab", { name: "Saved" }).click();
  await expect(page.getByRole("heading", { name: "Nothing saved yet" })).toBeVisible();

  await page.getByRole("tab", { name: "All" }).click();
  await page.getByRole("link", { name: /Four-count breathing/ }).first().click();
  await page.getByRole("button", { name: "Save for later" }).click();
  await expectToast(page, "Saved for later");
  await page.goto("/discover?topic=saved");
  await expect(page.getByRole("tab", { name: "Saved 1" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("link", { name: /Four-count breathing/ })).toBeVisible();
});

test("the guide answers common questions, for anyone", async ({ page }) => {
  await page.goto("/guide");
  await expect(page.getByRole("heading", { name: "How JournApp works", level: 1 })).toBeVisible();
  await page.getByText("I missed a day. Can I still add it?").click();
  await expect(page.getByText("Yes, for the last seven days.")).toBeVisible();
});
