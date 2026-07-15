import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const UFVK = readFileSync("/Users/enoch/Developer/personal/Turnstile/.env", "utf8").match(/TURNSTILE_UFVK=(\S+)/)[1];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.goto("https://turnstile-xi.vercel.app/check", { waitUntil: "networkidle2", timeout: 45000 });
await page.evaluate(v => {
  const el = document.getElementById("ufvk");
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(el, v);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}, UFVK);
await new Promise(r => setTimeout(r, 2500));
console.log("LIVE:", await page.evaluate(() => document.body.innerText.match(/Valid mainnet key[^\n]*/)?.[0] ?? "NO CHIP"));
await browser.close();
