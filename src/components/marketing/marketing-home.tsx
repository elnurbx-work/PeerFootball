import type { Locale } from "@/i18n/config";
import { landingCopy } from "@/components/landing/landing-data";
import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PublicValueSections } from "@/components/public/public-value-sections";
import type { PublicPlatformStats } from "@/types/public.types";

export function MarketingHome({ locale, stats }: { locale: Locale; stats: PublicPlatformStats }) {
  const copy = landingCopy[locale];

  return (
    <div className="landing-page min-h-screen overflow-x-clip bg-background">
      <LandingHeader copy={copy} locale={locale} />
      <main>
        <HeroSection copy={copy} />
        <PublicValueSections stats={stats} />
        <FeaturesSection copy={copy} />
        <HowItWorksSection copy={copy} />
        <FinalCtaSection copy={copy} />
      </main>
      <LandingFooter copy={copy} locale={locale} />
    </div>
  );
}
