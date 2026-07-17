"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";

type RelativeTimeProps = {
  locale: Locale;
  value: string;
};

const shortMonths: Record<Locale, readonly string[]> = {
  az: ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avq", "sen", "okt", "noy", "dek"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  ru: ["янв.", "февр.", "мар.", "апр.", "мая", "июн.", "июл.", "авг.", "сент.", "окт.", "нояб.", "дек."]
};

function subscribeToClock(onStoreChange: () => void) {
  const intervalId = window.setInterval(onStoreChange, 60_000);
  return () => window.clearInterval(intervalId);
}

export function RelativeTime({ locale, value }: RelativeTimeProps) {
  const label = useSyncExternalStore(
    subscribeToClock,
    () => formatRelativeTime(value, locale),
    () => formatStableDate(value, locale)
  );

  return <time dateTime={value}>{label}</time>;
}

function formatRelativeTime(value: string, locale: Locale) {
  const date = new Date(value);
  const timestamp = date.getTime();

  if (!Number.isFinite(timestamp)) {
    return value;
  }

  const diffSeconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffSeconds < 60) {
    return formatter.format(0, "second");
  }

  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffMinutes < 60) {
    return formatter.format(-diffMinutes, "minute");
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return formatter.format(-diffHours, "hour");
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return formatter.format(-diffDays, "day");
  }

  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
}

function formatStableDate(value: string, locale: Locale) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  const day = date.getUTCDate();
  const month = shortMonths[locale][date.getUTCMonth()];
  return locale === "en" ? `${month} ${day}` : `${day} ${month}`;
}
