import type { MetadataRoute } from "next";
import { getServerTranslator } from "@/i18n/server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getServerTranslator();
  return {
    name: "FanPitch",
    short_name: "FanPitch",
    description: t("common.metadataDescription"),
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8f6f0",
    theme_color: "#166b43",
    categories: ["sports", "social", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      {
        name: t("nav.home"),
        short_name: t("nav.home"),
        description: t("common.feedShortcutDescription"),
        url: "/feed",
        icons: [{ src: "/icons/icon-192", sizes: "192x192", type: "image/png" }]
      },
      {
        name: t("nav.matches"),
        short_name: t("nav.matches"),
        description: t("common.matchesShortcutDescription"),
        url: "/matches",
        icons: [{ src: "/icons/icon-192", sizes: "192x192", type: "image/png" }]
      }
    ]
  };
}
