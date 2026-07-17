"use client";

import { useEffect } from "react";
import { localeCookieName, type Locale } from "@/i18n/config";

export function LocaleCookieSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.cookie = `${localeCookieName}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
