import type { Locale } from "@/i18n/config";
import { landingCopy } from "@/components/landing/landing-data";
import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsSection } from "@/components/landing/stats-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { PitchMapPreview } from "@/components/landing/pitch-map-preview";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { MatchPreviewSection } from "@/components/landing/match-preview-section";
import { PlayerPreviewSection } from "@/components/landing/player-preview-section";
import { CommunityPreviewSection } from "@/components/landing/community-preview-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export function MarketingHome({ locale }: { locale: Locale }) {
  const copy = landingCopy[locale];

  return (
    <div className="landing-page min-h-screen overflow-x-clip bg-background">
      <LandingHeader copy={copy} locale={locale} />
      <main>
        <HeroSection copy={copy} />
        <StatsSection copy={copy} />
        <FeaturesSection copy={copy} />
        <PitchMapPreview copy={copy} />
        <HowItWorksSection copy={copy} />
        <MatchPreviewSection copy={copy} />
        <PlayerPreviewSection copy={copy} />
        <CommunityPreviewSection copy={copy} />
        <FinalCtaSection copy={copy} />
      </main>
      <LandingFooter copy={copy} locale={locale} />
    </div>
  );
}
