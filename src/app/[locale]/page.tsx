import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { getPublicPlatformStats } from "@/server/queries/public.queries";
import { isLocale } from "@/i18n/config";
import { localizedAlternates } from "@/lib/seo";

type LocalePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const title = "PeerFootball — Find Players, Teams and Matches Near You";
  const description = "Create your football profile, discover nearby players, build teams, organize matches and find local football pitches with PeerFootball.";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/${locale}`, languages: localizedAlternates() },
    openGraph: { title, description, url: `/${locale}`, locale },
    twitter: { title, description }
  };
}

export default async function LocaleHomePage({ params }: LocalePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <MarketingHome locale={locale} stats={await getPublicPlatformStats()} />;
}
