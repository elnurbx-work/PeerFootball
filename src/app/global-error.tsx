"use client";

import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { ErrorState } from "@/components/ui/error-state";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { defaultLocale, localeCookieName, toLocale, type Locale } from "@/i18n/config";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  useEffect(() => {
    Sentry.captureException(error);
    const cookie = document.cookie.split("; ").find((item) => item.startsWith(`${localeCookieName}=`));
    setLocale(toLocale(cookie?.split("=")[1]));
  }, [error]);

  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale}><ErrorState reset={reset} /></I18nProvider>
      </body>
    </html>
  );
}
