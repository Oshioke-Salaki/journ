// Renders the link-preview image (WhatsApp, iMessage, social) used for every page.
// Run: node scripts/generate-og.mjs
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";

const mark = readFileSync(new URL("../public/icons/mark.svg", import.meta.url), "utf8");
const html = `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@500;600&family=Newsreader:opsz,wght@6..72,400&display=block" rel="stylesheet">
<style>
  body { margin:0; width:1200px; height:630px; background:#faf8f4; font-family:'Hanken Grotesk',sans-serif; color:#15302e; display:grid; grid-template-columns: 1fr 520px; }
  .copy { padding:72px 0 84px 80px; box-sizing:border-box; height:630px; display:flex; flex-direction:column; justify-content:space-between; }
  .brand { display:flex; align-items:center; gap:16px; font-size:30px; font-weight:600; letter-spacing:-0.01em; }
  .brand svg { width:56px; height:56px; }
  h1 { font-family:'Newsreader',serif; font-weight:400; font-size:80px; line-height:1; letter-spacing:-0.025em; margin:0; }
  p { font-size:26px; line-height:1.4; margin:24px 0 0; color:#4f5e5c; max-width:520px; }
  .art { padding:40px 40px 40px 0; box-sizing:border-box; height:630px; }
  .art svg { display:block; width:100%; height:100%; border-radius:32px; }
</style></head><body>
  <div class="copy">
    <div class="brand">${mark}<span>JournApp</span></div>
    <div><h1>Notice what you can control.</h1><p>A daily journal for your mood, body and energy.</p></div>
  </div>
  <div class="art">
    <svg viewBox="0 0 160 200" preserveAspectRatio="xMidYMid slice">
      <rect width="160" height="200" fill="#F3CDAE"/>
      <circle cx="82" cy="70" r="16" fill="#2F7370"/>
      <path d="M0 138 L44 104 L78 128 L118 92 L160 122 V200 H0 Z" fill="#A9B3E0"/>
      <path d="M30 200 L86 136 L140 200 Z" fill="#8592CF"/>
      <path d="M0 200 V146 L62 140 L104 200 Z" fill="#B5DFCB"/>
      <path d="M70 200 L126 132 L160 152 V200 Z" fill="#7FA68C"/>
    </svg>
  </div>
</body></html>`;

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: "png" });
for (const name of ["opengraph-image", "twitter-image"]) {
  writeFileSync(`src/app/${name}.png`, png);
  writeFileSync(`src/app/${name}.alt.txt`, "JournApp: Notice what you can control. A daily journal for your mood, body and energy.");
}
console.log("wrote src/app/opengraph-image.png and twitter-image.png");
await browser.close();
