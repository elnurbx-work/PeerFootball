import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Bell, Cloud, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallAppCard } from "@/components/pwa/install-app-card";
import { getServerTranslator } from "@/i18n/server";
import { siteConfig } from "@/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator();
  return {
    title: t("pwa.page.metadataTitle"),
    description: t("pwa.page.metadataDescription"),
    alternates: { canonical: "/install" },
    openGraph: {
      title: t("pwa.page.metadataTitle"),
      description: t("pwa.page.metadataDescription"),
      url: `${siteConfig.url}/install`
    }
  };
}

export default async function InstallPage() {
  const t = await getServerTranslator();
  const benefits = [
    { label: t("pwa.page.faster"), icon: Zap },
    { label: t("pwa.page.homeScreen"), icon: Bell },
    { label: t("pwa.page.offlineFallback"), icon: Cloud }
  ];
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-10">
      <div className="grid items-center gap-8 md:grid-cols-[1fr_0.9fr]">
        <section className="space-y-7">
          <Button asChild variant="ghost" className="w-fit px-0 hover:bg-transparent">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              FanPitch
            </Link>
          </Button>

          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t("pwa.page.eyebrow")}
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-foreground md:text-6xl">
              {t("pwa.page.title")}
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              {t("pwa.page.description")}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {benefits.map((item) => (
              <div key={item.label} className="rounded-md border bg-background p-4">
                <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <InstallAppCard />
      </div>
    </main>
  );
}
