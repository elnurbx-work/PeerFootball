import { adsenseConfig } from "@/config/adsense";
import { isAdSenseRoute } from "@/lib/ads/route-policy";
import { ADSENSE_SCRIPT_ID } from "@/lib/ads/script-events";

let hasRunDiagnostic = false;

export function runAdSenseDiagnostic(pathname: string) {
  if (process.env.NODE_ENV === "production" || hasRunDiagnostic) {
    return;
  }

  hasRunDiagnostic = true;
  const script = document.getElementById(ADSENSE_SCRIPT_ID) as HTMLScriptElement | null;
  const adElement = document.querySelector<HTMLModElement>("ins.adsbygoogle");

  console.groupCollapsed("[AdSense diagnostic]");
  console.info("enabled", adsenseConfig.enabled);
  console.info("configuration", adsenseConfig.diagnostics);
  console.info("current route allowed", isAdSenseRoute(pathname));
  console.info("script tag exists", Boolean(script));
  console.info("script load status", script?.dataset.adsenseLoadStatus ?? "not loaded");
  console.info("window.adsbygoogle exists", Boolean(window.adsbygoogle));
  console.info("in-feed <ins> exists", Boolean(adElement));
  console.info("data-ad-client matches", adElement?.dataset.adClient === adsenseConfig.clientId);
  console.info("data-ad-slot matches", adElement?.dataset.adSlot === adsenseConfig.feedSlot);
  console.info(
    "data-ad-layout-key matches",
    adElement?.dataset.adLayoutKey === adsenseConfig.feedLayoutKey
  );
  console.info("data-adsbygoogle-status", adElement?.dataset.adsbygoogleStatus ?? "not set");
  console.info("CSP/network errors", "Check adjacent browser console messages if loading failed");
  console.groupEnd();
}
