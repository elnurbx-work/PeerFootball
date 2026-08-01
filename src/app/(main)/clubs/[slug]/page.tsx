import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BarChart3, MessageCircle, Swords } from "lucide-react";
import { ClubCard } from "@/components/clubs/club-card";
import { MatchCard } from "@/components/matches/match-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { clubMessagingHref } from "@/lib/messaging/navigation";
import { getClubBySlug, getClubStats, getMyClubs } from "@/server/queries/club.queries";
import { canCreateClubMatches } from "@/server/services/club-permissions.service";
import { getClubMatches } from "@/server/queries/match.queries";
import { createTranslator } from "@/i18n/dictionary";

type ClubPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ClubPage({ params }: ClubPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }
  const t = createTranslator(currentUser.locale);
  const { slug } = await params;
  const club = await getClubBySlug(decodeURIComponent(slug), currentUser.id);

  if (!club) {
    notFound();
  }

  const location = [club.city, club.country].filter(Boolean).join(", ");
  const [myClubs, clubMatches, canManageTargetClub, clubStats] = await Promise.all([
    getMyClubs(currentUser.id),
    getClubMatches(club.id),
    canCreateClubMatches(currentUser.id, club.id),
    getClubStats(club.id)
  ]);
  const manageableChecks = await Promise.all(myClubs.map(async (item) => ({
    club: item,
    canManage: item.id !== club.id && await canCreateClubMatches(currentUser.id, item.id)
  })));
  const invitingClub = manageableChecks.find((item) => item.canManage)?.club;
  const upcomingMatches = clubMatches.filter((match) => ["SCHEDULED", "LIVE"].includes(match.status)).slice(0, 4);
  const pastMatches = clubMatches.filter((match) => match.status === "COMPLETED").slice(0, 4);
  const pendingMatches = canManageTargetClub
    ? clubMatches.filter((match) => ["PENDING", "RESULT_PENDING"].includes(match.status)).slice(0, 4)
    : [];

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10">
      <div className="overflow-hidden rounded-md border bg-card">
        <div className="flex aspect-[4/1] min-h-36 items-center justify-center border-b bg-background">
          {club.coverUrl ? (
            <img src={club.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-card">
              <span className="max-w-full truncate px-6 text-5xl font-bold text-muted-foreground/15 sm:text-7xl">
                {club.name}
              </span>
            </div>
          )}
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-end">
          <div className="flex min-w-0 gap-4">
            <div className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-primary text-3xl font-bold text-primary-foreground">
              {club.logoUrl ? <img src={club.logoUrl} alt="" className="h-full w-full object-cover" /> : club.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-3xl font-bold">{club.name}</h1>
                {!club.isActive ? <Badge variant="secondary">{t("clubs.pages.detail.deactivated")}</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">@{club.slug}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{club.currentUserRole === "OWNER" ? t("clubs.common.roleOwner") : club.currentUserRole === "PLAYER" ? t("clubs.common.rolePlayer") : club.currentUserRole ?? t("clubs.pages.detail.visitor")}</Badge>
                <Badge variant="secondary">{club.visibility === "OPEN" ? t("clubs.common.visibilityOpen") : club.visibility === "REQUEST_ONLY" ? t("clubs.common.visibilityRequestOnly") : t("clubs.common.visibilityInviteOnly")}</Badge>
                <Badge variant="secondary">{t("clubs.card.memberCount", { count: club.memberCount })}</Badge>
                {location ? <Badge variant="secondary">{location}</Badge> : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            {invitingClub && club.isActive ? (
              <Button asChild>
                <Link href={`/clubs/${invitingClub.slug}/matches/new/club-vs-club?opponent=${club.id}`}>{t("matches.createClubVsClub.submit")}</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href={`/clubs/${club.slug}/members`}>{t("clubs.pages.detail.members")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/clubs/${club.slug}/guests`}>{t("clubs.pages.detail.guests")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/clubs/${club.slug}/metrics`}>{t("clubs.pages.detail.metrics")}</Link>
            </Button>
            {club.currentUserMemberStatus === "ACTIVE" ? (
              <Button asChild variant="outline">
                <Link href={`/clubs/${club.slug}/lineups`}>Heyət və taktikalar</Link>
              </Button>
            ) : null}
            {club.currentUserRole === "OWNER" ? (
              <Button asChild>
                <Link href={`/clubs/${club.slug}/settings`}>{t("clubs.pages.detail.settings")}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{t("clubs.pages.detail.overview")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              {club.description ?? t("clubs.pages.detail.noDescription")}
            </p>
          </CardContent>
        </Card>
        <ClubCard club={club} />
      </div>

      {club.currentUserMemberStatus === "ACTIVE" ? (
        <Card className="border-primary/30">
          <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <Swords className="h-6 w-6 text-primary" />
              <h2 className="mt-3 text-lg font-semibold">{t("clubs.pages.detail.matchesTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("clubs.pages.detail.matchesDescription")}
              </p>
            </div>
            <Button asChild>
              <Link href={`/clubs/${club.slug}/matches`}>{t("clubs.pages.detail.openMatches")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <MatchCollection title={t("matches.pages.club.tabs.upcoming")} matches={upcomingMatches} />
      <MatchCollection title={t("matches.pages.club.tabs.finished")} matches={pastMatches} />
      {canManageTargetClub ? <MatchCollection title={t("matches.pages.club.tabs.pending")} matches={pendingMatches} /> : null}

      <Card id="statistics" className="scroll-mt-6">
        <CardHeader><CardTitle>{t("clubs.pages.detail.statisticsTitle")}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[clubStats.matchesPlayed, clubStats.wins, clubStats.draws, clubStats.losses, clubStats.goalsFor, clubStats.goalDifference].map((value, index) => (
            <div key={index} className="rounded-md bg-secondary p-3 text-center"><strong className="text-xl">{value}</strong></div>
          ))}
          {clubStats.recentForm.length ? <div className="col-span-3 flex gap-2 sm:col-span-6">{clubStats.recentForm.map((item, index) => <Badge key={`${item}-${index}`} variant="secondary">{item}</Badge>)}</div> : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="mt-3 font-semibold">{t("clubs.pages.detail.statisticsTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("clubs.pages.detail.statisticsDescription")}</p>
            <Button asChild variant="secondary" size="sm" className="mt-4">
              <Link href="#statistics">{t("clubs.pages.detail.statisticsTitle")}</Link>
            </Button>
          </CardContent>
        </Card>

        {club.currentUserMemberStatus === "ACTIVE" ? (
          <Card>
            <CardContent className="p-5">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-semibold">{t("clubs.pages.detail.chatTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("clubs.pages.detail.chatDescription")}</p>
              <Button asChild size="sm" className="mt-4">
                <Link href={clubMessagingHref(club.id)}>{t("clubs.pages.detail.chatTitle")}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </section>
  );
}

function MatchCollection({ title, matches }: { title: string; matches: Awaited<ReturnType<typeof getClubMatches>> }) {
  return <section className="grid gap-3">
    <h2 className="text-xl font-semibold">{title}</h2>
    {matches.length
      ? <div className="grid gap-4 md:grid-cols-2">{matches.map((match) => <MatchCard key={match.id} match={match} />)}</div>
      : <p className="rounded-md border bg-card p-5 text-sm text-muted-foreground">—</p>}
  </section>;
}
