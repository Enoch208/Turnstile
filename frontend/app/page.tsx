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

export default function Home() {
  return (
    <AppFrame>
      <Header />
      <Hero />
      <CountdownSection />
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
