"use client";

import { useSyncExternalStore } from "react";

export type AdConsent = "accepted" | "rejected" | null;

const AD_CONSENT_STORAGE_KEY = "fanpitch:ad-consent";
const AD_CONSENT_CHANGE_EVENT = "fanpitch:ad-consent-change";

function readAdConsent(): AdConsent {
  const value = window.localStorage.getItem(AD_CONSENT_STORAGE_KEY);
  return value === "accepted" || value === "rejected" ? value : null;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(AD_CONSENT_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(AD_CONSENT_CHANGE_EVENT, onStoreChange);
  };
}

export function useAdConsent() {
  return useSyncExternalStore(subscribe, readAdConsent, () => null);
}

export function setAdConsent(consent: Exclude<AdConsent, null>) {
  window.localStorage.setItem(AD_CONSENT_STORAGE_KEY, consent);
  window.dispatchEvent(new Event(AD_CONSENT_CHANGE_EVENT));
}
