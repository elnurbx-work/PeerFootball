import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
import { createTranslator } from "@/i18n/dictionary";
import { logPerformance, measureAsync, performanceNow } from "@/lib/performance";

export default async function MatchDetailsPage({ params }: { params: Promise<{ matchId: string }> }) {
  const totalStartedAt = performanceNow();
  const user = await measureAsync("matches.detailPage.currentUser", getCurrentUser, {
    route: "/matches/[matchId]"
  });
  if (!user) redirect("/auth/login");
  const t = createTranslator(user.locale);
  const { matchId } = await params;
  const match = await getMatchById(matchId, user.id);
  if (!match) notFound();

  const clubIds = [...new Set(match.sides.map((side) => side.clubId ?? match.creatorClubId))];
  const options = await measureAsync(
    "matches.detailPage.clubOptions",
    () => getMatchClubOptions(clubIds, user.id),
    { route: "/matches/[matchId]", sideCount: match.sides.length }
  );
  const manageableClubIds = match.sides
    .flatMap((side) => side.clubId && options[side.clubId]?.canManage ? [side.clubId] : []);
  const [selectedTactics, availableTacticGroups] = await Promise.all([
    getMatchTactics(match.id, user.id),
    Promise.all(manageableClubIds.map((clubId) => getClubTactics(clubId, user.id)))
  ]);
  const availableTactics = availableTacticGroups.flat();
  const goalsEditable = ["DRAFT", "SCHEDULED", "LIVE"].includes(match.status);
  const manageableSideIds = match.sides
    .filter((side) => goalsEditable && options[side.clubId ?? match.creatorClubId]?.canManage)
    .map((side) => side.id);
  const canRespondProposal = Boolean(
    match.awayClubId &&
    match.status === "PENDING" &&
    options[match.creatorClubId === match.homeClubId ? match.awayClubId : match.homeClubId ?? ""]?.canManage
  );
  const ownInvites = match.sides
    .flatMap((side) => side.players)
    .filter((player) => player.userId === user.id && player.status === "INVITED");
  const recordedHomeScore = match.goals.filter((goal) => goal.matchSideId === match.sides[0]?.id).length;
  const recordedAwayScore = match.goals.filter((goal) => goal.matchSideId === match.sides[1]?.id).length;
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
      {match.permissions.canConfirmResult || match.permissions.canDisputeResult ? (
        <MatchResultConfirmation matchId={match.id} homeScore={match.homeScore ?? 0} awayScore={match.awayScore ?? 0} />
      ) : null}
      {match.permissions.canCancelMatch ? <MatchCancelForm matchId={match.id} /> : null}
      {match.disputeReason ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <strong>{t("matches.pages.detail.disputeReason")}</strong> {match.disputeReason}
        </div>
      ) : null}
      {match.status === "DISPUTED" && match.alternativeHomeScore !== null && match.alternativeAwayScore !== null ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <strong>{t("matches.resultConfirmation.dispute")}:</strong> {match.alternativeHomeScore} : {match.alternativeAwayScore}
        </div>
      ) : null}
    </div>
  );

  return (
    <section className="mx-auto grid w-full min-w-0 max-w-[1500px] gap-4 px-3 py-5 sm:gap-7 sm:px-6 sm:py-7 lg:px-8 lg:py-10">
      <Button asChild variant="ghost" className="max-w-full justify-start px-1 sm:px-0">
        <Link className="min-w-0" href={`/clubs/${match.creatorClub.slug}/matches`}>
          <span aria-hidden="true">←</span>
          <span className="truncate">{t("matches.pages.detail.clubMatches", { club: match.creatorClub.name })}</span>
        </Link>
      </Button>

      {match.type === "CLUB_VS_CLUB" && ["PENDING", "REJECTED"].includes(match.status) ? (
        <MatchProposalCard match={match} actions={summaryActions} />
      ) : (
        <MatchDetailDashboard
          match={match}
          options={options}
          manageableSideIds={manageableSideIds}
          summaryActions={summaryActions}
          sideEditor={match.type === "INTERNAL" && match.permissions.canEditMatch ? (
            <MatchSideEditor key="match-side-editor" matchId={match.id} sides={match.sides} />
          ) : null}
        />
      )}
      {!["PENDING", "REJECTED"].includes(match.status) ? (
        <MatchTacticsPanel
          matchId={match.id}
          selected={selectedTactics}
          available={availableTactics}
          canManage={manageableClubIds.length > 0}
        />
      ) : null}
    </section>
  );
}
