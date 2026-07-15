import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TX = "ff53f47083790f046be7977e6c6c2337a430d3de6b5d34eba32c2c0ed7ff382d";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1512, height: 860 });
for (const url of [
  `https://mainnet.zcashexplorer.app/transactions/${TX}`,
  `https://3xpl.com/zcash/transaction/${TX}`,
]) {
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    await new Promise(r => setTimeout(r, 3500));
    const hasTx = await page.evaluate(t => document.body.innerText.includes(t.slice(0, 12)), TX);
    console.log(`${res?.status()}  tx-visible=${hasTx}  ${url.slice(8, 40)}`);
    if (hasTx) { await page.screenshot({ path: "assets/explorer-probe.png" }); console.log("screenshot saved"); break; }
  } catch (e) { console.log(`FAIL ${url.slice(8, 40)}: ${e.message.slice(0, 60)}`); }
}
await browser.close();
