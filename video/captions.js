import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";
import { scenes } from "./script.js";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = new URL("assets/captions/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const html = caption => `<!doctype html><html><head><style>
  * { margin:0; padding:0; }
  body { width:1920px; height:1080px; background:transparent; overflow:hidden;
         font-family:-apple-system,'Helvetica Neue',sans-serif; }
  .mark { position:fixed; top:26px; right:34px;
          font-family:'SF Mono',Menlo,monospace; font-size:21px; letter-spacing:1px;
          color:rgba(161,161,170,0.85); text-shadow:0 1px 8px rgba(0,0,0,0.9); }
  .cap { position:fixed; left:50%; bottom:56px; transform:translateX(-50%);
         max-width:1500px; white-space:nowrap;
         background:rgba(3,3,3,0.72); border:1px solid rgba(63,63,70,0.8);
         border-radius:12px; padding:14px 26px;
         font-family:'SF Mono',Menlo,monospace; font-size:27px; color:#FAFAFA; }
  .cap b { color:#34D399; font-weight:600; }
</style></head><body>
  <div class="mark">turnstile-xi.vercel.app</div>
  ${caption ? `<div class="cap">${caption}</div>` : ""}
</body></html>`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

for (const s of scenes.filter(s => s.kind === "app")) {
  await page.setContent(html(s.caption ?? null), { waitUntil: "load" });
  await new Promise(r => setTimeout(r, 150));
  await page.screenshot({ path: `${OUT}${s.id}.png`, omitBackground: true });
  console.log(`  caption: ${s.id}.png`);
}
await browser.close();
