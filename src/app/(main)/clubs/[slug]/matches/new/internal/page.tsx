import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CreateInternalMatchForm } from "@/components/matches/create-internal-match-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getClubBySlug } from "@/server/queries/club.queries";
import { canCreateClubMatches } from "@/server/services/club-permissions.service";
export default async function NewInternalMatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect("/auth/login"); const { slug } = await params;
  const club = await getClubBySlug(decodeURIComponent(slug), user.id); if (!club || !(await canCreateClubMatches(user.id, club.id))) notFound();
  return <section className="mx-auto grid max-w-2xl gap-5 px-4 py-8"><Button asChild variant="ghost" className="w-fit"><Link href={`/clubs/${club.slug}/matches`}>← Matches</Link></Button><Card><CardHeader><CardTitle>Create internal match</CardTitle></CardHeader><CardContent><CreateInternalMatchForm clubId={club.id} /></CardContent></Card></section>;
}
