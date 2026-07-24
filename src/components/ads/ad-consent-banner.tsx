"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { adsenseConfig } from "@/config/adsense";
import { isAdSenseRoute } from "@/lib/ads/route-policy";
import { setAdConsent, useAdConsent } from "@/lib/ads/use-ad-consent";

export function AdConsentBanner() {
  const { t } = useI18n();
  const pathname = usePathname();
  const consent = useAdConsent();

  if (!adsenseConfig.enabled || !isAdSenseRoute(pathname) || consent !== null) {
    return null;
  }

  return (
    <section
      aria-label={t("ads.consentTitle")}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-lg border bg-card p-4 shadow-xl sm:p-5"
      role="dialog"
    >
      <h2 className="font-semibold">{t("ads.consentTitle")}</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {t("ads.consentDescription")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => setAdConsent("accepted")}>
          {t("ads.consentAccept")}
        </Button>
        <Button type="button" variant="outline" onClick={() => setAdConsent("rejected")}>
          {t("ads.consentReject")}
        </Button>
      </div>
    </section>
  );
}
