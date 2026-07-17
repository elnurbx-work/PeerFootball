import Link from "next/link";
import { redirect } from "next/navigation";
import { MatchCard } from "@/components/matches/match-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getMyClubs } from "@/server/queries/club.queries";
import { getClubMatches } from "@/server/queries/match.queries";
import { createTranslator } from "@/i18n/dictionary";

export default async function MatchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const t = createTranslator(user.locale);

  const clubs = await getMyClubs(user.id);
  const groups = await Promise.all(
    clubs.map(async (club) => ({
      club,
      matches: await getClubMatches(club.id, user.id)
    }))
  );

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t("matches.pages.index.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("matches.pages.index.description")}
        </p>
      </div>

      {groups.map(({ club, matches }) => (
        <section key={club.id} className="grid min-w-0 gap-3">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="min-w-0 break-words text-xl font-semibold">{club.name}</h2>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
              <Link href={`/clubs/${club.slug}/matches`}>{t("matches.pages.index.manage")}</Link>
            </Button>
          </div>
          {matches.length ? (
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              {matches.slice(0, 4).map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <p className="rounded-md border bg-card p-5 text-sm text-muted-foreground">
              {t("matches.pages.index.empty")}
            </p>
          )}
        </section>
      ))}

      {!clubs.length ? (
        <div className="rounded-md border bg-card p-6 text-center sm:p-8">
          <p className="text-muted-foreground">
            {t("matches.pages.index.noClub")}
          </p>
          <Button asChild className="mt-4 w-full sm:w-auto">
            <Link href="/clubs">{t("matches.pages.index.openClubs")}</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
