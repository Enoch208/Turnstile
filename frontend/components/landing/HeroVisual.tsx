import Image from "next/image";

import { Icon, Notification01Icon } from "@/components/icons/Icon";
import { LiveDot } from "@/components/ui/Pill";

const POOL_SEGMENTS = [
  { key: "transparent", short: "T", width: "14%", tone: "bg-white/25" },
  { key: "sapling", short: "S", width: "24%", tone: "bg-white/45" },
  {
    key: "orchard",
    short: "O",
    width: "62%",
    tone: "bg-accent shadow-[0_0_14px_rgba(52,211,153,0.7)]",
  },
];

const GLASS =
  "border border-white/10 bg-gradient-to-b from-white/[0.12] to-white/[0.02] backdrop-blur-md";

export function HeroVisual() {
  return (
    <div className="group relative h-full min-h-[460px] w-full lg:min-h-[560px]">
      <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.9)]">
        <Image
          src="/hero.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 40vw"
          className="scale-105 object-cover grayscale contrast-[1.15] brightness-[0.85] transition-transform duration-[2s] ease-in-out group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-tr from-accent/40 via-accent/10 to-transparent mix-blend-color" />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/45 to-canvas/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(52,211,153,0.18),transparent_70%)]" />

        <div className="absolute inset-0 flex flex-col justify-between p-8">
          <div className="flex items-start justify-between">
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${GLASS}`}>
              <LiveDot />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white">
                Live mainnet
              </span>
            </div>

            <button
              type="button"
              aria-label="Get activation alerts"
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white transition-colors duration-200 hover:bg-white/20 ${GLASS}`}
            >
              <Icon icon={Notification01Icon} size={18} />
            </button>
          </div>

          <div className={`w-full max-w-[260px] self-end rounded-2xl p-4 ${GLASS}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Pool exposure
              </span>
              <span className="font-mono text-[10px] text-accent">ORCHARD</span>
            </div>

            <div className="mb-3 flex h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              {POOL_SEGMENTS.map((segment) => (
                <div
                  key={segment.key}
                  style={{ width: segment.width }}
                  className={segment.tone}
                />
              ))}
            </div>

            <div className="mb-3 flex items-center gap-3">
              {POOL_SEGMENTS.map((segment) => (
                <span
                  key={segment.key}
                  className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-white/50"
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${segment.key === "orchard" ? "bg-accent" : "bg-white/40"}`}
                  />
                  {segment.short}
                </span>
              ))}
            </div>

            <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">
              Sealed at 3,428,143
            </span>
          </div>

          <div
            className={`mt-6 flex items-center justify-between rounded-xl px-4 py-3 ${GLASS}`}
          >
            <span className="font-mono text-[11px] text-white/70">[!] AWAITING UFVK…</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
              Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
