import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = new URL("assets/cards/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const shell = body => `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1920px; height:1080px; background:#030303; color:#FAFAFA;
         font-family:-apple-system,'Helvetica Neue',sans-serif; overflow:hidden;
         display:flex; flex-direction:column; justify-content:center; padding:0 160px; }
  .glow { position:fixed; inset:0;
          background:radial-gradient(ellipse 55% 45% at 50% 0%, rgba(52,211,153,0.10), transparent 70%); }
  .eyebrow { font-family:'SF Mono',Menlo,monospace; font-size:22px; letter-spacing:8px;
             color:#71717A; text-transform:uppercase; margin-bottom:36px; }
  .eyebrow b { color:#34D399; font-weight:600; }
  h1 { font-size:104px; font-weight:500; letter-spacing:-4px; line-height:1.02; }
  h1 .dim { background:linear-gradient(90deg,#71717A,#FAFAFA,#71717A);
            -webkit-background-clip:text; background-clip:text; color:transparent; }
  .sub { margin-top:40px; font-size:34px; color:#A1A1AA; font-weight:400; max-width:1100px; line-height:1.45; }
  .mono { font-family:'SF Mono',Menlo,monospace; }
  .term { background:#09090B; border:1px solid #27272A; border-radius:20px; padding:56px 64px;
          font-family:'SF Mono',Menlo,monospace; font-size:30px; line-height:2; }
  .p { color:#71717A; } .g { color:#34D399; } .w { color:#FAFAFA; }
  .foot { position:fixed; bottom:70px; left:160px; right:160px; display:flex;
          justify-content:space-between; font-family:'SF Mono',Menlo,monospace;
          font-size:22px; letter-spacing:4px; color:#71717A; text-transform:uppercase; }
</style></head><body><div class="glow"></div>${body}</body></html>`;

const cards = {
  title: shell(`
    <div class="eyebrow"><b>●</b>&nbsp; ZCASH · IRONWOOD · BLOCK 3,428,143</div>
    <h1>Turnstile<br><span class="dim">Terminal</span></h1>
    <div class="sub">The Orchard pool stops taking deposits on July 28.
    Find out where your ZEC sits — <span class="mono" style="color:#34D399">without ever touching a spending key.</span></div>
    <div class="foot"><span>turnstile-xi.vercel.app</span><span>read-only · open source</span></div>
  `),
  grep: shell(`
    <div class="eyebrow"><b>THE PROOF</b>&nbsp; · WHAT THE SERVER LOGS AFTER A REAL SCAN</div>
    <div class="term">
      <div><span class="g">$</span> <span class="w">grep -i uview scanner.log</span></div>
      <div class="p">(nothing)</div>
      <div>&nbsp;</div>
      <div><span class="g">$</span> <span class="w">cat scanner.log</span></div>
      <div><span class="p">INFO</span> scan complete <span class="w">job=907cde40</span> <span class="g">verdict=Exposed</span> <span class="w">height=3412687</span></div>
    </div>
    <div class="sub" style="margin-top:48px">The job id, the verdict, the height. <span style="color:#FAFAFA">Never the key.</span></div>
  `),
  outro: shell(`
    <div class="eyebrow"><b>●</b>&nbsp; IS YOUR ZEC READY?</div>
    <h1>turnstile<span class="dim">-xi.vercel.app</span></h1>
    <div class="sub">Check your wallet in under a minute. No spending keys, ever —
    and you can grep the logs to prove it.</div>
    <div class="foot"><span>ZecHub Hackathon 3.0</span><span>MIT · built on zingolib</span></div>
  `),
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
for (const [name, html] of Object.entries(cards)) {
  await page.setContent(html, { waitUntil: "load" });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: `${OUT}${name}.png` });
  console.log(`  card: ${name}.png`);
}
await browser.close();
