"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, Copy, Trash2 } from "lucide-react";
import { archiveTacticAction, deleteTacticAction, duplicateTacticAction, updateTacticVisibilityAction } from "@/actions/tactic.actions";
import { Button } from "@/components/ui/button";
import type { TacticDetailDto } from "@/types/tactic.types";

export function TacticSettings({ tactic }: { tactic: TacticDetailDto }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <section className="grid gap-3 rounded-xl border bg-card p-4">
      <h2 className="font-semibold">Taktika ayarları</h2>
      <div className="flex flex-wrap gap-2">
        <select
          defaultValue={tactic.visibility}
          disabled={pending}
          onChange={(event) => startTransition(async () => {
            const result = await updateTacticVisibilityAction({ tacticId: tactic.id, visibility: event.target.value });
            setMessage(result.message);
            if (result.ok) router.refresh();
          })}
          className="h-10 rounded-md border bg-background px-3 text-sm"
          aria-label="Taktikanın görünürlüyü"
        >
          <option value="PRIVATE">Yalnız müəllif</option>
          <option value="COACHING_STAFF">Məşqçi heyəti</option>
          <option value="TEAM_MEMBERS">Klub üzvləri</option>
          <option value="PUBLIC">Hamı</option>
        </select>
        <Button variant="outline" disabled={pending} onClick={() => startTransition(async () => { const result = await duplicateTacticAction({ tacticId: tactic.id }); setMessage(result.message); if (result.ok && result.data) router.push(`/tactics/${result.data.tacticId}`); })}><Copy className="h-4 w-4" />Duplicate</Button>
        <Button variant="outline" disabled={pending} onClick={() => startTransition(async () => { const result = await archiveTacticAction({ tacticId: tactic.id }); setMessage(result.message); if (result.ok) router.refresh(); })}><Archive className="h-4 w-4" />{tactic.status === "ARCHIVED" ? "Bərpa et" : "Arxivləşdir"}</Button>
        {tactic.status === "ARCHIVED" ? <Button variant="destructive" disabled={pending} onClick={() => {
          if (!window.confirm("Taktikanı tam silmək istədiyinizə əminsiniz?")) return;
          startTransition(async () => { const result = await deleteTacticAction({ tacticId: tactic.id }); setMessage(result.message); if (result.ok) router.push(`/clubs/${tactic.club.slug}/lineups/${tactic.lineupPlanId}?tab=tactics`); });
        }}><Trash2 className="h-4 w-4" />Sil</Button> : null}
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </section>
  );
}
