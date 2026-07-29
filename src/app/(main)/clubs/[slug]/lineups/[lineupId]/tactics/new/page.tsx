import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CreateTacticForm } from "@/components/tactics/create-tactic-form";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getLineupPlanDetail } from "@/server/queries/tactic.queries";

export default async function NewTacticPage({ params }: { params: Promise<{ slug: string; lineupId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const { slug, lineupId } = await params;
  const plan = await getLineupPlanDetail(lineupId, user.id);
  if (!plan || !plan.canEdit || plan.club.slug !== decodeURIComponent(slug) || plan.status === "ARCHIVED") notFound();
  return (
    <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
      <Button asChild variant="ghost" className="w-fit"><Link href={`/clubs/${plan.club.slug}/lineups/${plan.id}?tab=tactics`}><ArrowLeft className="h-4 w-4" />{plan.name}</Link></Button>
      <div><h1 className="text-3xl font-bold">Yeni taktika</h1><p className="text-sm text-muted-foreground">{plan.formationCode} düzülüşünün ayrıca snapshot-u yaradılacaq.</p></div>
      <CreateTacticForm lineupPlanId={plan.id} />
    </section>
  );
}
