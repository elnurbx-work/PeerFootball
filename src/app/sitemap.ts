import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { locales } from "@/i18n/config";
import { absoluteLocalizedAlternates } from "@/lib/seo";
import { seoTopicSlugs } from "@/content/seo-topics";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...locales.flatMap((locale) => [
      {
        url: `${siteConfig.url}/${locale}`,
        alternates: { languages: absoluteLocalizedAlternates() },
        changeFrequency: "weekly" as const,
        priority: 1
      },
      {
        url: `${siteConfig.url}/${locale}/about`,
        alternates: { languages: absoluteLocalizedAlternates("/about") },
        changeFrequency: "monthly" as const,
        priority: 0.9
      },
      ...seoTopicSlugs.map((topic) => ({
        url: `${siteConfig.url}/${locale}/${topic}`,
        alternates: { languages: absoluteLocalizedAlternates(`/${topic}`) },
        changeFrequency: "monthly" as const,
        priority: 0.8
      }))
    ]),
    {
      url: `${siteConfig.url}/install`,
      changeFrequency: "monthly",
      priority: 0.5
    },
    {
      url: `${siteConfig.url}/feed`,
      changeFrequency: "daily",
      priority: 0.9
    }
  ];
}
