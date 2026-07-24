"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { adsenseConfig } from "@/config/adsense";
import { runAdSenseDiagnostic } from "@/lib/ads/diagnostic";
import { initializeAdSenseElement } from "@/lib/ads/initialize";
import {
  ADSENSE_SCRIPT_ERROR_EVENT,
  ADSENSE_SCRIPT_READY_EVENT
} from "@/lib/ads/script-events";
import { usePathname } from "next/navigation";
import { useAdConsent } from "@/lib/ads/use-ad-consent";

const SCRIPT_RETRY_DELAY_MS = 750;

export function InFeedAdCard() {
  const { t } = useI18n();
  const pathname = usePathname();
  const consent = useAdConsent();
  const adElementRef = useRef<HTMLModElement>(null);
  const initializedRef = useRef(false);
  const hasLoggedErrorRef = useRef(false);

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const initialize = () => {
      const adElement = adElementRef.current;
      if (initializedRef.current || !adElement || !window.adsbygoogle) {
        return;
      }

      try {
        initializeAdSenseElement(adElement, window.adsbygoogle);
        initializedRef.current = true;
      } catch (error) {
        if (process.env.NODE_ENV !== "production" && !hasLoggedErrorRef.current) {
          hasLoggedErrorRef.current = true;
          console.warn("[AdSense] Could not initialize the in-feed ad.", error);
        }
      }
    };

    const handleScriptError = () => {
      if (process.env.NODE_ENV !== "production" && !hasLoggedErrorRef.current) {
        hasLoggedErrorRef.current = true;
        console.warn("[AdSense] In-feed initialization skipped because the script failed to load.");
      }
    };

    initialize();
    window.addEventListener(ADSENSE_SCRIPT_READY_EVENT, initialize);
    window.addEventListener(ADSENSE_SCRIPT_ERROR_EVENT, handleScriptError);
    retryTimer = setTimeout(() => {
      initialize();
      runAdSenseDiagnostic(pathname);
    }, SCRIPT_RETRY_DELAY_MS);

    return () => {
      window.removeEventListener(ADSENSE_SCRIPT_READY_EVENT, initialize);
      window.removeEventListener(ADSENSE_SCRIPT_ERROR_EVENT, handleScriptError);
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [pathname]);

  if (
    consent !== "accepted" ||
    !adsenseConfig.enabled ||
    !adsenseConfig.clientId ||
    !adsenseConfig.feedSlot
  ) {
    return null;
  }

  return (
    <Card aria-label={t("ads.ariaLabel")}>
      <CardContent className="space-y-3 p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("ads.sponsored")}
        </p>
        <div className="min-h-32">
          <ins
            ref={adElementRef}
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-format="fluid"
            data-ad-layout-key={adsenseConfig.feedLayoutKey}
            data-ad-client={adsenseConfig.clientId}
            data-ad-slot={adsenseConfig.feedSlot}
          />
        </div>
      </CardContent>
    </Card>
  );
}
