import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getClubBySlug } from "@/server/queries/club.queries";
import { getClubLineupPlans } from "@/server/queries/tactic.queries";
import { canManageClubTactics } from "@/server/services/club-permissions.service";

export default async function ClubLineupsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ archived?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const { slug } = await params;
  const club = await getClubBySlug(decodeURIComponent(slug), user.id);
  if (!club || club.currentUserMemberStatus !== "ACTIVE") notFound();
  const archived = (await searchParams).archived === "1";
  const [plans, canEdit] = await Promise.all([
    getClubLineupPlans(club.id, user.id, archived),
    canManageClubTactics(user.id, club.id)
  ]);

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost"><Link href={`/clubs/${club.slug}`}><ArrowLeft className="h-4 w-4" />{club.name}</Link></Button>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href={`/clubs/${club.slug}/tactics`}>Bütün taktikalar</Link></Button>
          <Button asChild variant="outline"><Link href={archived ? "?" : "?archived=1"}>{archived ? "Aktiv planlar" : "Arxiv"}</Link></Button>
          {canEdit ? <Button asChild><Link href={`/clubs/${club.slug}/lineups/new`}><Plus className="h-4 w-4" />Yeni heyət planı</Link></Button> : null}
        </div>
      </div>
      <div><h1 className="text-3xl font-bold">Heyət planları</h1><p className="mt-1 text-sm text-muted-foreground">Baza düzülüşlərini və onlara bağlı taktiki ssenariləri idarə et.</p></div>
      {plans.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader><CardTitle>{plan.name}</CardTitle></CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <span>{plan.playerCount}v{plan.playerCount}</span><span>{plan.formationCode}</span>
                  <span>{plan.slotCount} slot</span><span>{plan.tacticCount} taktika</span>
                </div>
                <Button asChild variant="outline"><Link href={`/clubs/${club.slug}/lineups/${plan.id}`}>Planı aç</Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">{archived ? "Arxiv planı yoxdur." : "Klub üçün heyət planı yaradılmayıb."}</div>}
    </section>
  );
}
