"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { adsenseConfig } from "@/config/adsense";
import { isAdSenseRoute } from "@/lib/ads/route-policy";
import {
  ADSENSE_SCRIPT_ERROR_EVENT,
  ADSENSE_SCRIPT_ID,
  ADSENSE_SCRIPT_READY_EVENT
} from "@/lib/ads/script-events";
import { useAdConsent } from "@/lib/ads/use-ad-consent";

let hasWarnedAboutConfiguration = false;

function markScriptStatus(status: "error" | "loaded") {
  const script = document.getElementById(ADSENSE_SCRIPT_ID);
  if (script) {
    script.dataset.adsenseLoadStatus = status;
  }
}

export function AdSenseScript() {
  const pathname = usePathname();
  const consent = useAdConsent();

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" &&
      !hasWarnedAboutConfiguration &&
      adsenseConfig.diagnostics.length > 0
    ) {
      hasWarnedAboutConfiguration = true;
      for (const diagnostic of adsenseConfig.diagnostics) {
        console.warn(`[AdSense] ${diagnostic}`);
      }
    }
  }, []);

  if (
    consent !== "accepted" ||
    !adsenseConfig.enabled ||
    !adsenseConfig.clientId ||
    !isAdSenseRoute(pathname)
  ) {
    return null;
  }

  return (
    <Script
      id={ADSENSE_SCRIPT_ID}
      async
      crossOrigin="anonymous"
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseConfig.clientId}`}
      onLoad={() => {
        markScriptStatus("loaded");
        window.dispatchEvent(new Event(ADSENSE_SCRIPT_READY_EVENT));
      }}
      onError={() => {
        markScriptStatus("error");
        window.dispatchEvent(new Event(ADSENSE_SCRIPT_ERROR_EVENT));
        if (process.env.NODE_ENV !== "production") {
          console.warn("[AdSense] The Google AdSense script failed to load.");
        }
      }}
    />
  );
}
