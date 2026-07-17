import Link from "next/link";
import { ArrowRight, Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerTranslator } from "@/i18n/server";

export default async function NotFound() {
  const t = await getServerTranslator();
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div
        className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_38%),radial-gradient(circle_at_bottom_right,hsl(var(--accent)/0.10),transparent_34%)]"
        aria-hidden="true"
      />

      <section className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="order-2 max-w-xl space-y-7 lg:order-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
            <SearchX className="h-4 w-4" aria-hidden="true" />
            {t("notFound.badge")}
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              {t("notFound.title")}
            </h1>
            <p className="max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              {t("notFound.description")}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/">
                <Home className="h-4 w-4" aria-hidden="true" />
                {t("notFound.home")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/feed">
                {t("notFound.feed")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="order-1 flex justify-center lg:order-2 lg:justify-end" aria-hidden="true">
          <div className="relative aspect-[4/3] w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 bg-primary p-5 shadow-2xl shadow-primary/20 sm:p-7">
            <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(135deg,transparent_25%,white_25%,white_50%,transparent_50%,transparent_75%,white_75%)] [background-size:48px_48px]" />
            <div className="relative h-full rounded-lg border-2 border-white/65">
              <div className="absolute left-1/2 top-0 h-full -translate-x-1/2 border-l-2 border-white/65" />
              <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/65 sm:h-32 sm:w-32" />
              <div className="absolute left-0 top-1/2 h-2/3 w-16 -translate-y-1/2 border-y-2 border-r-2 border-white/65 sm:w-24" />
              <div className="absolute right-0 top-1/2 h-2/3 w-16 -translate-y-1/2 border-y-2 border-l-2 border-white/65 sm:w-24" />

              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-xl bg-background/95 px-5 py-2 text-6xl font-black tracking-tighter text-primary shadow-lg sm:px-7 sm:py-3 sm:text-8xl">
                  404
                </span>
              </div>

              <div className="absolute bottom-[13%] right-[16%] flex h-10 w-10 items-center justify-center rounded-full border-4 border-foreground bg-background shadow-lg sm:h-12 sm:w-12">
                <span className="h-3 w-3 rounded-full bg-foreground sm:h-4 sm:w-4" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
