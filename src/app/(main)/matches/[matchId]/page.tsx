import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { MatchInviteActions, MatchProposalActions } from "@/components/matches/match-proposal-actions";
import { MatchResultConfirmation } from "@/components/matches/match-result-confirmation";
import { MatchResultForm } from "@/components/matches/match-result-form";
import { MatchCancelForm } from "@/components/matches/match-cancel-form";
import { MatchProposalCard } from "@/components/matches/match-proposal-card";
import { MatchTacticsPanel } from "@/components/tactics/match-tactics-panel";
import { MatchSideEditor } from "@/components/matches/match-side-editor";
import { MatchDetailDashboard } from "@/components/matches/match-detail-dashboard";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getMatchClubOptions } from "@/server/queries/club.queries";
import { getMatchById } from "@/server/queries/match.queries";
import { getClubTactics, getMatchTactics } from "@/server/queries/tactic.queries";
import { createTranslator, type Translate } from "@/i18n/dictionary";
import { logPerformance, measureAsync, performanceNow } from "@/lib/performance";
import { getPublicMatchById } from "@/server/queries/public.queries";
import { Breadcrumbs, PublicShell } from "@/components/public/public-shell";
import { ClientDateTime } from "@/components/i18n/client-date-time";
import { siteConfig } from "@/config/site";

type PublicMatch = NonNullable<Awaited<ReturnType<typeof getPublicMatchById>>>;
type Match = NonNullable<Awaited<ReturnType<typeof getMatchById>>>;
type MatchOptions = Awaited<ReturnType<typeof getMatchClubOptions>>;
type MatchInvite = Match["sides"][number]["players"][number];
type PublicMatchSide = PublicMatch["sides"][number];
type SelectedTactics = Awaited<ReturnType<typeof getMatchTactics>>;
type AvailableTactics = Awaited<ReturnType<typeof getClubTactics>>;

type MatchViewFlags = {
  isProposalView: boolean;
  shouldShowTactics: boolean;
  canEditInternalSides: boolean;
  canReviewResult: boolean;
  hasAlternativeDisputedScore: boolean;
};

export async function generateMetadata({ params }: { params: Promise<{ matchId: string }> }): Promise<Metadata> {
  const match = await getPublicMatchById((await params).matchId);
  if (!match) return { title: "Oyun tapılmadı", robots: { index: false, follow: false } };
  const teams = match.sides.map((side) => side.name).join(" — ");
  return {
    title: `${teams} — PeerFootball`,
    description: `${teams} futbol oyununun vaxtı, məkanı, statusu və ictimai nəticəsi.`,
    robots: { index: true, follow: true },
    alternates: { canonical: `/matches/${match.id}` }
  };
}

export default async function MatchDetailsPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const totalStartedAt = performanceNow();
  const user = await measureAsync("matches.detailPage.currentUser", getCurrentUser, {
    route: "/matches/[matchId]"
  });
  if (!user) {
    const publicMatch = await getPublicMatchById(matchId);
    if (!publicMatch) notFound();
    return <PublicMatchPage match={publicMatch} />;
  }
  const t = createTranslator(user.locale);
  const match = await getMatchById(matchId, user.id);
  if (!match) notFound();

  const clubIds = [...new Set(match.sides.map((side) => side.clubId ?? match.creatorClubId))];
  const options = await measureAsync(
    "matches.detailPage.clubOptions",
    () => getMatchClubOptions(clubIds, user.id),
    { route: "/matches/[matchId]", sideCount: match.sides.length }
  );
  const manageableClubIds = getManageableClubIds(match, options);
  const [selectedTactics, availableTacticGroups] = await Promise.all([
    getMatchTactics(match.id, user.id),
    Promise.all(manageableClubIds.map((clubId) => getClubTactics(clubId, user.id)))
  ]);
  const availableTactics = availableTacticGroups.flat();
  const manageableSideIds = getManageableSideIds(match, options);
  const canRespondProposal = canRespondToProposal(match, options);
  const ownInvites = getOwnMatchInvites(match, user.id);
  const { recordedHomeScore, recordedAwayScore } = getRecordedScores(match);
  const viewFlags = getMatchViewFlags(match);
  const sideEditor = getInternalMatchSideEditor(match, viewFlags.canEditInternalSides);
  logPerformance("matches.detailPage.totalData", performanceNow() - totalStartedAt, "success", {
    route: "/matches/[matchId]",
    sideCount: match.sides.length,
    playerCount: match.sides.reduce((count, side) => count + side.players.length, 0),
    videoCount: match.videos.length,
    goalCount: match.goals.length,
    commentCount: match.comments.length,
    replyCount: match.comments.reduce((count, comment) => count + comment.replies.length, 0)
  });

  const summaryActions = (
    <MatchSummaryActions
      match={match}
      canRespondProposal={canRespondProposal}
      ownInvites={ownInvites}
      recordedHomeScore={recordedHomeScore}
      recordedAwayScore={recordedAwayScore}
      canReviewResult={viewFlags.canReviewResult}
      hasAlternativeDisputedScore={viewFlags.hasAlternativeDisputedScore}
      t={t}
    />
  );

  return (
    <section className="mx-auto grid w-full min-w-0 max-w-[1500px] gap-4 px-3 py-5 sm:gap-7 sm:px-6 sm:py-7 lg:px-8 lg:py-10">
      <Button asChild variant="ghost" className="max-w-full justify-start px-1 sm:px-0">
        <Link className="min-w-0" href={`/clubs/${match.creatorClub.slug}/matches`}>
          <span aria-hidden="true">←</span>
          <span className="truncate">{t("matches.pages.detail.clubMatches", { club: match.creatorClub.name })}</span>
        </Link>
      </Button>

      <MatchMainContent
        match={match}
        options={options}
        manageableSideIds={manageableSideIds}
        summaryActions={summaryActions}
        sideEditor={sideEditor}
        isProposalView={viewFlags.isProposalView}
        shouldShowTactics={viewFlags.shouldShowTactics}
        selectedTactics={selectedTactics}
        availableTactics={availableTactics}
        canManageTactics={manageableClubIds.length > 0}
      />
    </section>
  );
}

function PublicMatchPage({ match }: { match: PublicMatch }) {
  const [home, away] = match.sides;
  const jsonLd = createPublicMatchJsonLd(match, home, away);
  const content = (
    <article className="mx-auto max-w-5xl px-4 py-10">
      <Breadcrumbs items={[{ label: "Ana səhifə", href: "/" }, { label: "Oyunlar", href: "/matches" }, { label: `${home?.name || "Ev"} — ${away?.name || "Qonaq"}` }]} />
      <PublicMatchHeader match={match} home={home} away={away} />
      <PublicMatchInformation match={match} />
      <PublicMatchGoals goals={match.goals} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }}
      />
    </article>
  );
  return <PublicShell>{content}</PublicShell>;
}

function PublicMatchHeader({
  match,
  home,
  away
}: {
  match: PublicMatch;
  home: PublicMatchSide | undefined;
  away: PublicMatchSide | undefined;
}) {
  const isCompleted = match.status === "COMPLETED";
  const venueLabel = match.venue ? ` · ${match.venue}` : "";

  return (
    <header className="rounded-2xl border bg-card p-6 text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-primary">{match.status}</p>
      <h1 className="mt-4 text-3xl font-black sm:text-5xl">{home?.name || "Ev komandası"} — {away?.name || "Qonaq komandası"}</h1>
      {isCompleted ? <p className="mt-5 text-5xl font-black">{match.homeScore ?? home?.score ?? 0} : {match.awayScore ?? away?.score ?? 0}</p> : null}
      <p className="mt-5 text-muted-foreground"><ClientDateTime value={match.startTime} />{venueLabel}</p>
    </header>
  );
}

function PublicMatchInformation({ match }: { match: PublicMatch }) {
  return (
    <section className="mt-7 rounded-2xl border bg-card p-6">
      <h2 className="text-2xl font-bold">Oyun məlumatı</h2>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">Format</dt><dd className="font-semibold">{match.format || "Qeyd edilməyib"}</dd></div><div><dt className="text-sm text-muted-foreground">Kateqoriya</dt><dd className="font-semibold">{match.category}</dd></div></dl>
    </section>
  );
}

function PublicMatchGoals({ goals }: { goals: PublicMatch["goals"] }) {
  if (!goals.length) return null;

  return (
    <section className="mt-7 rounded-2xl border bg-card p-6">
      <h2 className="text-2xl font-bold">Qollar</h2>
      <ul className="mt-4 grid gap-2">
        {goals.map((goal) => (
          <li key={goal.id} className="rounded-lg bg-secondary p-3">
            <strong>{getPublicGoalMinuteLabel(goal)}</strong> · {goal.playerName || "Oyunçu adı qeyd edilməyib"}
          </li>
        ))}
      </ul>
    </section>
  );
}

function getPublicGoalMinuteLabel(goal: PublicMatch["goals"][number]) {
  if (goal.minute === null) return "Dəqiqə qeyd edilməyib";
  const extraMinute = goal.extraMinute ? `+${goal.extraMinute}` : "";
  return `${goal.minute}${extraMinute}'`;
}

function createPublicMatchJsonLd(
  match: PublicMatch,
  home: PublicMatchSide | undefined,
  away: PublicMatchSide | undefined
) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${home?.name} — ${away?.name}`,
    startDate: match.startTime,
    eventStatus: match.status,
    location: match.venue ? { "@type": "Place", name: match.venue } : undefined,
    url: `${siteConfig.url}/matches/${match.id}`
  };
}

function getManageableClubIds(match: Match, options: MatchOptions) {
  return match.sides.flatMap((side) =>
    side.clubId && options[side.clubId]?.canManage ? [side.clubId] : []
  );
}

function getManageableSideIds(match: Match, options: MatchOptions) {
  const isEditableStatus = ["DRAFT", "SCHEDULED", "LIVE"].includes(match.status);
  return match.sides
    .filter((side) => isEditableStatus && options[side.clubId ?? match.creatorClubId]?.canManage)
    .map((side) => side.id);
}

function canRespondToProposal(match: Match, options: MatchOptions) {
  if (!match.awayClubId || match.status !== "PENDING") return false;
  const respondingClubId = match.creatorClubId === match.homeClubId
    ? match.awayClubId
    : match.homeClubId ?? "";
  return Boolean(options[respondingClubId]?.canManage);
}

function getOwnMatchInvites(match: Match, userId: string) {
  return match.sides
    .flatMap((side) => side.players)
    .filter((player) => player.userId === userId && player.status === "INVITED");
}

function getRecordedScores(match: Match) {
  return {
    recordedHomeScore: match.goals.filter((goal) => goal.matchSideId === match.sides[0]?.id).length,
    recordedAwayScore: match.goals.filter((goal) => goal.matchSideId === match.sides[1]?.id).length
  };
}

function getMatchViewFlags(match: Match): MatchViewFlags {
  const isProposalView = match.type === "CLUB_VS_CLUB" && ["PENDING", "REJECTED"].includes(match.status);
  const shouldShowTactics = !["PENDING", "REJECTED"].includes(match.status);
  const canEditInternalSides = match.type === "INTERNAL" && match.permissions.canEditMatch;
  const canReviewResult = match.permissions.canConfirmResult || match.permissions.canDisputeResult;
  const hasAlternativeDisputedScore =
    match.status === "DISPUTED" &&
    match.alternativeHomeScore !== null &&
    match.alternativeAwayScore !== null;

  return {
    isProposalView,
    shouldShowTactics,
    canEditInternalSides,
    canReviewResult,
    hasAlternativeDisputedScore
  };
}

function getInternalMatchSideEditor(match: Match, canEditInternalSides: boolean) {
  if (!canEditInternalSides) return null;
  return <MatchSideEditor key="match-side-editor" matchId={match.id} sides={match.sides} />;
}

function MatchSummaryActions({
  match,
  canRespondProposal,
  ownInvites,
  recordedHomeScore,
  recordedAwayScore,
  canReviewResult,
  hasAlternativeDisputedScore,
  t
}: {
  match: Match;
  canRespondProposal: boolean;
  ownInvites: MatchInvite[];
  recordedHomeScore: number;
  recordedAwayScore: number;
  canReviewResult: boolean;
  hasAlternativeDisputedScore: boolean;
  t: Translate;
}) {
  return (
    <div className="grid gap-3">
      {canRespondProposal ? <MatchProposalActions matchId={match.id} /> : null}
      {ownInvites.map((invite) => <MatchInviteActions key={invite.id} matchPlayerId={invite.id} />)}
      {match.permissions.canSubmitResult ? (
        <MatchResultForm
          matchId={match.id}
          initialHomeScore={recordedHomeScore}
          initialAwayScore={recordedAwayScore}
        />
      ) : null}
      {canReviewResult ? (
        <MatchResultConfirmation matchId={match.id} homeScore={match.homeScore ?? 0} awayScore={match.awayScore ?? 0} />
      ) : null}
      {match.permissions.canCancelMatch ? <MatchCancelForm matchId={match.id} /> : null}
      <MatchDisputeInformation
        match={match}
        hasAlternativeDisputedScore={hasAlternativeDisputedScore}
        t={t}
      />
    </div>
  );
}

function MatchDisputeInformation({
  match,
  hasAlternativeDisputedScore,
  t
}: {
  match: Match;
  hasAlternativeDisputedScore: boolean;
  t: Translate;
}) {
  return (
    <>
      {match.disputeReason ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <strong>{t("matches.pages.detail.disputeReason")}</strong> {match.disputeReason}
        </div>
      ) : null}
      {hasAlternativeDisputedScore ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <strong>{t("matches.resultConfirmation.dispute")}:</strong> {match.alternativeHomeScore} : {match.alternativeAwayScore}
        </div>
      ) : null}
    </>
  );
}

function MatchMainContent({
  match,
  options,
  manageableSideIds,
  summaryActions,
  sideEditor,
  isProposalView,
  shouldShowTactics,
  selectedTactics,
  availableTactics,
  canManageTactics
}: {
  match: Match;
  options: MatchOptions;
  manageableSideIds: string[];
  summaryActions: ReactNode;
  sideEditor: ReactNode;
  isProposalView: boolean;
  shouldShowTactics: boolean;
  selectedTactics: SelectedTactics;
  availableTactics: AvailableTactics;
  canManageTactics: boolean;
}) {
  return (
    <>
      {isProposalView ? (
        <MatchProposalCard match={match} actions={summaryActions} />
      ) : (
        <MatchDetailDashboard
          match={match}
          options={options}
          manageableSideIds={manageableSideIds}
          summaryActions={summaryActions}
          sideEditor={sideEditor}
        />
      )}
      {shouldShowTactics ? (
        <MatchTacticsPanel
          matchId={match.id}
          selected={selectedTactics}
          available={availableTactics}
          canManage={canManageTactics}
        />
      ) : null}
    </>
  );
}
