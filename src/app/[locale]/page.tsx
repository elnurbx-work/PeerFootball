import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { marketingCopy } from "@/content/marketing";
import { isLocale } from "@/i18n/config";
import { localizedAlternates } from "@/lib/seo";

type LocalePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = marketingCopy[locale];
  return {
    title: { absolute: copy.homeTitle },
    description: copy.homeDescription,
    alternates: { canonical: `/${locale}`, languages: localizedAlternates() },
    openGraph: { title: copy.homeTitle, description: copy.homeDescription, url: `/${locale}`, locale },
    twitter: { title: copy.homeTitle, description: copy.homeDescription }
  };
}

export default async function LocaleHomePage({ params }: LocalePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <MarketingHome locale={locale} />;
}
