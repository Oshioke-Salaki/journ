import { execSync } from "node:child_process";
import { deflateSync } from "node:zlib";
import { expect, type Page } from "@playwright/test";

export const PASSWORD = "Calm-mornings-2026";

export function uniqueEmail(tag: string) {
  return `e2e-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

/** Signs up a new member and completes onboarding. Leaves the page on Today. */
export async function signUpAndOnboard(page: Page, name = "Amara", tag = "member") {
  const email = uniqueEmail(tag);
  await page.goto("/sign-up");
  await expect(page.getByRole("button", { name: "Create account" })).toBeEnabled();
  await page.getByLabel("Your first name").filter({ visible: true }).fill(name);
  await page.getByLabel("Email").filter({ visible: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).filter({ visible: true }).fill(PASSWORD);
  await page.getByRole("checkbox", { name: /I agree/ }).click();
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  await expect(page.getByRole("heading", { name: "What should we call you?" })).toBeVisible();
  await expect(page.getByLabel("Your first name").filter({ visible: true })).toHaveValue(name);
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "A little about you" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "How JournApp supports you" })).toBeVisible();
  await page.getByRole("button", { name: "Start my journal" }).click();

  await expect(page).toHaveURL(/\/today/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(name);
  return { email };
}

/** Clicks a nav destination in whichever nav the current viewport shows. */
export async function navigate(page: Page, label: string) {
  const nav = page.getByRole("navigation", { name: "Main" }).filter({ visible: true }).first();
  await nav.getByRole("link", { name: label, exact: true }).click();
}

export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: text }).first()).toBeVisible();
}

/** Promotes a test member to admin: in the local database, or the hosted one when E2E_REMOTE=1. */
export function grantAdmin(email: string) {
  if (!/^e2e-[a-z0-9-]+@example\.test$/.test(email)) throw new Error("Only test accounts can be made admin");
  if (process.env.E2E_REMOTE) {
    execSync(`bash scripts/remote-sql.sh "update public.profiles set role = 'admin' where id = (select id from auth.users where email = '${email}')"`, { stdio: "pipe" });
  } else {
    execSync(`bash scripts/grant-admin.sh ${email}`, { stdio: "pipe" });
  }
}

/** A valid 64x48 PNG (a teal field) for upload tests, built with zlib so it always decodes. */
export function testPng() {
  const width = 64;
  const height = 48;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0;
    for (let x = 0; x < width; x++) raw.set([44, 122, 114], y * (width * 3 + 1) + 1 + x * 3);
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
