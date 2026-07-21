import Link from "next/link";
import { locales, type Locale } from "@/i18n/config";

const labels: Record<Locale, string> = { az: "AZ", en: "EN", ru: "RU" };

export function LanguageLinks({ currentLocale, path = "" }: { currentLocale: Locale; path?: string }) {
  return (
    <nav aria-label="Language" className="flex items-center gap-2 text-sm">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${path}`}
          hrefLang={locale}
          lang={locale}
          aria-current={locale === currentLocale ? "page" : undefined}
          className={locale === currentLocale ? "font-bold text-foreground" : "text-muted-foreground hover:text-foreground"}
        >
          {labels[locale]}
        </Link>
      ))}
    </nav>
  );
}
