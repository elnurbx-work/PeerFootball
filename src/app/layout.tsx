import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { getRequestLocale } from "@/i18n/server";
import { getServerTranslator } from "@/i18n/server";
import { AdSenseScript } from "@/components/ads/adsense-script";
import { adsenseConfig } from "@/config/adsense";
import { siteConfig } from "@/config/site";
import { AdConsentBanner } from "@/components/ads/ad-consent-banner";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator();
  return {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: t("common.metadataDescription"),
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: t("common.metadataDescription"),
    url: siteConfig.url
  },
  twitter: {
    card: "summary",
    title: siteConfig.name,
    description: t("common.metadataDescription")
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FanPitch"
  },
  formatDetection: {
    telephone: false
  },
  ...(adsenseConfig.enabled && adsenseConfig.clientId
    ? { other: { "google-adsense-account": adsenseConfig.clientId } }
    : {}),
  icons: {
    icon: [
      { url: "/icons/icon-192", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon", sizes: "180x180", type: "image/png" }]
  }
  };
}

export const viewport: Viewport = {
  themeColor: "#166b43"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale}>
      <body className={cn("font-sans antialiased")}>
        <I18nProvider locale={locale}>
          <ServiceWorkerRegistration />
          {children}
          <AdConsentBanner />
        </I18nProvider>
        <AdSenseScript />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
