import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CreateClubVsClubMatchForm } from "@/components/matches/create-club-vs-club-match-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getClubBySlug, searchClubs } from "@/server/queries/club.queries";
import { canCreateClubMatches } from "@/server/services/club-permissions.service";
export default async function NewClubVsClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect("/auth/login"); const { slug } = await params;
  const club = await getClubBySlug(decodeURIComponent(slug), user.id); if (!club || !(await canCreateClubMatches(user.id, club.id))) notFound();
  const opponents = (await searchClubs()).filter((item) => item.id !== club.id);
  return <section className="mx-auto grid max-w-2xl gap-5 px-4 py-8"><Button asChild variant="ghost" className="w-fit"><Link href={`/clubs/${club.slug}/matches`}>← Matches</Link></Button><Card><CardHeader><CardTitle>Create club vs club proposal</CardTitle></CardHeader><CardContent><CreateClubVsClubMatchForm homeClubId={club.id} opponents={opponents} /></CardContent></Card></section>;
}
