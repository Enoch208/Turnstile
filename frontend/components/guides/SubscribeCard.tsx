"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import {
  Alert02Icon,
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Icon,
} from "@/components/icons/Icon";
import { Button } from "@/components/ui/Button";
import {
  SUBSCRIPTION_AMOUNT,
  isValidTopic,
  ntfyTopicUrl,
  subscriptionMemo,
  zip321Uri,
} from "@/lib/zip321";

const SCHEDULE = ["48 hours before", "1 hour before", "At activation"];

function StepLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-faint">
      {children}
    </div>
  );
}

export function SubscribeCard({ address }: { address: string | null }) {
  const [topic, setTopic] = useState("");
  const [rendered, setRendered] = useState<{ uri: string; dataUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const valid = isValidTopic(topic);
  const memo = subscriptionMemo(topic || "your-topic");
  const uri = address && valid ? zip321Uri(address, topic) : null;
  const alertsUrl = ntfyTopicUrl(valid ? topic : "your-topic");

  useEffect(() => {
    if (!uri) return;

    let cancelled = false;

    QRCode.toDataURL(uri, {
      margin: 2,
      width: 320,
      color: { dark: "#030303", light: "#FAFAFA" },
    })
      .then((dataUrl) => {
        if (!cancelled) setRendered({ uri, dataUrl });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [uri]);

  const qr = rendered && rendered.uri === uri ? rendered.dataUrl : null;

  async function copy() {
    if (!uri) return;
    await navigator.clipboard.writeText(uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!address) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-partial/30 bg-partial/[0.06] p-6 text-sm leading-relaxed text-partial">
        <Icon icon={Alert02Icon} size={18} />
        Alerts are not configured on this deployment — no Turnstile address is set, so there is
        nowhere to send the memo. The rest of the tool works normally.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
      <h2 className="mb-2 text-xl font-medium tracking-tight text-foreground">
        Subscribe with a shielded memo
      </h2>
      <p className="mb-6 text-sm leading-relaxed text-muted">
        Three steps: pick a topic, send one shielded memo, and open the page where your alerts
        arrive. No email, no account, and nothing that identifies you.
      </p>

      <StepLabel>Step 1 — Pick a topic</StepLabel>

      <label htmlFor="topic" className="sr-only">
        Your topic
      </label>
      <input
        id="topic"
        value={topic}
        onChange={(event) => setTopic(event.target.value.replace(/[^A-Za-z0-9_-]/g, ""))}
        placeholder="pick-any-name"
        className="mb-6 w-full cursor-text rounded-lg border border-border bg-canvas px-4 py-3 font-mono text-sm text-foreground placeholder:text-faint focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />

      <StepLabel>Step 2 — Send {SUBSCRIPTION_AMOUNT} ZEC with this memo</StepLabel>

      <div className="mb-4 rounded-lg border border-border bg-canvas px-4 py-3">
        <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-faint">
          Memo
        </div>
        <code className="font-mono text-sm break-all text-accent">{memo}</code>
      </div>

      {qr ? (
        <div className="mb-4 flex flex-col items-center gap-4 rounded-xl border border-border bg-foreground p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="ZIP-321 payment request" width={200} height={200} />
          <p className="text-center font-mono text-[10px] uppercase tracking-widest text-canvas/60">
            Scan with any Zcash wallet
          </p>
        </div>
      ) : (
        <div className="mb-4 flex h-[200px] items-center justify-center rounded-xl border border-dashed border-border bg-canvas text-center font-mono text-xs text-faint">
          {topic ? "Topic must be letters, numbers, - or _" : "Enter a topic to generate the QR"}
        </div>
      )}

      <Button onClick={copy} disabled={!uri} variant="secondary" className="mb-6 w-full">
        {copied ? "Copied" : "Copy payment URI"}
        <Icon icon={copied ? CheckmarkCircle02Icon : Copy01Icon} size={15} />
      </Button>

      <StepLabel>Step 3 — Open where your alerts arrive</StepLabel>

      <div className="mb-6 rounded-lg border border-accent/25 bg-accent/[0.04] px-4 py-3">
        {valid ? (
          <a
            href={alertsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm font-mono text-sm break-all text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {alertsUrl}
            <Icon icon={ArrowUpRight01Icon} size={14} />
          </a>
        ) : (
          <code className="font-mono text-sm break-all text-faint">{alertsUrl}</code>
        )}
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Alerts are delivered over ntfy, an open push service — nothing arrives by email. Keep
          this page open in a tab, or subscribe to the topic in the ntfy app. A{" "}
          <span className="text-foreground">&ldquo;you are subscribed&rdquo;</span> push lands
          there within a few minutes of your memo confirming — that is how you know it worked.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-5">
        {SCHEDULE.map((when) => (
          <span
            key={when}
            className="cursor-default rounded-full border border-border bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted"
          >
            {when}
          </span>
        ))}
      </div>

      <p className="mt-5 text-xs leading-relaxed text-faint">
        These pushes are the shared countdown — the same three alerts for everyone. They know
        nothing about your wallet, because the memo tells us a topic name and nothing else. To
        see whether your own ZEC is exposed,{" "}
        <Link
          href="/check"
          className="cursor-pointer text-muted underline underline-offset-4 transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          run the wallet check
        </Link>{" "}
        — that is a separate step and needs your viewing key.
      </p>

      <p className="mt-3 text-xs leading-relaxed text-faint">
        Anyone who guesses your topic can read the same alerts, so pick something unguessable if
        that matters to you. Turnstile stores the topic and nothing else.
      </p>
    </div>
  );
}
