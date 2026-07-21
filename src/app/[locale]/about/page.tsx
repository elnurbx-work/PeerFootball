import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutPage } from "@/components/marketing/about-page";
import { marketingCopy } from "@/content/marketing";
import { isLocale } from "@/i18n/config";
import { localizedAlternates } from "@/lib/seo";

type AboutRouteProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: AboutRouteProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = marketingCopy[locale];
  return {
    title: copy.aboutTitle,
    description: copy.aboutDescription,
    alternates: { canonical: `/${locale}/about`, languages: localizedAlternates("/about") },
    openGraph: { title: copy.aboutTitle, description: copy.aboutDescription, url: `/${locale}/about`, locale },
    twitter: { title: copy.aboutTitle, description: copy.aboutDescription }
  };
}

export default async function AboutRoute({ params }: AboutRouteProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <AboutPage locale={locale} />;
}
