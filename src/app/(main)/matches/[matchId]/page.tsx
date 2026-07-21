import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MatchInviteActions, MatchProposalActions } from "@/components/matches/match-proposal-actions";
import { MatchResultConfirmation } from "@/components/matches/match-result-confirmation";
import { MatchResultForm } from "@/components/matches/match-result-form";
import { MatchSideEditor } from "@/components/matches/match-side-editor";
import { MatchDetailDashboard } from "@/components/matches/match-detail-dashboard";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getMatchClubOptions } from "@/server/queries/club.queries";
import { getMatchById } from "@/server/queries/match.queries";
import { createTranslator } from "@/i18n/dictionary";

export default async function MatchDetailsPage({ params }: { params: Promise<{ matchId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const t = createTranslator(user.locale);
  const { matchId } = await params;
  const match = await getMatchById(matchId, user.id);
  if (!match) notFound();

  const clubIds = [...new Set(match.sides.map((side) => side.clubId ?? match.creatorClubId))];
  const options = await getMatchClubOptions(clubIds, user.id);
  const goalsEditable = ["DRAFT", "SCHEDULED", "LIVE"].includes(match.status);
  const manageableSideIds = match.sides
    .filter((side) => goalsEditable && options[side.clubId ?? match.creatorClubId]?.canManage)
    .map((side) => side.id);
  const canRespondProposal = Boolean(
    match.awayClubId &&
    match.status === "PENDING_OPPONENT_APPROVAL" &&
    options[match.awayClubId]?.canManage
  );
  const ownInvites = match.sides
    .flatMap((side) => side.players)
    .filter((player) => player.userId === user.id && player.status === "INVITED");
  const recordedHomeScore = match.goals.filter((goal) => goal.matchSideId === match.sides[0]?.id).length;
  const recordedAwayScore = match.goals.filter((goal) => goal.matchSideId === match.sides[1]?.id).length;

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
        <MatchResultConfirmation matchId={match.id} />
      ) : null}
      {match.disputeReason ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <strong>{t("matches.pages.detail.disputeReason")}</strong> {match.disputeReason}
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

      <MatchDetailDashboard
        match={match}
        options={options}
        manageableSideIds={manageableSideIds}
        summaryActions={summaryActions}
        sideEditor={match.type === "INTERNAL" && match.permissions.canEditMatch ? (
          <MatchSideEditor key="match-side-editor" matchId={match.id} sides={match.sides} />
        ) : null}
      />
    </section>
  );
}
