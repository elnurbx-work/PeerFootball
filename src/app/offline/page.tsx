import Link from "next/link";
import { Home, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerTranslator } from "@/i18n/server";

export default async function OfflinePage() {
  const t = await getServerTranslator();
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <div className="space-y-7">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <WifiOff className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t("offline.eyebrow")}
          </p>
          <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl">
            {t("offline.title")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("offline.description")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="h-4 w-4" aria-hidden="true" />
              {t("offline.home")}
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <a href=".">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {t("offline.retry")}
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
