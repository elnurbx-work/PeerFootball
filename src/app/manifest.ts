import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FanPitch",
    short_name: "FanPitch",
    description: "A football social network for players and fans.",
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
        name: "Feed",
        short_name: "Feed",
        description: "Open your FanPitch feed.",
        url: "/feed",
        icons: [{ src: "/icons/icon-192", sizes: "192x192", type: "image/png" }]
      },
      {
        name: "Matches",
        short_name: "Matches",
        description: "Find and organize local football matches.",
        url: "/matches",
        icons: [{ src: "/icons/icon-192", sizes: "192x192", type: "image/png" }]
      }
    ]
  };
}
