"use client";

import { useMemo, useSyncExternalStore } from "react";

export type ConsentPreferences = {
  version: 1;
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  advertising: boolean;
};

const STORAGE_KEY = "peerfootball:cookie-consent:v1";
const COOKIE_NAME = "peerfootball_cookie_consent";
const CHANGE_EVENT = "peerfootball:cookie-consent-change";
const MAX_AGE = 60 * 60 * 24 * 180;

function readConsentSnapshot(): string | null {
  try {
    const rawCookie = document.cookie.split("; ").find((item) => item.startsWith(`${COOKIE_NAME}=`))?.split("=")[1];
    const raw = rawCookie ? decodeURIComponent(rawCookie) : window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return readLegacyConsentSnapshot();
    return raw;
  } catch {
    return readLegacyConsentSnapshot();
  }
}

function parseConsent(raw: string | null): ConsentPreferences | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ConsentPreferences>;
    if (value.version !== 1) return null;
    return {
      version: 1,
      necessary: true,
      preferences: Boolean(value.preferences),
      analytics: Boolean(value.analytics),
      advertising: Boolean(value.advertising)
    };
  } catch {
    return null;
  }
}

function readLegacyConsentSnapshot(): string | null {
  try {
    const legacy = window.localStorage.getItem("peerfootball:ad-consent");
    if (legacy !== "accepted" && legacy !== "rejected") return null;
    const accepted = legacy === "accepted";
    return JSON.stringify({ version: 1, necessary: true, preferences: accepted, analytics: accepted, advertising: accepted });
  } catch {
    return null;
  }
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

export function useCookieConsent() {
  const snapshot = useSyncExternalStore(subscribe, readConsentSnapshot, () => undefined);
  return useMemo(() => snapshot === undefined ? undefined : parseConsent(snapshot), [snapshot]);
}

export function useAdConsent(): "accepted" | "rejected" | null | undefined {
  const consent = useCookieConsent();
  if (consent === undefined || consent === null) return consent;
  return consent.advertising ? "accepted" : "rejected";
}

export function setCookieConsent(value: Omit<ConsentPreferences, "version" | "necessary">) {
  const consent: ConsentPreferences = { version: 1, necessary: true, ...value };
  const serialized = JSON.stringify(consent);
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(serialized)}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${secure}`;
  } catch {}
  try { window.localStorage.setItem(STORAGE_KEY, serialized); } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function setAdConsent(consent: "accepted" | "rejected") {
  const enabled = consent === "accepted";
  setCookieConsent({ preferences: enabled, analytics: enabled, advertising: enabled });
}
