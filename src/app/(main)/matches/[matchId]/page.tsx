import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MatchInviteActions, MatchProposalActions } from "@/components/matches/match-proposal-actions";
import { MatchResultConfirmation } from "@/components/matches/match-result-confirmation";
import { MatchResultForm } from "@/components/matches/match-result-form";
import { MatchSideEditor } from "@/components/matches/match-side-editor";
import { MatchDetailDashboard } from "@/components/matches/match-detail-dashboard";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getClubGuests, getClubMembers } from "@/server/queries/club.queries";
import { getMatchById } from "@/server/queries/match.queries";
import { canCreateClubMatches } from "@/server/services/club-permissions.service";

export default async function MatchDetailsPage({ params }: { params: Promise<{ matchId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const { matchId } = await params;
  const match = await getMatchById(matchId, user.id);
  if (!match) notFound();

  const clubIds = [...new Set(match.sides.map((side) => side.clubId ?? match.creatorClubId))];
  const optionEntries = await Promise.all(clubIds.map(async (clubId) => [clubId, {
    members: await getClubMembers(clubId),
    guests: await getClubGuests(clubId),
    canManage: await canCreateClubMatches(user.id, clubId)
  }] as const));
  const options = Object.fromEntries(optionEntries);
  const manageableSideIds = match.sides
    .filter((side) => options[side.clubId ?? match.creatorClubId]?.canManage)
    .map((side) => side.id);
  const canRespondProposal = Boolean(
    match.awayClubId &&
    match.status === "PENDING_OPPONENT_APPROVAL" &&
    options[match.awayClubId]?.canManage
  );
  const ownInvites = match.sides
    .flatMap((side) => side.players)
    .filter((player) => player.userId === user.id && player.status === "INVITED");

  const summaryActions = (
    <>
      {canRespondProposal ? <MatchProposalActions matchId={match.id} /> : null}
      {ownInvites.map((invite) => <MatchInviteActions key={invite.id} matchPlayerId={invite.id} />)}
      {match.permissions.canSubmitResult ? <MatchResultForm matchId={match.id} /> : null}
      {match.permissions.canConfirmResult || match.permissions.canDisputeResult ? (
        <MatchResultConfirmation matchId={match.id} />
      ) : null}
      {match.disputeReason ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <strong>Etiraz səbəbi:</strong> {match.disputeReason}
        </div>
      ) : null}
    </>
  );

  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-7 px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <Button asChild variant="ghost" className="w-fit px-0">
        <Link href={`/clubs/${match.creatorClub.slug}/matches`}>← {match.creatorClub.name} oyunları</Link>
      </Button>

      <MatchDetailDashboard
        match={match}
        options={options}
        manageableSideIds={manageableSideIds}
        summaryActions={summaryActions}
        sideEditor={match.type === "INTERNAL" && match.permissions.canEditMatch ? (
        <MatchSideEditor matchId={match.id} sides={match.sides} />
        ) : null}
      />
    </section>
  );
}
