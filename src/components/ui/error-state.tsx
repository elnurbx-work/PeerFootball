"use client";

import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";

type ErrorStateProps = {
  reset: () => void;
};

export function ErrorState({ reset }: ErrorStateProps) {
  const { t } = useI18n();
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,hsl(var(--destructive)/0.10),transparent_38%),radial-gradient(circle_at_bottom_left,hsl(var(--primary)/0.12),transparent_34%)]"
        aria-hidden="true"
      />

      <section className="w-full max-w-xl rounded-2xl border bg-card/95 p-7 text-center shadow-xl shadow-foreground/5 sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-destructive">
          {t("errorState.eyebrow")}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("errorState.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-muted-foreground">
          {t("errorState.description")}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={reset}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t("errorState.retry")}
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">
              <Home className="h-4 w-4" aria-hidden="true" />
              {t("errorState.home")}
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
