import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Search, Shield } from "lucide-react";
import { ClubCard } from "@/components/clubs/club-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";
import { getMyClubs, getMyPendingClubs, searchClubs } from "@/server/queries/club.queries";
import { createTranslator } from "@/i18n/dictionary";

type ClubsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

function getSearchQuery(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export default async function ClubsPage({ searchParams }: ClubsPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }
  const t = createTranslator(currentUser.locale);

  const params = await searchParams;
  const query = getSearchQuery(params.q);
  const [activeClubs, pendingClubs, clubs] = await Promise.all([
    getMyClubs(currentUser.id),
    getMyPendingClubs(currentUser.id),
    searchClubs(query, currentUser.id)
  ]);
  const myClubs = [...activeClubs, ...pendingClubs];

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("clubs.pages.index.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("clubs.pages.index.description")}</p>
        </div>
        <Button asChild>
          <Link href="/clubs/new">
            <Plus className="h-4 w-4" />
            {t("clubs.pages.index.create")}
          </Link>
        </Button>
      </div>

      <form action="/clubs" className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" defaultValue={query} name="q" placeholder={t("clubs.pages.index.searchPlaceholder")} type="search" />
        </div>
        <Button type="submit">
          <Search className="h-4 w-4" />
          {t("clubs.pages.index.search")}
        </Button>
      </form>

      <div className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold">{t("clubs.pages.index.myClubs")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("clubs.pages.index.myClubsDescription")}</p>
        </div>
        {myClubs.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {myClubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Shield}
            title={t("clubs.pages.index.noClubTitle")}
            description={t("clubs.pages.index.noClubDescription")}
            action={
              <Button asChild>
                <Link href="/clubs/new">
                  <Plus className="h-4 w-4" />
                  {t("clubs.pages.index.create")}
                </Link>
              </Button>
            }
          />
        )}
      </div>

      <div className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold">{query ? t("clubs.pages.index.searchResults") : t("clubs.pages.index.discover")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {query ? t("clubs.pages.index.matching", { query }) : t("clubs.pages.index.discoverDescription")}
          </p>
        </div>
        {clubs.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {clubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title={query ? t("clubs.pages.index.noResultsTitle") : t("clubs.pages.index.noDiscoverTitle")}
            description={
              query
                ? t("clubs.pages.index.noResultsDescription")
                : t("clubs.pages.index.noDiscoverDescription")
            }
          />
        )}
      </div>
    </section>
  );
}
