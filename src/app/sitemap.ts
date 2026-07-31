import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { guides } from "@/content/guides";
import { getPublicSitemapEntries } from "@/server/queries/public.queries";

const staticRoutes = [
  "/", "/about", "/how-it-works", "/players", "/teams", "/matches", "/pitches",
  "/guides", "/contact", "/help", "/community-guidelines", "/safety", "/privacy",
  "/terms", "/cookie-policy"
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getPublicSitemapEntries();
  const now = new Date();
  return [
    ...staticRoutes.map((path) => ({
      url: `${siteConfig.url}${path}`,
      lastModified: now,
      changeFrequency: path === "/" ? "daily" as const : "weekly" as const,
      priority: path === "/" ? 1 : 0.8
    })),
    ...guides.map((guide) => ({
      url: `${siteConfig.url}/guides/${guide.slug}`,
      lastModified: new Date(guide.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8
    })),
    ...entries.players.map((player) => ({
      url: `${siteConfig.url}/players/${player.username}`,
      lastModified: player.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6
    })),
    ...entries.teams.map((team) => ({
      url: `${siteConfig.url}/teams/${team.slug}`,
      lastModified: new Date(team.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7
    })),
    ...entries.matches.map((match) => ({
      url: `${siteConfig.url}/matches/${match.id}`,
      lastModified: new Date(match.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6
    }))
  ];
}
