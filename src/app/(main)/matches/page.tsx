import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getPublicMatches } from "@/server/queries/public.queries";
import { PublicHero, PublicShell } from "@/components/public/public-shell";
import { ClientDateTime } from "@/components/i18n/client-date-time";
import { NumberedPagination } from "@/components/pagination/numbered-pagination";
import { MatchCard } from "@/components/matches/match-card";
import { MatchClubSwitcher } from "@/components/matches/match-club-switcher";
import { Button } from "@/components/ui/button";
import { getMyClubNavigation } from "@/server/queries/club.queries";
import { getMatchesForUserClubs } from "@/server/queries/match.queries";
import { createTranslator } from "@/i18n/dictionary";
import { logPerformance, performanceNow } from "@/lib/performance";

export const metadata: Metadata = {
  title: "Futbol oyunları — PeerFootball",
  description: "Açıq komandalar arasında təsdiqlənmiş qarşıdakı və tamamlanmış futbol oyunlarını kəşf edin.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/matches" }
};

export default async function MatchesPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (user) return <AuthenticatedMatches user={user} />;

  const filter = params.status === "completed" ? "completed" : "upcoming";
  const data = await getPublicMatches({ filter, page: Number(params.page) || 1 });
  return (
    <PublicShell>
      <>
        <PublicHero eyebrow="Təsdiqlənmiş klub oyunları" title="Futbol oyunları" description="Yalnız hər iki tərəfi ictimai və aktiv klub olan, qəbul edilmiş oyunlar göstərilir. Gözləyən təkliflər və daxili komanda oyunları public kataloqa çıxarılmır." />
        <div className="mx-auto max-w-6xl px-4 py-10">
        <nav className="flex gap-2" aria-label="Oyun filtri">
          <FilterLink active={filter === "upcoming"} href="/matches">Qarşıdakı oyunlar</FilterLink>
          <FilterLink active={filter === "completed"} href="/matches?status=completed">Tamamlanmış oyunlar</FilterLink>
        </nav>
        {data.items.length ? (
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {data.items.map((match) => {
              const [home, away] = match.sides;
              return (
                <article key={match.id} className="rounded-2xl border bg-card p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">{match.status}</p>
                  <h2 className="mt-3 text-xl font-black">{home?.name || "Ev komandası"} — {away?.name || "Qonaq komandası"}</h2>
                  <p className="mt-2 text-sm text-muted-foreground"><ClientDateTime value={match.startTime} />{match.venue ? ` · ${match.venue}` : ""}</p>
                  {match.status === "COMPLETED" ? <p className="mt-4 text-3xl font-black">{match.homeScore ?? home?.score ?? 0} : {match.awayScore ?? away?.score ?? 0}</p> : null}
                  <Link href={`/matches/${match.id}`} className="mt-5 inline-flex font-semibold text-primary hover:underline">Oyun məlumatına bax</Link>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="mt-7 rounded-2xl border border-dashed p-8 text-center">
            <h2 className="text-lg font-bold">Bu filtr üzrə ictimai oyun yoxdur</h2>
            <p className="mt-2 text-sm text-muted-foreground">Kataloqda yalnız real və qəbul edilmiş komanda oyunları göstərilir; demo oyun yaradılmır.</p>
          </section>
        )}
        {data.totalPages > 1 ? <div className="mt-8"><NumberedPagination page={data.page} totalPages={data.totalPages} pathname="/matches" searchParams={{ status: filter === "completed" ? "completed" : undefined }} /></div> : null}
        </div>
      </>
    </PublicShell>
  );
}

async function AuthenticatedMatches({ user }: { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }) {
  const startedAt = performanceNow();
  const t = createTranslator(user.locale);
  const [clubs, matches] = await Promise.all([
    getMyClubNavigation(user.id),
    getMatchesForUserClubs(user.id)
  ]);
  logPerformance("matches.page.totalData", performanceNow() - startedAt, "success", {
    route: "/matches",
    matchCount: matches.length
  });

  const groups = clubs.map((club) => ({
    club,
    matches: matches.filter((match) =>
      match.creatorClubId === club.id || match.homeClubId === club.id || match.awayClubId === club.id
    )
  }));

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:py-8">
      <MatchClubSwitcher active="matches" t={t} />
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t("matches.pages.index.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("matches.pages.index.description")}</p>
      </div>

      {groups.map(({ club, matches: clubMatches }) => (
        <section key={club.id} className="grid min-w-0 gap-3">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="min-w-0 break-words text-xl font-semibold">{club.name}</h2>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
              <Link href={`/clubs/${club.slug}/matches`}>{t("matches.pages.index.manage")}</Link>
            </Button>
          </div>
          {clubMatches.length ? (
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              {clubMatches.slice(0, 4).map((match) => <MatchCard key={match.id} match={match} />)}
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
          <p className="text-muted-foreground">{t("matches.pages.index.noClub")}</p>
          <Button asChild className="mt-4 w-full sm:w-auto">
            <Link href="/clubs">{t("matches.pages.index.openClubs")}</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function FilterLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={`rounded-lg px-4 py-2 text-sm font-semibold ${active ? "bg-primary text-primary-foreground" : "border bg-card"}`}>{children}</Link>;
}
