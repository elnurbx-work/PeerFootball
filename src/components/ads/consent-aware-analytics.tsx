"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useCookieConsent } from "@/lib/ads/use-ad-consent";

export function ConsentAwareAnalytics() {
  const consent = useCookieConsent();
  return consent?.analytics ? <><Analytics /><SpeedInsights /></> : null;
}
