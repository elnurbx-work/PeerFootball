import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { MatchCard } from "@/components/matches/match-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getClubBySlug } from "@/server/queries/club.queries";
import { getClubMatches } from "@/server/queries/match.queries";
import { canCreateClubMatches } from "@/server/services/club-permissions.service";
import { createTranslator } from "@/i18n/dictionary";

export default async function ClubMatchesPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect("/auth/login");
  const t = createTranslator(user.locale);
  const tabs = [
    ["upcoming", t("matches.pages.club.tabs.upcoming")], ["pending", t("matches.pages.club.tabs.pending")], ["finished", t("matches.pages.club.tabs.finished")], ["disputed", t("matches.pages.club.tabs.disputed")]
  ] as const;
  const { slug } = await params; const club = await getClubBySlug(decodeURIComponent(slug), user.id); if (!club) notFound();
  if (club.currentUserMemberStatus !== "ACTIVE") notFound();
  const [matches, canManage] = await Promise.all([getClubMatches(club.id, user.id), canCreateClubMatches(user.id, club.id)]);
  const activeTab = (await searchParams).tab ?? "upcoming";
  const visible = matches.filter((match) => {
    if (activeTab === "pending") return ["PENDING_OPPONENT_APPROVAL", "RESULT_PENDING_CONFIRMATION"].includes(match.status);
    if (activeTab === "finished") return ["FINISHED", "CANCELLED"].includes(match.status);
    if (activeTab === "disputed") return match.status === "DISPUTED";
    return ["DRAFT", "SCHEDULED", "LIVE"].includes(match.status);
  });
  return <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><Button asChild variant="ghost"><Link href={`/clubs/${club.slug}`}><ArrowLeft className="h-4 w-4" />{club.name}</Link></Button>{canManage ? <div className="flex gap-2"><Button asChild><Link href={`/clubs/${club.slug}/matches/new/internal`}><Plus className="h-4 w-4" />{t("matches.pages.club.internalMatch")}</Link></Button><Button asChild variant="outline"><Link href={`/clubs/${club.slug}/matches/new/club-vs-club`}>{t("matches.pages.club.clubVsClub")}</Link></Button></div> : null}</div>
    <div><h1 className="text-3xl font-bold">{t("matches.pages.club.title")}</h1><p className="mt-1 text-sm text-muted-foreground">{t("matches.pages.club.description")}</p></div>
    <nav className="flex gap-2 overflow-x-auto">{tabs.map(([value, label]) => <Button key={value} asChild size="sm" variant={activeTab === value ? "default" : "outline"}><Link href={`?tab=${value}`}>{label}</Link></Button>)}</nav>
    {visible.length ? <div className="grid gap-4 md:grid-cols-2">{visible.map((match) => <MatchCard key={match.id} match={match} />)}</div> : <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground">{t("matches.pages.club.empty")}</div>}
  </section>;
}
