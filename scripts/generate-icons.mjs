// Renders the PWA and Apple icons from the mark with Playwright. Run: node scripts/generate-icons.mjs
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";

const svg = readFileSync(new URL("../public/icons/mark.svg", import.meta.url), "utf8");
// Full-bleed artwork (no rounded corners): the platform applies its own mask.
const square = svg.replace('rx="15"', 'rx="0"');

const targets = [
  { file: "public/icons/icon-192.png", size: 192, art: square, inset: 0 },
  { file: "public/icons/icon-512.png", size: 512, art: square, inset: 0 },
  // Maskable: keep the art inside the 80% safe zone on a matching background.
  { file: "public/icons/icon-maskable-512.png", size: 512, art: square, inset: 0.1 },
  { file: "src/app/apple-icon.png", size: 180, art: square, inset: 0 },
];

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
for (const t of targets) {
  const pad = Math.round(t.size * t.inset);
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<html><body style="margin:0;background:#F3CDAE;width:${t.size}px;height:${t.size}px;display:grid;place-items:center">
      <div style="width:${t.size - pad * 2}px;height:${t.size - pad * 2}px">${t.art.replace("<svg ", '<svg width="100%" height="100%" ')}</div>
    </body></html>`,
  );
  await page.screenshot({ path: t.file, omitBackground: false });
  console.log("wrote", t.file);
}
// favicon.ico: 16, 32 and 48px PNGs (rounded mark on transparent) packed into one ICO file.
const sizes = [16, 32, 48];
const pngs = [];
for (const size of sizes) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`);
  pngs.push(await page.screenshot({ omitBackground: true }));
}
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const at = 6 + i * 16;
  header.writeUInt8(size, at);
  header.writeUInt8(size, at + 1);
  header.writeUInt8(0, at + 2);
  header.writeUInt8(0, at + 3);
  header.writeUInt16LE(1, at + 4);
  header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(pngs[i].length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += pngs[i].length;
});
writeFileSync("src/app/favicon.ico", Buffer.concat([header, ...pngs]));
console.log("wrote src/app/favicon.ico");

await browser.close();
