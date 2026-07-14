"use client";

import { Countdown } from "@/components/countdown/Countdown";
import { IRONWOOD_ACTIVATION_HEIGHT } from "@/lib/constants";
import { formatHeight } from "@/lib/format";
import { useChainStatus } from "@/lib/useChainStatus";

export function LiveCountdown() {
  const state = useChainStatus();

  return (
    <>
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="cursor-default">
          <div className="font-mono text-[10px] uppercase tracking-widest text-faint">
            Activation block
          </div>
          <div className="font-mono text-3xl font-bold tracking-tighter text-foreground md:text-4xl">
            {formatHeight(IRONWOOD_ACTIVATION_HEIGHT)}
          </div>
        </div>

        <div className="cursor-default md:text-right">
          <div className="font-mono text-[10px] uppercase tracking-widest text-faint">
            Blocks remaining
          </div>
          <div className="font-mono text-3xl font-bold tracking-tighter text-accent md:text-4xl">
            {state.status === "live"
              ? formatHeight(state.chain.blocksRemaining)
              : state.status === "loading"
                ? "…"
                : "—"}
          </div>
        </div>
      </div>

      {state.status === "live" ? (
        <Countdown secondsRemaining={state.chain.secondsRemaining} />
      ) : (
        <div className="rounded-2xl border border-border bg-surface px-8 py-12 text-center">
          <p className="font-mono text-sm text-faint">
            {state.status === "loading"
              ? "Reading the chain tip…"
              : "The chain tip is unreachable. Turnstile will not guess a height."}
          </p>
        </div>
      )}
    </>
  );
}
