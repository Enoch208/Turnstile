import type { IconSvgElement } from "@hugeicons/react";

import {
  Book02Icon,
  Clock01Icon,
  Icon,
  Notification01Icon,
  SecurityCheckIcon,
} from "@/components/icons/Icon";
import { Accented, Eyebrow, Section, SectionHeading } from "@/components/ui/Section";

interface Feature {
  icon: IconSvgElement;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: Clock01Icon,
    title: "Activation countdown",
    body: "Live mainnet height, blocks remaining, and an ETA corrected against real block drift.",
  },
  {
    icon: SecurityCheckIcon,
    title: "Wallet readiness check",
    body: "Paste a unified full viewing key. Get a pool-by-pool verdict. Keys never leave memory.",
  },
  {
    icon: Book02Icon,
    title: "Migration guides",
    body: "Step-by-step for Zashi, YWallet, Zingo, Zallet, and funds sitting on an exchange.",
  },
  {
    icon: Notification01Icon,
    title: "Anonymous alerts",
    body: "Subscribe with a shielded mainnet memo. No email, no account. The memo is the signup form.",
  },
];

export function BentoGrid() {
  return (
    <Section id="features">
      <Eyebrow index="02" label="The tool" />

      <SectionHeading
        className="mb-10"
        title={
          <>
            Everything you need before <Accented>the pool seals</Accented>
          </>
        }
        body="Explorers show chain data. Wallets show balances. Turnstile connects your funds to the deadline, with a plan."
      />

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[2rem] border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <article
            key={feature.title}
            className="group flex min-h-[280px] cursor-default flex-col justify-between bg-surface p-8 transition-colors duration-200 hover:bg-elevated"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-gradient-to-b from-white/10 to-transparent text-faint transition-colors duration-200 group-hover:text-accent">
              <Icon icon={feature.icon} size={20} />
            </span>

            <div>
              <h3 className="mb-2 text-lg font-medium tracking-tight text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{feature.body}</p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
