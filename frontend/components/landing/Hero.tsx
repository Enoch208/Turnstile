import { ArrowRight02Icon, ArrowUpRight01Icon, Icon } from "@/components/icons/Icon";
import { HeroVisual } from "@/components/landing/HeroVisual";
import { TelemetryBar } from "@/components/landing/TelemetryBar";
import { ButtonGlyph, ButtonLink } from "@/components/ui/Button";
import { LiveDot, Pill } from "@/components/ui/Pill";
import { IRONWOOD_ACTIVATION_HEIGHT } from "@/lib/constants";
import { formatHeight } from "@/lib/format";

interface HeroProps {
  height: number;
  blocksRemaining: number;
  daysRemaining: number;
}

export function Hero({ height, blocksRemaining, daysRemaining }: HeroProps) {
  return (
    <section className="relative z-10 grid flex-grow grid-cols-1 items-center gap-12 pb-8 lg:grid-cols-12 lg:gap-20 lg:pb-0">
      <div className="flex flex-col justify-center lg:col-span-7">
        <Pill className="mb-8">
          <LiveDot />
          <span className="font-mono text-xs text-muted">
            Ironwood activation in {daysRemaining} days
          </span>
        </Pill>

        <h1 className="mb-8 text-5xl font-medium leading-[0.95] tracking-tighter text-foreground lg:text-[5rem]">
          Turnstile
          <br />
          <span className="bg-gradient-to-r from-faint via-foreground to-faint bg-clip-text font-light text-transparent">
            Terminal
          </span>
        </h1>

        <p className="mb-10 max-w-md text-sm font-medium leading-relaxed tracking-wide text-muted">
          Audit your ZEC exposure before block {formatHeight(IRONWOOD_ACTIVATION_HEIGHT)}. Paste a
          viewing key to scan your wallet&apos;s pool balances — securely, instantly, and never
          with a spending key.
        </p>

        <div className="mb-16 flex flex-col gap-3 sm:flex-row lg:mb-20">
          <ButtonLink href="/check">
            Check my wallet
            <ButtonGlyph>
              <Icon
                icon={ArrowUpRight01Icon}
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </ButtonGlyph>
          </ButtonLink>

          <ButtonLink href="/guides" variant="secondary">
            Run local CLI
            <Icon
              icon={ArrowRight02Icon}
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </ButtonLink>
        </div>

        <TelemetryBar height={height} blocksRemaining={blocksRemaining} status="NOMINAL" />
      </div>

      <div className="lg:col-span-5">
        <HeroVisual />
      </div>
    </section>
  );
}
