import type { Metadata } from "next";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { getRequestLocale } from "@/i18n/server";
import { localizedAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
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

export default async function HomePage() {
  return <MarketingHome locale={await getRequestLocale()} />;
}
