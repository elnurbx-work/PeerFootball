"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLineupPlanAction } from "@/actions/tactic.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FORMATION_PRESETS, PLAYER_COUNTS } from "@/lib/tactics/formations";

export function CreateLineupForm({ clubId, slug }: { clubId: string; slug: string }) {
  const router = useRouter();
  const [playerCount, setPlayerCount] = useState(11);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const formations = FORMATION_PRESETS[playerCount] ?? [];

  return (
    <form
      className="grid max-w-2xl gap-4 rounded-xl border bg-card p-5 sm:p-7"
      onSubmit={(event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.currentTarget));
        startTransition(async () => {
          const result = await createLineupPlanAction({ ...values, clubId });
          setMessage(result.message);
          if (result.ok && result.data) router.push(`/clubs/${slug}/lineups/${result.data.lineupPlanId}`);
        });
      }}
    >
      <label className="grid gap-1 text-sm">Ad<Input name="name" required minLength={2} maxLength={100} placeholder="Əsas heyət" /></label>
      <label className="grid gap-1 text-sm">Açıqlama<textarea name="description" maxLength={500} className="min-h-24 rounded-md border bg-background p-3 text-sm" /></label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1 text-sm">Oyunçu sayı
          <select name="playerCount" value={playerCount} onChange={(event) => setPlayerCount(Number(event.target.value))} className="h-10 rounded-md border bg-background px-3">
            {PLAYER_COUNTS.map((count) => <option key={count} value={count}>{count}v{count}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">Düzülüş
          <select key={playerCount} name="formationCode" className="h-10 rounded-md border bg-background px-3">
            {formations.map((formation) => <option key={formation} value={formation}>{formation}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">Meydan
          <select name="pitchType" defaultValue="FULL" className="h-10 rounded-md border bg-background px-3">
            <option value="FULL">Tam meydan</option>
            <option value="HALF">Yarım meydan</option>
            <option value="SMALL">Kiçik meydan</option>
          </select>
        </label>
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Yaradılır..." : "Heyət planını yarat"}</Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
