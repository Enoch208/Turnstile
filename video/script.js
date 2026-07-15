// The demo cut. Each scene has narration (vo) and a kind:
//   card  → rendered HTML still (title/section), fades
//   app   → live capture driving the real app at BASE
// Order puts the real scan → Exposed verdict as the climax, before the outro.

export const BASE = "http://localhost:4010";
export const SITE_URL = "https://turnstile-xi.vercel.app";

export const scenes = [
  {
    id: "intro",
    kind: "card",
    card: "title",
    vo: "Zcash is about to seal one of its shielded pools. Most holders have no idea if they're affected.",
  },
  {
    id: "hook",
    kind: "app",
    path: "/",
    vo: "On July twenty-eighth, at block three million, four hundred twenty-eight thousand, one hundred forty-three, the Ironwood upgrade closes the Orchard pool to new deposits. Turnstile tells you where your ZEC actually sits — in under a minute, and without ever touching a spending key.",
  },
  {
    id: "check",
    kind: "app",
    path: "/check",
    vo: "It starts with a viewing key. A key that can read your balance, but can never spend it. Turnstile has no field for a seed phrase, and no code path that would accept one.",
  },
  {
    id: "scan",
    kind: "app",
    path: "/check",
    vo: "Paste it, and Turnstile scans the Zcash mainnet — restoring your wallet from the viewing key alone, and reading every shielded pool. Your key lives in memory for the length of the scan, and is never written to a log, a database, or a URL.",
  },
  {
    id: "verdict",
    kind: "app",
    path: "/check",
    vo: "And here is the answer. Real ZEC, sitting in the Orchard pool, read from a key that cannot move it. Not frozen, not lost — but it needs to move before the pool closes.",
  },
  {
    id: "guides",
    kind: "app",
    path: "/guides",
    vo: "For every wallet, a migration path — even the ones Turnstile can't read. Zashi, the most popular wallet, shields to Orchard by default, yet can't export a viewing key at all.",
  },
  {
    id: "alerts",
    kind: "app",
    path: "/alerts",
    vo: "Want a reminder before it closes? Send a shielded memo. No email, no account — the chain itself is the signup form.",
  },
  {
    id: "mainnet",
    kind: "app",
    url: "https://3xpl.com/zcash/transaction/ff53f47083790f046be7977e6c6c2337a430d3de6b5d34eba32c2c0ed7ff382d",
    vo: "And none of this is staged. Here is that shielded memo — a real transaction, confirmed on Zcash mainnet at block three million, four hundred twelve thousand, four hundred sixty five. An encrypted memo in, a push notification out, and not one byte of personal data anywhere on the path.",
  },
  {
    id: "pools",
    kind: "app",
    path: "/pools",
    vo: "For the community: the shielded pools themselves, charted from ZecHub's own open-source metrics. Three point seven seven million ZEC still sits in Orchard — and after activation, this is where the ecosystem watches it drain.",
  },
  {
    id: "readiness",
    kind: "app",
    path: "/readiness",
    vo: "And a board tracking who is actually ready. Sourced, dated, and honest about the fifteen that have said nothing at all.",
  },
  {
    id: "proof",
    kind: "card",
    card: "grep",
    vo: "The whole promise, in one line. Grep the server logs for your key, and find nothing. Every scan, by construction.",
  },
  {
    id: "outro",
    kind: "card",
    card: "outro",
    vo: "Turnstile. The Ironwood migration companion. Find out if your ZEC is ready.",
  },
];
