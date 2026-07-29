"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { attachTacticToMatchAction, detachTacticFromMatchAction } from "@/actions/tactic.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TacticListItemDto } from "@/types/tactic.types";

export function MatchTacticsPanel({ matchId, selected, available, canManage }: {
  matchId: string;
  selected: TacticListItemDto[];
  available: TacticListItemDto[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [choice, setChoice] = useState(available.find((item) => !selected.some((selectedItem) => selectedItem.id === item.id))?.id ?? "");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const unselected = available.filter((item) => !selected.some((selectedItem) => selectedItem.id === item.id));
  return (
    <Card>
      <CardHeader><CardTitle>Matç taktikaları</CardTitle></CardHeader>
      <CardContent className="grid gap-4">
        {selected.length ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {selected.map((tactic) => (
              <div key={tactic.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <div className="min-w-0"><Link href={`/tactics/${tactic.id}`} className="truncate text-sm font-semibold hover:underline">{tactic.name}</Link><Badge variant="secondary" className="ml-2">{tactic.category}</Badge></div>
                {canManage ? <Button size="sm" variant="ghost" disabled={pending} onClick={() => startTransition(async () => { const result = await detachTacticFromMatchAction({ matchId, tacticId: tactic.id }); setMessage(result.message); if (result.ok) router.refresh(); })}>Ayır</Button> : null}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">Bu matça taktika bağlanmayıb.</p>}
        {canManage && unselected.length ? (
          <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
            <select value={choice} onChange={(event) => setChoice(event.target.value)} className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm">
              {unselected.map((tactic) => <option key={tactic.id} value={tactic.id}>{tactic.name} · {tactic.lineupPlan.formationCode}</option>)}
            </select>
            <Button disabled={pending || !choice} onClick={() => startTransition(async () => { const result = await attachTacticToMatchAction({ matchId, tacticId: choice }); setMessage(result.message); if (result.ok) router.refresh(); })}>Matça bağla</Button>
          </div>
        ) : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
