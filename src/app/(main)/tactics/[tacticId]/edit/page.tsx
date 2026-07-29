import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TacticEditor } from "@/components/tactics/tactic-editor";
import { getCurrentUser } from "@/lib/auth";
import { getTacticDetail } from "@/server/queries/tactic.queries";

export default async function TacticEditPage({ params }: { params: Promise<{ tacticId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const { tacticId } = await params;
  const tactic = await getTacticDetail(tacticId, user.id);
  if (!tactic || !tactic.canEdit || tactic.status === "ARCHIVED") notFound();
  return (
    <section className="mx-auto grid max-w-[1700px] gap-4 px-2 py-4 sm:px-4 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost"><Link href={`/tactics/${tactic.id}`}><ArrowLeft className="h-4 w-4" />Viewer</Link></Button>
        <div className="min-w-0 text-right"><h1 className="truncate font-bold">{tactic.name}</h1><p className="text-xs text-muted-foreground">{tactic.lineupPlan.name} · {tactic.lineupPlan.formationCode}</p></div>
      </div>
      <TacticEditor tactic={tactic} />
    </section>
  );
}
