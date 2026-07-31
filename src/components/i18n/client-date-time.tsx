"use client";

import { useSyncExternalStore } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";

type ClientDateTimeProps = {
  value: string;
  dateStyle?: "full" | "long" | "medium" | "short";
  className?: string;
};

const subscribe = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ClientDateTime({ value, dateStyle = "medium", className }: ClientDateTimeProps) {
  const { locale } = useI18n();
  const hydrated = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const date = new Date(value);
  const label = hydrated
    ? formatLocalized(date, locale, dateStyle)
    : formatStableFallback(date);

  return <time className={className} dateTime={value}>{label}</time>;
}

function formatLocalized(date: Date, locale: string, dateStyle: ClientDateTimeProps["dateStyle"]) {
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle: "short"
  }).format(date);
}

function formatStableFallback(date: Date) {
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16).replace("T", " ");
}
