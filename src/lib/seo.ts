import { locales } from "@/i18n/config";
import { siteConfig } from "@/config/site";

export function localizedAlternates(path = ""): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, `/${locale}${path}`])),
    "x-default": `/az${path}`
  };
}

export function absoluteLocalizedAlternates(path = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(localizedAlternates(path)).map(([locale, url]) => [locale, `${siteConfig.url}${url}`])
  );
}
