// The demo cut. Each scene: narration (vo), a burned-in lower-third (caption),
// and a kind: card (rendered still) or app (live capture at BASE / url).
// Discord autoplays muted — captions carry the story without sound.

export const BASE = "http://localhost:4010";
export const SITE_URL = "https://turnstile-xi.vercel.app";

export const scenes = [
  {
    id: "intro",
    kind: "card",
    card: "title",
    vo: "Zcash is about to close one of its shielded pools. Most holders have no idea if their money is affected.",
  },
  {
    id: "hook",
    kind: "app",
    path: "/",
    caption: "turnstile-xi.vercel.app — live on Zcash mainnet",
    vo: "This is Turnstile — live on Zcash mainnet, right now. In about two weeks, at block three million four hundred twenty-eight thousand one hundred forty-three, the Orchard pool stops taking deposits. Three point seven seven million ZEC is sitting inside it. Turnstile tells you if yours is too.",
  },
  {
    id: "check",
    kind: "app",
    path: "/check",
    caption: "The key is parsed in your browser — Rust, compiled to WebAssembly",
    vo: "It works with a viewing key. A viewing key can read a wallet — it can never spend from it. Watch: the moment you paste it, the key is checked cryptographically, inside your browser, before anything is sent anywhere.",
  },
  {
    id: "scan",
    kind: "app",
    path: "/check",
    caption: "Scanning the real Zcash blockchain, from a viewing key alone",
    vo: "One click, and Turnstile scans the real Zcash blockchain — restoring the wallet from the viewing key alone, block by block. The key lives in memory for the length of the scan. It is never written down. Anywhere.",
  },
  {
    id: "verdict",
    kind: "app",
    path: "/check",
    caption: "Real ZEC · real Orchard pool · found read-only",
    vo: "And there is the answer. This wallet holds real ZEC, in the real Orchard pool. Zero point zero one one seven ZEC — exposed. Found with a key that cannot move it.",
  },
  {
    id: "guides",
    kind: "app",
    path: "/guides",
    caption: "A migration path for every wallet — even the ones we can't read",
    vo: "Every wallet gets a way out. Even the ones Turnstile cannot read — like Zashi, which can't export a viewing key — get honest, step-by-step instructions instead.",
  },
  {
    id: "alerts",
    kind: "app",
    path: "/alerts",
    caption: "Subscribe by sending a shielded memo — no email, no account",
    vo: "Need a reminder before the pool closes? Send a shielded memo on mainnet. The memo is the signup. No email. No account. Nothing that identifies you.",
  },
  {
    id: "mainnet",
    kind: "app",
    url: "https://3xpl.com/zcash/transaction/ff53f47083790f046be7977e6c6c2337a430d3de6b5d34eba32c2c0ed7ff382d",
    caption: "3xpl.com/zcash/transaction/ff53f470… — look it up yourself",
    vo: "And none of this is staged. This is that exact memo, on a public block explorer we do not control. A real transaction, confirmed on Zcash mainnet at block three million four hundred twelve thousand four hundred sixty-five. Real money moved. Our server decrypted the memo from the chain, and the phone buzzed. You can look this transaction up yourself, right now.",
  },
  {
    id: "pools",
    kind: "app",
    path: "/pools",
    caption: "Data: ZecHub's open-source Shielded Metrics",
    vo: "Zoom out, and you can watch the whole story. ZecHub's own data shows the Orchard pool already draining, before the deadline. After activation, this chart is where the ecosystem watches it empty.",
  },
  {
    id: "readiness",
    kind: "app",
    path: "/readiness",
    caption: "0 of 17 wallets & exchanges have publicly declared ready",
    vo: "Who else is ready? We track every public statement, with a source and a date for each. So far — zero wallets, and zero exchanges, have declared themselves ready. We even list ourselves.",
  },
  {
    id: "proof",
    kind: "card",
    card: "grep",
    vo: "One more thing. After everything you just watched — search our server logs for the viewing key. Nothing. It was never there to leak.",
  },
  {
    id: "outro",
    kind: "card",
    card: "outro",
    vo: "Turnstile. Is your ZEC ready for Ironwood? Check it now — the link is right there.",
  },
];
