import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { expectToast, signUpAndOnboard } from "./helpers";

/** Selects the first occurrence of `text` in the editor by dragging across it, as a person would. */
async function select(page: Page, text: string) {
  const box = await page.evaluate((needle) => {
    const root = document.querySelector('[aria-label="Your entry"]')!;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const at = node.textContent!.indexOf(needle);
      if (at < 0) continue;
      const range = document.createRange();
      range.setStart(node, at);
      range.setEnd(node, at + needle.length);
      const rects = range.getClientRects();
      const first = rects[0];
      const last = rects[rects.length - 1];
      return { x1: first.left + 1, y1: first.top + first.height / 2, x2: last.right - 1, y2: last.top + last.height / 2 };
    }
    throw new Error(`"${needle}" not found`);
  }, text);
  await page.mouse.move(box.x1, box.y1);
  await page.mouse.down();
  await page.mouse.move(box.x2, box.y2, { steps: 6 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString().trim())).toBe(text);
  await page.waitForTimeout(120);
}

const tool = (page: Page, name: string | RegExp) => page.getByRole("button", { name }).filter({ visible: true }).first();
const toolbar = (page: Page) => page.getByRole("toolbar", { name: "Formatting" }).filter({ visible: true }).first();

test("every writing tool, saved, read, edited and searched", async ({ page }) => {
  test.setTimeout(120_000);
  await signUpAndOnboard(page, "Saida", "rich");
  await page.goto("/journal/new");
  const ed = page.getByRole("textbox", { name: "Your entry" });
  await expect(toolbar(page)).toBeVisible();
  await ed.click();

  // Markdown shortcuts while typing.
  await page.keyboard.type("Sunday reset");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Today I felt lighter after a walk by the water.");
  await page.keyboard.press("Enter");
  await page.keyboard.type("[] Call mum");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Plan the week");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.keyboard.type("> Be kind to yourself");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Keep it simple and strike this");

  // Style menu: the first line becomes a heading.
  await select(page, "Sunday reset");
  await toolbar(page).getByRole("button", { name: "Text style" }).click();
  await page.getByRole("menuitemradio", { name: "Heading", exact: true }).click();
  await expect(ed.locator("h2")).toHaveText("Sunday reset");

  // Bold (toolbar), italic (shortcut), underline, then undo and redo the underline.
  await select(page, "lighter");
  await tool(page, "Bold").click();
  await expect(ed.locator("strong")).toHaveText("lighter");
  await select(page, "walk");
  await page.keyboard.press("ControlOrMeta+i");
  await expect(ed.locator("em")).toHaveText("walk");
  await select(page, "water");
  await tool(page, "Underline").click();
  await expect(ed.locator("u")).toHaveText("water");
  await tool(page, "Undo").click();
  await expect(ed.locator("u")).toHaveCount(0);
  await tool(page, "Redo").click();
  await expect(ed.locator("u")).toHaveText("water");

  // Highlighter, colour and size from their menus.
  await select(page, "lighter");
  await tool(page, "Highlighter").click();
  await page.getByRole("menuitemradio", { name: "Mint" }).click();
  await expect(ed.locator("mark")).toHaveAttribute("style", /var\(--jh-mint\)/);
  await select(page, "Today");
  await tool(page, "Text colour").click();
  await page.getByRole("menuitemradio", { name: "Teal" }).click();
  await select(page, "felt");
  await tool(page, "Text size").click();
  await page.getByRole("menuitemradio", { name: "Large", exact: true }).click();
  await expect(ed.locator('span[style*="--jc-teal"]')).toHaveText("Today");
  await expect(ed.locator('span[style*="--js-large"]')).toHaveText("felt");

  // More menu: strikethrough, divider, alignment, clear formatting.
  await select(page, "strike this");
  await tool(page, "More formatting").click();
  await page.getByRole("menuitemcheckbox", { name: "Strikethrough" }).click();
  await expect(ed.locator("s")).toHaveText("strike this");
  await select(page, "Keep it simple");
  await tool(page, "More formatting").click();
  await page.getByRole("button", { name: "Align center" }).click();
  await expect(ed.locator('p[style*="text-align: center"]')).toContainText("Keep it simple");
  // A divider goes where the cursor is (a selection would be replaced, as in any editor).
  await ed.locator("blockquote").click();
  await page.keyboard.press("End");
  await tool(page, "More formatting").click();
  await page.getByRole("menuitem", { name: "Divider" }).click();
  await expect(ed.locator("hr")).toHaveCount(1);

  // A checklist item can be ticked while writing; lists from the toolbar.
  await ed.locator('ul[data-type="taskList"] > li input[type="checkbox"]').first().click();
  await expect(ed.locator('li[data-checked="true"]')).toContainText("Call mum");
  await expect(ed.locator("blockquote")).toContainText("Be kind to yourself");

  // Font with nothing selected applies to the whole entry.
  await ed.locator("h2").click();
  await tool(page, /^Font/).click();
  await page.getByRole("menuitemradio", { name: /Handwritten/ }).click();
  await expect(ed.locator('span[style*="--jf-hand"]').first()).toBeVisible();

  await page.getByLabel("Title").filter({ visible: true }).fill("A lighter week");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expectToast(page, "Entry saved");
  await expect(page).toHaveURL(/\/journal\/[0-9a-f-]{36}$/);

  // The read view shows every format, rendered on the server.
  const doc = page.locator(".journal-doc");
  await expect(doc.locator("h2")).toHaveText("Sunday reset");
  await expect(doc.locator("strong")).toHaveText("lighter");
  await expect(doc.locator("em")).toHaveText("walk");
  await expect(doc.locator("u")).toHaveText("water");
  await expect(doc.locator("s")).toHaveText("strike this");
  await expect(doc.locator("mark")).toHaveAttribute("style", /var\(--jh-mint\)/);
  await expect(doc.locator('span[style*="--jc-teal"]')).toHaveText("Today");
  await expect(doc.locator('span[style*="--jf-hand"]').first()).toBeVisible();
  await expect(doc.locator("blockquote")).toContainText("Be kind to yourself");
  await expect(doc.locator("hr")).toHaveCount(1);
  await expect(doc.locator('li[data-checked="true"]')).toContainText("Call mum");
  await expect(doc.locator('p[style*="text-align: center"]')).toContainText("Keep it simple");

  // The reading view passes accessibility checks in dark mode too.
  await page.emulateMedia({ colorScheme: "dark" });
  const results = await new AxeBuilder({ page }).include(".journal-doc").withTags(["wcag2aa"]).analyze();
  expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  await page.emulateMedia({ colorScheme: "light" });

  // Editing keeps the formatting.
  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page.getByRole("textbox", { name: "Your entry" }).locator("strong")).toHaveText("lighter");
  await expect(page.getByRole("textbox", { name: "Your entry" }).locator("mark")).toHaveCount(1);

  // The journal list and search use the plain text.
  await page.goto("/journal");
  await expect(page.getByRole("link", { name: /A lighter week/ })).toContainText("Today I felt lighter");
  await page.getByRole("searchbox", { name: "Search your journal" }).fill("strike this");
  await expect(page.getByText("1 entry matching “strike this”").filter({ visible: true })).toBeVisible();
});

test("formatting survives a reload as a draft", async ({ page }) => {
  await signUpAndOnboard(page, "Pendo", "rich-draft");
  await page.goto("/journal/new");
  const ed = page.getByRole("textbox", { name: "Your entry" });
  await ed.click();
  await page.keyboard.type("A bold idea worth keeping");
  await select(page, "bold idea");
  await page.keyboard.press("ControlOrMeta+b");
  await expect(ed.locator("strong")).toHaveText("bold idea");
  await page.waitForTimeout(700);
  page.on("dialog", (d) => d.accept());
  await page.reload();
  await expectToast(page, "Draft restored");
  await expect(page.getByRole("textbox", { name: "Your entry" }).locator("strong")).toHaveText("bold idea");
});

test("a formatted entry with no words can't be saved", async ({ page }) => {
  await signUpAndOnboard(page, "Kito", "rich-empty");
  await page.goto("/journal/new");
  await expect(page.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
  const ed = page.getByRole("textbox", { name: "Your entry" });
  await ed.click();
  await page.keyboard.type("[] ");
  await expect(page.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
});
