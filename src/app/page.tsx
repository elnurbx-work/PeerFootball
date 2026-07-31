import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { getCurrentUser } from "@/lib/auth";
import { getRequestLocale } from "@/i18n/server";
import { localizedAlternates } from "@/lib/seo";
import { getPublicPlatformStats } from "@/server/queries/public.queries";
import { siteConfig } from "@/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const title = "PeerFootball — Yerli futbolçuları, komandaları və oyunları kəşf et";
  const description = "Futbol profilini yarat, açıq komandaları və təsdiqlənmiş oyunları kəşf et, təhlükəsiz şəkildə yerli futbol icmasına qoşul.";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/", languages: localizedAlternates() },
    openGraph: { title, description, url: "/", locale },
    twitter: { title, description }
  };
}

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  if (currentUser) redirect("/feed");
  const [locale, stats] = await Promise.all([getRequestLocale(), getPublicPlatformStats()]);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
      { "@type": "WebSite", name: siteConfig.name, url: siteConfig.url, inLanguage: ["az", "en", "ru"] }
    ]
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <MarketingHome locale={locale} stats={stats} />
    </>
  );
}
