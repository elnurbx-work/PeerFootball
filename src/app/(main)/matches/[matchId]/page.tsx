import Link from "next/link";
import type { Metadata } from "next";
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
import { createTranslator } from "@/i18n/dictionary";
import { logPerformance, measureAsync, performanceNow } from "@/lib/performance";
import { getPublicMatchById } from "@/server/queries/public.queries";
import { Breadcrumbs, PublicShell } from "@/components/public/public-shell";
import { ClientDateTime } from "@/components/i18n/client-date-time";
import { siteConfig } from "@/config/site";

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
    const [home, away] = publicMatch.sides;
    const content = (
      <article className="mx-auto max-w-5xl px-4 py-10">
        <Breadcrumbs items={[{ label: "Ana səhifə", href: "/" }, { label: "Oyunlar", href: "/matches" }, { label: `${home?.name || "Ev"} — ${away?.name || "Qonaq"}` }]} />
        <header className="rounded-2xl border bg-card p-6 text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-primary">{publicMatch.status}</p>
          <h1 className="mt-4 text-3xl font-black sm:text-5xl">{home?.name || "Ev komandası"} — {away?.name || "Qonaq komandası"}</h1>
          {publicMatch.status === "COMPLETED" ? <p className="mt-5 text-5xl font-black">{publicMatch.homeScore ?? home?.score ?? 0} : {publicMatch.awayScore ?? away?.score ?? 0}</p> : null}
          <p className="mt-5 text-muted-foreground"><ClientDateTime value={publicMatch.startTime} />{publicMatch.venue ? ` · ${publicMatch.venue}` : ""}</p>
        </header>
        <section className="mt-7 rounded-2xl border bg-card p-6">
          <h2 className="text-2xl font-bold">Oyun məlumatı</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">Format</dt><dd className="font-semibold">{publicMatch.format || "Qeyd edilməyib"}</dd></div><div><dt className="text-sm text-muted-foreground">Kateqoriya</dt><dd className="font-semibold">{publicMatch.category}</dd></div></dl>
        </section>
        {publicMatch.goals.length ? <section className="mt-7 rounded-2xl border bg-card p-6"><h2 className="text-2xl font-bold">Qollar</h2><ul className="mt-4 grid gap-2">{publicMatch.goals.map((goal) => <li key={goal.id} className="rounded-lg bg-secondary p-3"><strong>{goal.minute === null ? "Dəqiqə qeyd edilməyib" : `${goal.minute}${goal.extraMinute ? `+${goal.extraMinute}` : ""}'`}</strong> · {goal.playerName || "Oyunçu adı qeyd edilməyib"}</li>)}</ul></section> : null}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "SportsEvent", name: `${home?.name} — ${away?.name}`, startDate: publicMatch.startTime, eventStatus: publicMatch.status, location: publicMatch.venue ? { "@type": "Place", name: publicMatch.venue } : undefined, url: `${siteConfig.url}/matches/${publicMatch.id}` }).replaceAll("<", "\\u003c") }} />
      </article>
    );
    return <PublicShell>{content}</PublicShell>;
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
