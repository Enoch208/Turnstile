import { AlertBand } from "@/components/landing/AlertBand";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { CountdownSection } from "@/components/landing/CountdownSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { GuidesStrip } from "@/components/landing/GuidesStrip";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PrivacySplit } from "@/components/landing/PrivacySplit";
import { AppFrame } from "@/components/layout/AppFrame";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { chainStatus } from "@/lib/chain";

const SEED_HEIGHT = 3_410_211;

export default function Home() {
  const status = chainStatus(SEED_HEIGHT);
  const daysRemaining = Math.ceil(status.secondsRemaining / 86_400);

  return (
    <AppFrame>
      <Header />
      <Hero
        height={status.height}
        blocksRemaining={status.blocksRemaining}
        daysRemaining={daysRemaining}
      />
      <CountdownSection
        secondsRemaining={status.secondsRemaining}
        blocksRemaining={status.blocksRemaining}
      />
      <BentoGrid />
      <HowItWorks />
      <PrivacySplit />
      <GuidesStrip />
      <AlertBand />
      <FinalCta />
      <Footer />
    </AppFrame>
  );
}
