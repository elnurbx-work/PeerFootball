"use client";

import { useSyncExternalStore } from "react";

export type AdConsent = "accepted" | "rejected" | null;
type AdConsentSnapshot = AdConsent | undefined;

const AD_CONSENT_STORAGE_KEY = "fanpitch:ad-consent";
const AD_CONSENT_COOKIE_NAME = "fanpitch_ad_consent";
const AD_CONSENT_CHANGE_EVENT = "fanpitch:ad-consent-change";
const AD_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

function readAdConsent(): AdConsent {
  try {
    const cookieValue = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${AD_CONSENT_COOKIE_NAME}=`))
      ?.split("=")[1];

    if (cookieValue === "accepted" || cookieValue === "rejected") {
      return cookieValue;
    }
  } catch {
    // Fall back to the legacy localStorage preference below.
  }

  try {
    const legacyValue = window.localStorage.getItem(AD_CONSENT_STORAGE_KEY);
    return legacyValue === "accepted" || legacyValue === "rejected" ? legacyValue : null;
  } catch {
    return null;
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(AD_CONSENT_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(AD_CONSENT_CHANGE_EVENT, onStoreChange);
  };
}

export function useAdConsent(): AdConsentSnapshot {
  return useSyncExternalStore(subscribe, readAdConsent, () => undefined);
}

export function setAdConsent(consent: Exclude<AdConsent, null>) {
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
      `${AD_CONSENT_COOKIE_NAME}=${consent}; Path=/; Max-Age=${AD_CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  } catch {
    // localStorage remains available as a fallback when cookies are blocked.
  }

  try {
    window.localStorage.setItem(AD_CONSENT_STORAGE_KEY, consent);
  } catch {
    // The first-party cookie remains the primary persistence mechanism.
  }
  window.dispatchEvent(new Event(AD_CONSENT_CHANGE_EVENT));
}
