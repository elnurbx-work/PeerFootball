import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { LineupActions } from "@/components/tactics/lineup-actions";
import { LineupEditor } from "@/components/tactics/lineup-editor";
import { TacticCard } from "@/components/tactics/tactic-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getClubMembers } from "@/server/queries/club.queries";
import { getLineupPlanDetail } from "@/server/queries/tactic.queries";

const tabs = [
  ["lineup", "Heyət"],
  ["tactics", "Taktikalar"],
  ["training", "Məşqlər"],
  ["matches", "Matçlar"],
  ["settings", "Ayarlar"]
] as const;

export default async function LineupDetailPage({ params, searchParams }: { params: Promise<{ slug: string; lineupId: string }>; searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  const { slug, lineupId } = await params;
  const plan = await getLineupPlanDetail(lineupId, user.id);
  if (!plan || plan.club.slug !== decodeURIComponent(slug)) notFound();
  const activeTab = (await searchParams).tab ?? "lineup";
  const members = activeTab === "lineup" ? await getClubMembers(plan.clubId) : [];

  return (
    <section className="mx-auto grid max-w-[1500px] gap-6 px-3 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost"><Link href={`/clubs/${plan.club.slug}/lineups`}><ArrowLeft className="h-4 w-4" />Heyət planları</Link></Button>
        {plan.canEdit ? <Button asChild><Link href={`/clubs/${plan.club.slug}/lineups/${plan.id}/tactics/new`}><Plus className="h-4 w-4" />Yeni taktika</Link></Button> : null}
      </div>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border bg-card font-bold">{plan.club.logoUrl ? <img src={plan.club.logoUrl} alt="" className="h-full w-full object-cover" /> : plan.club.name.charAt(0)}</span>
        <div><h1 className="text-2xl font-bold sm:text-3xl">{plan.name} · {plan.formationCode}</h1><p className="text-sm text-muted-foreground">{plan.playerCount} oyunçu · {plan.pitchType}</p></div>
      </div>
      <nav className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(([value, label]) => <Button key={value} asChild size="sm" variant={activeTab === value ? "default" : "outline"}><Link href={`?tab=${value}`}>{label}</Link></Button>)}
      </nav>
      {activeTab === "lineup" ? <LineupEditor plan={plan} members={members} /> : null}
      {activeTab === "tactics" ? (
        plan.tactics.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{plan.tactics.map((tactic) => <TacticCard key={tactic.id} tactic={tactic} canEdit={plan.canEdit} />)}</div>
          : <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">Bu heyət planına bağlı taktika yoxdur.</div>
      ) : null}
      {activeTab === "training" ? <Placeholder text="Məşq modulu gələcək mərhələ üçün hazırlanıb; lazımsız boş inteqrasiya yaradılmayıb." /> : null}
      {activeTab === "matches" ? <Placeholder text="Taktikalar matç detail səhifəsindən konkret matça bağlana bilər." /> : null}
      {activeTab === "settings" && plan.canEdit ? <LineupActions plan={plan} backHref={`/clubs/${plan.club.slug}/lineups`} /> : null}
    </section>
  );
}

function Placeholder({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{text}</div>;
}
