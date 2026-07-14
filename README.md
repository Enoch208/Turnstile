# Turnstile — Ironwood Migration Companion

> **Ironwood activates at block 3,428,143. Is your ZEC ready?**

Turnstile tells any Zcash user, in under 60 seconds and **without ever touching their spending
keys**, whether their shielded funds are exposed to the Orchard pool closure — and walks them
through exactly what to do about it, wallet by wallet.

Built for **ZecHub Hackathon 3.0** · Infrastructure track · MIT licensed.

## What it does

- **Activation countdown** — live mainnet height, blocks remaining, ETA with block-drift correction.
- **Wallet readiness check** — paste a unified full viewing key, get a pool-by-pool verdict
  (transparent / Sapling / Orchard) and a migration plan. Keys never stored, never logged.
- **Migration guides** — Zashi, YWallet, Zingo PC, Zallet, and funds on an exchange.
- **Anonymous alerts** — subscribe by sending a shielded mainnet memo. No email, no account.
- **`turnstile-check` CLI** — the same scan, run entirely on your own machine.

## What Turnstile can and cannot see

Turnstile reads with a **Unified Full Viewing Key (UFVK)**. A viewing key can *see*; it can never
*spend*. This is Zcash selective disclosure working exactly as designed.

**It can see:** your pool balances and the transactions your key is entitled to decrypt.
**It cannot see, and will never accept:** a seed phrase or a spending key. There is no code path
that takes one.

Your viewing key is held in memory for the duration of the scan and then discarded. It is never
written to a log, a database, an analytics event, or a URL. The scanner wipes its wallet directory
after every job. If you would rather not send a viewing key anywhere at all, run the CLI locally —
it is a first-class path, not a fallback.

## How this uses Zcash mainnet

| | |
|---|---|
| **Reads** | Live chain height via lightwalletd; wallet scans via zingolib from a UFVK; shielded pool values. |
| **Writes / receives** | Real shielded mainnet transactions with encrypted memos drive the alert subscription system. |

## Repository layout

```
frontend/   Next.js 16 web app (Vercel)
core/       turnstile-core — UFVK scan, pool balances, verdict logic
scanner/    axum service: POST /scan, GET /health + shielded-memo watcher
cli/        turnstile-check — local scan, same core
```

## Quickstart

**Web app**

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

**Scanner service**

```bash
cargo run -p turnstile-scanner        # listens on :8080
curl localhost:8080/health
```

**CLI**

```bash
cargo build --release -p turnstile-check
./target/release/turnstile-check --ufvk uview1... --birthday 3350000
```

**Tests**

```bash
cargo test           # core logic: verdicts, chain math, memo parsing, key validation
cd frontend && npm run lint
```

## Configuration

Copy `.env.example` to `.env` and fill it in. Every value has a documented default; the scanner
falls back across multiple lightwalletd endpoints so a single outage cannot take the tool down.

## Credits

Migration guidance is adapted from the **[ZecHub wiki](https://zechub.wiki)** with attribution.
The shielded-pools monitor builds on ZecHub's open-sourced Shielded Metrics.

## Disclaimer

Turnstile is an educational tool, not financial advice. Always verify against official sources:
the [ZecHub wiki](https://zechub.wiki) and the [Zcash network upgrade page](https://z.cash/upgrade/).

## License

MIT — see [LICENSE](LICENSE).
