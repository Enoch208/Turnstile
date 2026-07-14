import { Countdown } from "@/components/countdown/Countdown";
import { Accented, Eyebrow, Section, SectionHeading } from "@/components/ui/Section";
import { IRONWOOD_ACTIVATION_HEIGHT } from "@/lib/constants";
import { formatHeight } from "@/lib/format";

interface CountdownSectionProps {
  secondsRemaining: number;
  blocksRemaining: number;
}

export function CountdownSection({ secondsRemaining, blocksRemaining }: CountdownSectionProps) {
  return (
    <Section id="countdown">
      <Eyebrow index="01" label="Activation" />

      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionHeading
          title={
            <>
              The Orchard pool <Accented>stops taking deposits</Accented>
            </>
          }
          body="Nothing new enters Orchard after the activation height. Value already inside is not frozen and cannot be lost — it leaves only by being spent out, through the turnstile."
        />

        <div className="cursor-default text-left md:text-right">
          <div className="font-mono text-[10px] uppercase tracking-widest text-faint">
            Sealing block
          </div>
          <div className="font-mono text-3xl font-bold tracking-tighter text-foreground md:text-4xl">
            {formatHeight(IRONWOOD_ACTIVATION_HEIGHT)}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-accent">
            {formatHeight(blocksRemaining)} blocks out
          </div>
        </div>
      </div>

      <Countdown secondsRemaining={secondsRemaining} />

      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-faint">
        The block height is the truth; the clock is an estimate derived from the 75-second block
        target and corrected against recent block drift.
      </p>
    </Section>
  );
}
