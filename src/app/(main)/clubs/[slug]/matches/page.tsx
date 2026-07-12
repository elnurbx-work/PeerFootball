import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { MatchCard } from "@/components/matches/match-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getClubBySlug } from "@/server/queries/club.queries";
import { getClubMatches } from "@/server/queries/match.queries";
import { canCreateClubMatches } from "@/server/services/club-permissions.service";

const tabs = [
  ["upcoming", "Upcoming"], ["pending", "Pending proposals"], ["finished", "Finished"], ["disputed", "Disputed"]
] as const;

export default async function ClubMatchesPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect("/auth/login");
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
    <div className="flex flex-wrap items-center justify-between gap-3"><Button asChild variant="ghost"><Link href={`/clubs/${club.slug}`}><ArrowLeft className="h-4 w-4" />{club.name}</Link></Button>{canManage ? <div className="flex gap-2"><Button asChild><Link href={`/clubs/${club.slug}/matches/new/internal`}><Plus className="h-4 w-4" />Internal match</Link></Button><Button asChild variant="outline"><Link href={`/clubs/${club.slug}/matches/new/club-vs-club`}>Club vs club</Link></Button></div> : null}</div>
    <div><h1 className="text-3xl font-bold">Club matches</h1><p className="mt-1 text-sm text-muted-foreground">Matches are created and managed by the club, separately from posts.</p></div>
    <nav className="flex gap-2 overflow-x-auto">{tabs.map(([value, label]) => <Button key={value} asChild size="sm" variant={activeTab === value ? "default" : "outline"}><Link href={`?tab=${value}`}>{label}</Link></Button>)}</nav>
    {visible.length ? <div className="grid gap-4 md:grid-cols-2">{visible.map((match) => <MatchCard key={match.id} match={match} />)}</div> : <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground">No matches in this section.</div>}
  </section>;
}
