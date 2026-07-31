import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

const privatePaths = [
  "/admin",
  "/api",
  "/auth",
  "/clubs",
  "/create",
  "/direct",
  "/feed",
  "/feedback",
  "/friends",
  "/notifications",
  "/offline",
  "/profile",
  "/search",
  "/settings",
  "/tactics"
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: privatePaths
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url
  };
}
