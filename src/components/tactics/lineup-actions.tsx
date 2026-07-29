"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, Trash2 } from "lucide-react";
import { archiveLineupPlanAction, deleteLineupPlanAction, updateLineupPlanAction } from "@/actions/tactic.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FORMATION_PRESETS, PLAYER_COUNTS } from "@/lib/tactics/formations";
import type { LineupPlanDetailDto } from "@/types/tactic.types";

export function LineupActions({ plan, backHref }: { plan: LineupPlanDetailDto; backHref: string }) {
  const router = useRouter();
  const [playerCount, setPlayerCount] = useState(plan.playerCount);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const lineupPlanId = plan.id;
  return (
    <div className="grid gap-5 rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Heyət planı ayarları</h2>
      <form className="grid max-w-2xl gap-3" onSubmit={(event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.currentTarget));
        startTransition(async () => {
          const result = await updateLineupPlanAction({ ...values, lineupPlanId });
          setMessage(result.message);
          if (result.ok) router.refresh();
        });
      }}>
        <label className="grid gap-1 text-sm">Ad<Input name="name" defaultValue={plan.name} required /></label>
        <label className="grid gap-1 text-sm">Açıqlama<textarea name="description" defaultValue={plan.description ?? ""} className="min-h-20 rounded-md border bg-background p-3 text-sm" /></label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-sm">Oyunçu sayı
            <select name="playerCount" value={playerCount} onChange={(event) => setPlayerCount(Number(event.target.value))} className="h-10 rounded-md border bg-background px-3">
              {PLAYER_COUNTS.map((count) => <option key={count} value={count}>{count}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">Düzülüş
            <select key={playerCount} name="formationCode" defaultValue={playerCount === plan.playerCount ? plan.formationCode : undefined} className="h-10 rounded-md border bg-background px-3">
              {(FORMATION_PRESETS[playerCount] ?? []).map((formation) => <option key={formation}>{formation}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">Meydan
            <select name="pitchType" defaultValue={plan.pitchType} className="h-10 rounded-md border bg-background px-3">
              <option value="FULL">Tam</option><option value="HALF">Yarım</option><option value="SMALL">Kiçik</option>
            </select>
          </label>
        </div>
        <Button className="w-fit" disabled={pending}>Ayarları saxla</Button>
      </form>
      <p className="text-sm text-muted-foreground">Bağlı taktika varsa plan silinməyəcək; təhlükəsiz seçim arxivləşdirməkdir.</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={pending} onClick={() => startTransition(async () => { const result = await archiveLineupPlanAction({ lineupPlanId }); setMessage(result.message); if (result.ok) router.refresh(); })}><Archive className="h-4 w-4" />Arxivləşdir</Button>
        <Button variant="destructive" disabled={pending} onClick={() => {
          if (!window.confirm("Bu heyət planını silmək istədiyinizə əminsiniz?")) return;
          startTransition(async () => {
            const result = await deleteLineupPlanAction({ lineupPlanId });
            setMessage(result.message);
            if (result.ok) router.push(backHref);
          });
        }}><Trash2 className="h-4 w-4" />Sil</Button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
