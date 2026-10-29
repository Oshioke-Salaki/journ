import { expect, test } from "@playwright/test";
import { expectToast, PASSWORD, signUpAndOnboard, testPng } from "./helpers";

const REMOTE = Boolean(process.env.E2E_REMOTE);
const MAILPIT = "http://127.0.0.1:55424";

test("password reset by email, end to end", async ({ page, request }) => {
  test.skip(REMOTE, "Production has no email provider yet; this runs against the local inbox.");
  const { email } = await signUpAndOnboard(page, "Halima", "reset");
  await page.context().clearCookies();

  await page.goto("/forgot-password");
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeEnabled();
  await page.getByLabel("Email").filter({ visible: true }).fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/If there is an account for/).filter({ visible: true })).toBeVisible();

  // Read the email from the local inbox and follow its link.
  let link: string | undefined;
  for (let i = 0; i < 20 && !link; i++) {
    const list = await (await request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)).json();
    const id = list.messages?.[0]?.ID;
    if (id) {
      const message = await (await request.get(`${MAILPIT}/api/v1/message/${id}`)).json();
      link = /href="([^"]+verify[^"]+)"/.exec(message.HTML)?.[1]?.replaceAll("&amp;", "&");
    }
    if (!link) await page.waitForTimeout(500);
  }
  expect(link, "reset email arrived").toBeTruthy();
  await page.goto(link!);

  await expect(page).toHaveURL(/\/reset-password/);
  await expect(page.getByRole("button", { name: "Save new password" })).toBeEnabled();
  await page.getByLabel("New password", { exact: true }).filter({ visible: true }).fill("New-calm-mornings-2026");
  await page.getByLabel("Repeat new password").filter({ visible: true }).fill("New-calm-mornings-2026");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expectToast(page, "Your password has been changed.");
  await expect(page).toHaveURL(/\/today/);

  // The old password no longer works; the new one does.
  await page.context().clearCookies();
  await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeEnabled();
  await page.getByLabel("Email").filter({ visible: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expectToast(page, "That email and password don't match");
  await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill("New-calm-mornings-2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/today/);
});

test("goals: edit, pause, resume", async ({ page }) => {
  await signUpAndOnboard(page, "Zawadi", "goal-edit");
  await page.goto("/space/goals/new");
  await page.getByLabel("What do you want to achieve?").filter({ visible: true }).fill("Read before bed");
  await page.getByRole("button", { name: "Set goal" }).click();
  await expect(page).toHaveURL(/\/space\/goals\/[0-9a-f-]{36}$/);

  await page.getByRole("button", { name: "Edit" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit goal" });
  await dialog.getByRole("textbox", { name: "What do you want to achieve?" }).fill("Read ten pages before bed");
  await dialog.getByRole("button", { name: "Mind" }).click();
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expectToast(page, "Goal updated");
  await expect(page.getByRole("heading", { name: "Read ten pages before bed" })).toBeVisible();
  await expect(page.getByText(/In progress · Mind/).filter({ visible: true })).toBeVisible();

  await page.getByRole("button", { name: "Pause" }).click();
  await expectToast(page, "Goal paused");
  await expect(page.getByText(/^Paused · Mind/).filter({ visible: true })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expectToast(page, "Goal resumed");

  await page.goto("/space/goals");
  await expect(page.getByRole("heading", { name: /In progress/ })).toBeVisible();
});

test("circle of control: move back and remove", async ({ page }) => {
  await signUpAndOnboard(page, "Imani", "control-edit");
  await page.goto("/control");
  const input = page.getByRole("textbox", { name: "A thought, worry or task" });
  await input.fill("Reply to the landlord");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("group", { name: "Sort: Reply to the landlord" }).getByRole("button", { name: "I influence" }).click();
  await expect(page.getByRole("img", { name: "0 in your control, 1 you can influence, 0 outside your control." })).toBeVisible();

  await page.getByRole("button", { name: "Move back to unsorted: Reply to the landlord" }).click();
  await expect(page.getByRole("group", { name: "Sort: Reply to the landlord" })).toBeVisible();
  await page.getByRole("button", { name: "Remove: Reply to the landlord" }).click();
  await expect(page.getByText("Reply to the landlord").filter({ visible: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Reply to the landlord").filter({ visible: true })).toHaveCount(0);
});

test("premium videos are locked for free members; unknown videos are not found", async ({ page }) => {
  await signUpAndOnboard(page, "Neema", "premium");
  await page.goto("/discover");
  await page.getByRole("link", { name: /Mindful eating, one meal at a time/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "Part of JournApp Premium, coming soon." })).toBeVisible();
  await page.goto("/discover/00000000-0000-0000-0000-000000000000");
  await expect(page.getByRole("heading", { name: "This page isn’t here" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" }).filter({ visible: true }).first()).toBeVisible();
});

test("deleting an account also deletes its pictures", async ({ page }) => {
  await signUpAndOnboard(page, "Faith", "delete-pics");
  await page.goto("/space/vision");
  await expect(page.getByRole("button", { name: "Add a picture" })).toBeEnabled();
  await page.locator('input[type="file"]').setInputFiles({ name: "lake.png", mimeType: "image/png", buffer: testPng() });
  await expectToast(page, "Picture added");
  const src = await page.getByRole("img", { name: "A picture on your vision board" }).getAttribute("src");
  expect(src).toContain("/storage/v1/object/sign/vision/");

  await page.goto("/settings");
  await page.getByRole("button", { name: "Delete account" }).click();
  await page.getByLabel("Type DELETE to confirm").filter({ visible: true }).fill("DELETE");
  await page.getByRole("button", { name: "Delete everything" }).click();
  await expect(page).toHaveURL(/\/$/);

  // The signed link pointed at a file that no longer exists.
  const res = await page.request.get(src!);
  expect(res.status()).toBeGreaterThanOrEqual(400);
});

test("the install card shows on phones and stays dismissed", async ({ page }, info) => {
  test.skip(info.project.name === "laptop", "Phones and tablets only");
  await signUpAndOnboard(page, "Wanjiku", "install");
  const card = page.getByRole("complementary", { name: "Install JournApp" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Not now" }).click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Wanjiku");
  await expect(page.getByRole("complementary", { name: "Install JournApp" })).toHaveCount(0);
});

test("security headers, robots, sitemap and link previews", async ({ request }) => {
  const home = await request.get("/");
  const h = home.headers();
  expect(h["strict-transport-security"]).toContain("max-age=");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toContain("camera=()");
  expect(h["x-powered-by"]).toBeUndefined();

  const html = await home.text();
  expect(html).toContain('property="og:image"');
  expect(html).toContain('name="twitter:card"');
  const og = /property="og:image" content="([^"]+)"/.exec(html)?.[1];
  expect((await request.get(og!)).status()).toBe(200);

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /journal");
  expect(robots).toContain("Disallow: /admin");
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/help</loc>");
});

test("the installed app shows the offline screen without a connection", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.active?.state;
  });
  await page.reload();
  await context.setOffline(true);
  await page.goto("/help").catch(() => {});
  await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
  await context.setOffline(false);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Get support now" })).toBeVisible();
});
