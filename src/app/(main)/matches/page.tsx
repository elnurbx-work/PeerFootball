import Link from "next/link";
import { redirect } from "next/navigation";
import { MatchCard } from "@/components/matches/match-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getMyClubs } from "@/server/queries/club.queries";
import { getClubMatches } from "@/server/queries/match.queries";
export default async function MatchesPage() {
  const user = await getCurrentUser(); if (!user) redirect("/auth/login");
  const clubs = await getMyClubs(user.id); const groups = await Promise.all(clubs.map(async (club) => ({ club, matches: await getClubMatches(club.id, user.id) })));
  return <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8"><div><h1 className="text-3xl font-bold">Club matches</h1><p className="mt-1 text-sm text-muted-foreground">Matches are created from clubs, not as individual posts.</p></div>{groups.map(({ club, matches }) => <section key={club.id} className="grid gap-3"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{club.name}</h2><Button asChild variant="outline" size="sm"><Link href={`/clubs/${club.slug}/matches`}>Manage club matches</Link></Button></div>{matches.length ? <div className="grid gap-4 md:grid-cols-2">{matches.slice(0, 4).map((match) => <MatchCard key={match.id} match={match} />)}</div> : <p className="rounded-md border bg-card p-5 text-sm text-muted-foreground">No matches yet.</p>}</section>)}{!clubs.length ? <div className="rounded-md border bg-card p-8 text-center"><p className="text-muted-foreground">Join or create a club before creating a match.</p><Button asChild className="mt-4"><Link href="/clubs">Open clubs</Link></Button></div> : null}</section>;
}
