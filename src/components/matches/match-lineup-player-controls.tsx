"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateClubMatchLineupAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { FOOTBALL_POSITIONS } from "@/lib/football-positions";
import type { MatchPlayerDto } from "@/types/match.types";
import { useI18n } from "@/components/i18n/i18n-provider";

export function MatchLineupPlayerControls({ player }: { player: MatchPlayerDto }) {
  const { t } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    startTransition(async () => {
      const result = await updateClubMatchLineupAction({
        ...values,
        matchPlayerId: player.id,
        isCaptain: values.isCaptain === "on",
        isGoalkeeper: values.isGoalkeeper === "on",
        shirtNumber: values.shirtNumber || undefined,
        position: values.position || undefined
      });
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  return <form className="mt-2 grid gap-2 rounded-md bg-secondary/40 p-2 sm:grid-cols-2" onSubmit={submit}>
    <select name="lineupRole" defaultValue={player.lineupRole} className="h-9 rounded-md border bg-background px-2 text-xs">
      {lineupRoles.map((role) => <option key={role} value={role}>{role}</option>)}
    </select>
    <select name="position" defaultValue={player.position ?? ""} className="h-9 rounded-md border bg-background px-2 text-xs">
      <option value="">{t("matches.playerSelector.selectPosition")}</option>
      {FOOTBALL_POSITIONS.map((position) => <option key={position} value={position}>{position}</option>)}
    </select>
    <input name="shirtNumber" type="number" min={1} max={99} defaultValue={player.shirtNumber ?? ""} className="h-9 rounded-md border bg-background px-2 text-xs" placeholder={t("matches.playerSelector.shirtNumber")} />
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <label className="flex items-center gap-1"><input name="isCaptain" type="checkbox" defaultChecked={player.isCaptain} />{captainLabel}</label>
      <label className="flex items-center gap-1"><input name="isGoalkeeper" type="checkbox" defaultChecked={player.isGoalkeeper} />{goalkeeperLabel}</label>
    </div>
    <Button size="sm" disabled={pending}>{t("common.save")}</Button>
    {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
  </form>;
}

const lineupRoles = ["STARTER", "SUBSTITUTE"] as const;
const captainLabel = "C";
const goalkeeperLabel = "GK";
