# Turnstile — the Ironwood migration companion

> **Orchard stops taking deposits at block 3,428,143 (~28 July 2026). Is your ZEC ready?**

Turnstile tells any Zcash user, in under a minute and **without ever touching a spending key**,
whether their funds sit in the Orchard pool — and walks them through exactly what to do about it,
wallet by wallet.

Built for **ZecHub Hackathon 3.0** · Infrastructure track · MIT licensed.

---

## What it does

| | |
|---|---|
| **Countdown** | Live mainnet height and blocks remaining, read from lightwalletd every minute. |
| **Wallet readiness check** | Paste a unified full viewing key → per-pool balances → a verdict. |
| **Migration guides** | Zashi, YWallet, Zingo PC, Zallet, and ZEC held on an exchange. |
| **Anonymous alerts** | Subscribe by sending a shielded mainnet memo. No email, no account. |
| **`turnstile-check` CLI** | The same scan, run entirely on your own machine. |

## What Turnstile can and cannot see

Turnstile reads with a **unified full viewing key**. A viewing key can *see*; it can never
*spend*. This is Zcash selective disclosure working as designed.

**It cannot accept a spending key or a seed phrase.** There is no code path that takes one — the
browser refuses it before any request is made, and the API refuses it again before anything
reaches the scanner.

Your viewing key is held in memory for the duration of the scan and then dropped. It is never
written to a log, a database, or a URL. This is enforced structurally: `ScanRequest` has a
hand-written `Debug` that prints `<redacted>`, so a stray log line *cannot* leak it. You can check
this claim yourself — run the scanner at `RUST_LOG=debug`, scan a key, and grep the output for it.

Be aware of what a viewing key *does* expose, wherever you paste it: your balances, your full
transaction history in and out, memos, and counterparties. If you would rather send us nothing at
all, **run the CLI** — it is a first-class path, not a fallback.

## The verdicts

| | |
|---|---|
| 🔴 **Action needed** | You hold ZEC in Orchard. Not frozen, not lost — but move it. |
| 🟡 **Nothing to do** | Funds sit in transparent or Sapling. The activation does not touch them. |
| 🟢 **Ready** | No funds in any pool. |
| ⚪ **Cannot determine** | **The key carries no Orchard viewing capability.** |

That fourth verdict matters. ZIP-316 permits a valid `uview1…` key that contains a Sapling key but
**no Orchard key**. Such a key cannot see Orchard at all — and reporting "0 in Orchard, you're
safe" for it would be a false all-clear, the worst failure this tool could have. Turnstile reports
each pool as `Option`: a pool that is invisible to your key renders as *not visible to this key*,
never as a zero balance.

## What actually changes at the activation height

Orchard stops accepting **new** value. Funds already inside are **not frozen and cannot be lost** —
they leave by being spent out, through the turnstile. Moving early is calmer, not mandatory. We
say this plainly because the product exists to reduce panic, not to manufacture it.

## Repository layout

```
frontend/   Next.js 16 web app
core/       turnstile-core — scan, verdicts, chain maths, memo parsing
scanner/    axum service: POST /scan (job-based), GET /status, memo watcher → ntfy
cli/        turnstile-check
```

`core/` owns the domain logic; the scanner and the CLI are thin shells over it, so the scan is
written once.

## Quickstart

```bash
# Scanner service (needs protoc; the zingolib build fetches Sapling params on first compile)
cargo run -p turnstile-scanner        # :8080

# Web app
cd frontend && npm install && npm run dev   # :3000

# CLI — scans locally, sends nothing anywhere
cargo run -p turnstile-check -- --ufvk uview1... --birthday 3411399
```

Real output, against mainnet, from a wallet holding real ZEC in Orchard:

```
  TRANSPARENT   0 ZEC
  SAPLING       0 ZEC
  ORCHARD       0.01176637 ZEC

  You hold ZEC in the Orchard pool
  Your funds are not frozen and cannot be lost. After the activation height Orchard accepts
  nothing new, and value leaves only by being spent out. Move it while your wallet still makes
  that a single tap.
  Activation is at block 3428143.
  Scanned to block 3,412,461.
```

That verdict was produced from a **viewing key alone** — the wallet's spending key never went
anywhere near Turnstile. The scanner's logs for that scan read, in full:

```
INFO turnstile_scanner::jobs: scan complete job=39e4fbe01 verdict=Exposed scanned_to_height=3412461
```

No key. Grep them yourself.

## Alerts, without an account

Send **0.0001 ZEC** to the Turnstile address with the memo:

```
TURNSTILE:SUB:<your-topic>
```

The watcher reads the encrypted memo from the chain, registers the topic, and pushes you a
confirmation. You are alerted 48 hours before, 1 hour before, and at activation.

Proven end to end on mainnet — a real shielded memo, decrypted from the chain, pushed:

```
tx ff53f470… carries memo TURNSTILE:SUB:turnstile-demo-7f3a

INFO turnstile_scanner::alerts: new subscription topic=turnstile-demo-7f3a height=3412465
    → ntfy: "Turnstile — you are subscribed"
```

No email, no account, no identifier of any kind changed hands. The chain was the signup form.

The watcher is given a **viewing key, not a spending key** — reading memos is all it needs. The
server therefore *cannot spend the dust it is sent*, by construction rather than by policy.

## Configuration

Copy `.env.example` to `.env`. Everything has a working default except the alert address; leave
`TURNSTILE_UFVK` unset and the watcher disables itself while the rest of the tool runs normally.

## Tests

```bash
cargo test -p turnstile-core   # verdicts, chain maths, memo parsing, key validation
cargo test --workspace         # the above plus the chain backend
cd frontend && npm run lint && npm run build
```

CI runs the pure logic without the chain backend so it returns a signal in about a minute, and
builds the full workspace separately so a slow zingolib compile cannot mask a broken verdict rule.

## Credits

Migration guidance is adapted from the **[ZecHub wiki](https://zechub.wiki)** with attribution.
Scanning is powered by **[zingolib](https://github.com/zingolabs/zingolib)** from Zingo Labs.

## Disclaimer

Turnstile is an educational tool, not financial advice. Always verify against official sources:
the [ZecHub wiki](https://zechub.wiki) and the [Zcash upgrade page](https://z.cash/upgrade/).

## License

MIT — see [LICENSE](LICENSE).
