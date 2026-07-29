import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TacticCard } from "@/components/tactics/tactic-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getClubBySlug } from "@/server/queries/club.queries";
import { getClubTactics } from "@/server/queries/tactic.queries";
import { canManageClubTactics } from "@/server/services/club-permissions.service";

export default async function ClubTacticsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ archived?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const { slug } = await params;
  const club = await getClubBySlug(decodeURIComponent(slug), user.id);
  if (!club || club.currentUserMemberStatus !== "ACTIVE") notFound();
  const archived = (await searchParams).archived === "1";
  const [tactics, canEdit] = await Promise.all([
    getClubTactics(club.id, user.id, archived),
    canManageClubTactics(user.id, club.id)
  ]);
  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost"><Link href={`/clubs/${club.slug}/lineups`}><ArrowLeft className="h-4 w-4" />Heyət planları</Link></Button>
        <Button asChild variant="outline"><Link href={archived ? "?" : "?archived=1"}>{archived ? "Aktiv taktikalar" : "Arxiv taktikalar"}</Link></Button>
      </div>
      <div><h1 className="text-3xl font-bold">{club.name} taktikaları</h1><p className="text-sm text-muted-foreground">Kateqoriya, görünürlük və heyət planı üzrə taktiki ssenarilər.</p></div>
      {tactics.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{tactics.map((tactic) => <TacticCard key={tactic.id} tactic={tactic} canEdit={canEdit} />)}</div>
        : <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">{archived ? "Arxiv taktika yoxdur." : "Aktiv taktika yoxdur."}</div>}
    </section>
  );
}
