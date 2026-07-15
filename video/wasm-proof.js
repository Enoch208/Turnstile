import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const UFVK = readFileSync("/Users/enoch/Developer/personal/Turnstile/.env", "utf8").match(/TURNSTILE_UFVK=(\S+)/)[1];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 900 });
await page.goto("http://localhost:4012/check", { waitUntil: "networkidle2" });

async function paste(value) {
  await page.evaluate(v => {
    const el = document.getElementById("ufvk");
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
  await new Promise(r => setTimeout(r, 1400));
  return page.evaluate(() => document.body.innerText.match(/Valid mainnet key[^\n]*|checksum fails[^\n]*|spending key[^\n]*/)?.[0] ?? "NO CHIP");
}

console.log("real key   →", await paste(UFVK));
await page.screenshot({ path: "out/verify/wasm-valid.png" });
console.log("corrupted  →", await paste(UFVK.slice(0, -4) + "qqqq"));
await page.screenshot({ path: "out/verify/wasm-typo.png" });
await browser.close();
