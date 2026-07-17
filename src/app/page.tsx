import Link from "next/link";
import { CalendarPlus, Download, Radio, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getServerTranslator } from "@/i18n/server";

export default async function HomePage() {
  const t = await getServerTranslator();
  const highlights = [t("home.highlightProfile"), t("home.highlightPosts"), t("home.highlightClubs")];
  return (
    <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-8">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t("home.eyebrow")}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-foreground md:text-6xl">
            {t("home.title")}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            {t("home.description")}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/auth/login">
              <UserPlus className="h-4 w-4" />
              {t("home.join")}
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/feed">
              <Radio className="h-4 w-4" />
              {t("home.viewHome")}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/matches">
              <CalendarPlus className="h-4 w-4" />
              {t("home.createMatch")}
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/install">
              <Download className="h-4 w-4" />
              {t("home.install")}
            </Link>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-2 border-primary/15 bg-card/90">
        <CardContent className="space-y-6 p-6">
          <div className="rounded-md bg-primary p-5 text-primary-foreground">
            <p className="text-sm font-medium">{t("home.demoTime")}</p>
            <h2 className="mt-2 text-2xl font-bold">{t("home.demoTitle")}</h2>
            <p className="mt-2 text-sm opacity-90">{t("home.demoNeed")}</p>
          </div>
          <div className="grid gap-3">
            {highlights.map((item) => (
              <div key={item} className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
