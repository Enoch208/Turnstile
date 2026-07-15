import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import puppeteer from "puppeteer-core";
import { config } from "dotenv";
import { CURSOR_INIT } from "./cursor.js";
import { BASE, scenes } from "./script.js";

config({ path: new URL(".env.local", import.meta.url).pathname });

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FRAMES = new URL("frames/", import.meta.url).pathname;
const UFVK = readFileSync("/Users/enoch/Developer/personal/Turnstile/.env", "utf8")
  .match(/TURNSTILE_UFVK=(\S+)/)[1];
const BIRTHDAY = "3411399";

const durations = JSON.parse(
  readFileSync(new URL("assets/vo/durations.json", import.meta.url), "utf8"),
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function center(page, finder) {
  return page.evaluate(finder, null);
}

async function moveToSel(page, selector, ms = 900) {
  const c = await page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, selector);
  if (!c) throw new Error(`selector not found: ${selector}`);
  await page.evaluate(({ x, y, ms }) => window.__cursor.moveTo(x, y, ms), { ...c, ms });
  return c;
}

async function moveToText(page, text, ms = 900) {
  const c = await page.evaluate(t => {
    let best = null;
    for (const el of document.body.querySelectorAll("*")) {
      if (!el.textContent.includes(t)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (!best || el.textContent.length < best.len) {
        best = { len: el.textContent.length, x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
    }
    return best && { x: best.x, y: best.y };
  }, text);
  if (!c) throw new Error(`text not found: ${text}`);
  await page.evaluate(({ x, y, ms }) => window.__cursor.moveTo(x, y, ms), { ...c, ms });
  return c;
}

const pulse = page => page.evaluate(() => window.__cursor.pulse());
const idle = (page, ms) => page.evaluate(ms => window.__cursor.idle(ms), ms);

async function wheelFor(page, totalMs, deltaY) {
  const t0 = Date.now();
  while (Date.now() - t0 < totalMs) {
    await page.mouse.wheel({ deltaY });
    await sleep(60);
  }
}

// Precise eased scroll — the app has no momentum-scroll lib, so exact targets are safe.
function scrollToY(page, y, ms) {
  return page.evaluate(
    ({ y, ms }) =>
      new Promise(res => {
        const s0 = window.scrollY, t0 = performance.now();
        const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        function step(now) {
          const k = Math.min(1, (now - t0) / ms);
          window.scrollTo(0, s0 + (y - s0) * ease(k));
          if (k < 1) requestAnimationFrame(step); else res();
        }
        requestAnimationFrame(step);
      }),
    { y, ms },
  );
}

function scrollToSel(page, sel, ms) {
  return page.evaluate(
    ({ sel, ms }) =>
      new Promise(res => {
        const el = document.querySelector(sel);
        const y = el ? el.getBoundingClientRect().top + window.scrollY - 90 : window.scrollY;
        const s0 = window.scrollY, t0 = performance.now();
        const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        function step(now) {
          const k = Math.min(1, (now - t0) / ms);
          window.scrollTo(0, s0 + (y - s0) * ease(k));
          if (k < 1) requestAnimationFrame(step); else res();
        }
        requestAnimationFrame(step);
      }),
    { sel, ms },
  );
}

function setReactValue(page, selector, value) {
  return page.evaluate(
    ({ sel, val }) => {
      const el = document.querySelector(sel);
      const proto = el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, val);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    { sel: selector, val: value },
  );
}

// ---- capture machinery ------------------------------------------------------

async function record(page, sceneId, run) {
  const cdp = await page.createCDPSession();
  const frames = [];
  cdp.on("Page.screencastFrame", async ev => {
    frames.push({ b64: ev.data, ts: ev.metadata.timestamp });
    try { await cdp.send("Page.screencastFrameAck", { sessionId: ev.sessionId }); } catch {}
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, everyNthFrame: 1 });
  const t0 = Date.now();
  await run();
  await cdp.send("Page.stopScreencast");
  await cdp.detach();

  if (frames.length < 10) throw new Error(`${sceneId}: only ${frames.length} frames — capture broken`);

  const dir = `${FRAMES}${sceneId}/`;
  mkdirSync(dir, { recursive: true });
  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const name = `f${String(i).padStart(5, "0")}.jpg`;
    writeFileSync(dir + name, Buffer.from(frames[i].b64, "base64"));
    const dur = i < frames.length - 1
      ? Math.max(0.001, frames[i + 1].ts - frames[i].ts)
      : 0.2;
    lines.push(`file '${name}'`, `duration ${dur.toFixed(4)}`);
  }
  lines.push(`file 'f${String(frames.length - 1).padStart(5, "0")}.jpg'`);
  writeFileSync(`${dir}frames.txt`, lines.join("\n") + "\n");

  const span = frames[frames.length - 1].ts - frames[0].ts;
  console.log(`  ${sceneId}: ${frames.length} frames, ${span.toFixed(1)}s motion (wall ${(Date.now() - t0) / 1000}s)`);
}

// ---- scene choreography -----------------------------------------------------

const vo = id => durations[id] * 1000;
const ONLY = process.argv.slice(2);
const want = id => ONLY.length === 0 || ONLY.includes(id);

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    defaultViewport: null,
    args: [
      "--window-size=1512,948",
      "--force-device-scale-factor=1",
      "--hide-scrollbars",
      "--disable-infobars",
      "--no-first-run",
      "--no-default-browser-check",
    ],
  });

  const page = (await browser.pages())[0] ?? (await browser.newPage());
  await page.evaluateOnNewDocument(CURSOR_INIT);

  // ---- hook: landing with live countdown
  if (want("hook")) {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
    await page.waitForFunction(() => /\d{1,3},\d{3},\d{3}/.test(document.body.innerText), { timeout: 30000 });
    await page.evaluate(CURSOR_INIT);
    await record(page, "hook", async () => {
      const t0 = Date.now();
      await idle(page, 2600);
      await scrollToSel(page, "#countdown", 2200);
      await idle(page, 3000);
      await scrollToSel(page, "#features", 2200);
      await idle(page, 2200);
      await scrollToY(page, 0, 1800);
      const left = vo("hook") + 800 - (Date.now() - t0);
      if (left > 0) await idle(page, left);
    });
  }

  // ---- check: the form + privacy panel
  if (want("check")) {
  await page.goto(`${BASE}/check`, { waitUntil: "networkidle2" });
  await page.evaluate(CURSOR_INIT);
  await record(page, "check", async () => {
    const t0 = Date.now();
    await idle(page, 900);
    await moveToSel(page, "#ufvk", 1100);
    await pulse(page);
    await idle(page, 1400);
    await moveToText(page, "What happens to your key", 1100);
    await idle(page, 1600);
    await moveToText(page, "A spending key is refused", 900);
    const left = vo("check") + 800 - (Date.now() - t0);
    if (left > 0) await idle(page, left);
  });
  }

  // ---- scan: paste key, submit, watch progress (recording)
  if (want("scan") || want("verdict")) {
  if (!(await page.url()).includes("/check")) {
    await page.goto(`${BASE}/check`, { waitUntil: "networkidle2" });
    await page.evaluate(CURSOR_INIT);
  }
  await record(page, "scan", async () => {
    const t0 = Date.now();
    await moveToSel(page, "#ufvk", 800);
    await pulse(page);
    await setReactValue(page, "#ufvk", UFVK);
    await idle(page, 900);
    await moveToSel(page, "#birthday", 700);
    await pulse(page);
    await setReactValue(page, "#birthday", BIRTHDAY);
    await idle(page, 700);
    await moveToText(page, "Check my wallet", 800);
    await pulse(page);
    await page.evaluate(() => {
      [...document.querySelectorAll("button")].find(b => b.textContent.includes("Check my wallet")).click();
    });
    await page.waitForFunction(() => document.body.innerText.includes("Scanning"), { timeout: 15000 });
    const left = vo("scan") + 800 - (Date.now() - t0);
    if (left > 0) await idle(page, left);
  });

  // ---- verdict: wait (not recording) for the real mainnet result, then record
  console.log("  waiting for the real mainnet scan to finish…");
  await page.waitForFunction(
    () => document.body.innerText.includes("You hold ZEC in the Orchard pool"),
    { timeout: 120000, polling: 500 },
  );
  await sleep(600);
  await record(page, "verdict", async () => {
    const t0 = Date.now();
    await idle(page, 1500);
    await moveToText(page, "Orchard", 1000);
    await pulse(page);
    await idle(page, 2000);
    await moveToText(page, "You hold ZEC in the Orchard pool", 1000);
    const left = vo("verdict") + 800 - (Date.now() - t0);
    if (left > 0) await idle(page, left);
  });
  }

  // ---- guides: picker → Zashi
  if (want("guides")) {
  await page.goto(`${BASE}/guides`, { waitUntil: "networkidle2" });
  await page.evaluate(CURSOR_INIT);
  await record(page, "guides", async () => {
    const t0 = Date.now();
    await idle(page, 1400);
    await moveToText(page, "Zashi", 1100);
    await pulse(page);
    await page.evaluate(() => {
      [...document.querySelectorAll("a")].find(a => a.getAttribute("href") === "/guides/zashi").click();
    });
    await page.waitForFunction(() => location.pathname === "/guides/zashi", { timeout: 15000 });
    await page.evaluate(CURSOR_INIT);
    await idle(page, 1800);
    await scrollToY(page, 620, 2200);
    const left = vo("guides") + 800 - (Date.now() - t0);
    if (left > 0) await idle(page, left);
  });
  }

  // ---- alerts: type a topic, QR appears
  if (want("alerts")) {
  await page.goto(`${BASE}/alerts`, { waitUntil: "networkidle2" });
  await page.evaluate(CURSOR_INIT);
  await record(page, "alerts", async () => {
    const t0 = Date.now();
    await idle(page, 1000);
    await moveToSel(page, "#topic", 1000);
    await pulse(page);
    await page.click("#topic");
    await page.keyboard.type("my-ironwood-alerts", { delay: 55 });
    await idle(page, 1200);
    const left = vo("alerts") + 800 - (Date.now() - t0);
    if (left > 0) await idle(page, left);
  });
  }

  // ---- mainnet: the real memo tx confirming on a third-party explorer
  if (want("mainnet")) {
  const sc = scenes.find(s => s.id === "mainnet");
  await page.goto(sc.url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.body.innerText.includes("Confirmations"), { timeout: 30000 });
  await page.evaluate(CURSOR_INIT);
  await record(page, "mainnet", async () => {
    const t0 = Date.now();
    await idle(page, 2000);
    await moveToText(page, "3,412,465", 1200);
    await pulse(page);
    await idle(page, 2200);
    await scrollToY(page, 420, 2000);
    await moveToText(page, "orchard-pool", 1000);
    await pulse(page);
    await idle(page, 2400);
    await scrollToY(page, 0, 1600);
    const left = vo("mainnet") + 800 - (Date.now() - t0);
    if (left > 0) await idle(page, left);
  });
  }

  // ---- pools: the turnstile tracker
  if (want("pools")) {
  await page.goto(`${BASE}/pools`, { waitUntil: "networkidle2" });
  await page.waitForFunction(() => document.body.innerText.includes("ZEC"), { timeout: 30000 });
  await page.evaluate(CURSOR_INIT);
  await record(page, "pools", async () => {
    const t0 = Date.now();
    await idle(page, 1600);
    await moveToText(page, "3,770,220 ZEC", 1100);
    await pulse(page);
    await idle(page, 1800);
    await scrollToY(page, 520, 2200);
    await idle(page, 2000);
    const left = vo("pools") + 800 - (Date.now() - t0);
    if (left > 0) await idle(page, left);
  });
  }

  // ---- readiness: scroll the board
  if (want("readiness")) {
  await page.goto(`${BASE}/readiness`, { waitUntil: "networkidle2" });
  await page.evaluate(CURSOR_INIT);
  await record(page, "readiness", async () => {
    const t0 = Date.now();
    await idle(page, 1600);
    await scrollToY(page, 780, 3400);
    const left = vo("readiness") + 800 - (Date.now() - t0);
    if (left > 0) await idle(page, left);
  });
  }

  await browser.close();
  console.log("all scenes captured");
}

main().catch(e => { console.error(e); process.exit(1); });
