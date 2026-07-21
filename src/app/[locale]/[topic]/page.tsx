import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicPage } from "@/components/marketing/topic-page";
import { isLocale } from "@/i18n/config";
import { isSeoTopic, seoTopics, seoTopicSlugs } from "@/content/seo-topics";
import { localizedAlternates } from "@/lib/seo";

type TopicRouteProps = { params: Promise<{ locale: string; topic: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return seoTopicSlugs.map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: TopicRouteProps): Promise<Metadata> {
  const { locale, topic } = await params;
  if (!isLocale(locale) || !isSeoTopic(topic)) return {};
  const copy = seoTopics[locale][topic];
  const path = `/${topic}`;
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: `/${locale}${path}`, languages: localizedAlternates(path) },
    openGraph: { title: copy.title, description: copy.description, url: `/${locale}${path}`, locale },
    twitter: { title: copy.title, description: copy.description }
  };
}

export default async function TopicRoute({ params }: TopicRouteProps) {
  const { locale, topic } = await params;
  if (!isLocale(locale) || !isSeoTopic(topic)) notFound();
  return <TopicPage locale={locale} topic={topic} />;
}
