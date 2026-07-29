import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TacticViewer } from "@/components/tactics/tactic-viewer";
import { TacticSettings } from "@/components/tactics/tactic-settings";
import { getCurrentUser } from "@/lib/auth";
import { getTacticDetail } from "@/server/queries/tactic.queries";

export default async function TacticPage({ params }: { params: Promise<{ tacticId: string }> }) {
  const user = await getCurrentUser();
  const { tacticId } = await params;
  const tactic = await getTacticDetail(tacticId, user?.id);
  if (!tactic) notFound();
  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-3 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost"><Link href={`/clubs/${tactic.club.slug}/lineups/${tactic.lineupPlanId}?tab=tactics`}><ArrowLeft className="h-4 w-4" />{tactic.lineupPlan.name}</Link></Button>
        {tactic.canEdit && tactic.status !== "ARCHIVED" ? <Button asChild><Link href={`/tactics/${tactic.id}/edit`}><Pencil className="h-4 w-4" />Redaktə et</Link></Button> : null}
      </div>
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2"><Badge>{tactic.category}</Badge><Badge variant="secondary">{tactic.visibility}</Badge><Badge variant="secondary">{tactic.status}</Badge></div>
        <h1 className="text-3xl font-bold">{tactic.name}</h1>
        <p className="text-sm text-muted-foreground">{tactic.description ?? "Açıqlama yoxdur."} · Müəllif: {tactic.createdBy.name ?? tactic.createdBy.username}</p>
      </div>
      <TacticViewer tactic={tactic} />
      {tactic.canEdit ? <TacticSettings tactic={tactic} /> : null}
      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">Səhnələr</h2>
        {tactic.scenes.map((scene, index) => <article key={scene.id} className="rounded-xl border bg-card p-4"><strong>{index + 1}. {scene.name}</strong><p className="mt-1 text-sm text-muted-foreground">{scene.description ?? `${(scene.durationMs / 1000).toFixed(1)} saniyəlik taktiki mərhələ`}</p></article>)}
      </section>
    </section>
  );
}
