"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMatchGoalAction, deleteMatchGoalAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MatchGoalDto, MatchSideDto } from "@/types/match.types";
import { useI18n } from "@/components/i18n/i18n-provider";

type MatchGoalsListProps = {
  goals: MatchGoalDto[];
  sides: MatchSideDto[];
  manageableSideIds: string[];
  onMinuteClick?: (minute: number, extraMinute?: number) => void;
};

export function MatchGoalsList({
  goals,
  sides,
  manageableSideIds,
  onMinuteClick
}: MatchGoalsListProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const manageableSides = sides.filter((side) => manageableSideIds.includes(side.id));
  const [selectedSideId, setSelectedSideId] = useState(manageableSides[0]?.id ?? "");
  const selectedSide = sides.find((side) => side.id === selectedSideId);
  const selectablePlayers =
    selectedSide?.players.filter((player) =>
      ["SELECTED", "INVITED", "ACCEPTED"].includes(player.status)
    ) ?? [];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const side = sides.find((item) => item.id === values.matchSideId);

    startTransition(async () => {
      const result = await addMatchGoalAction({
        ...values,
        matchId: side?.matchId,
        minute: values.minute || undefined,
        extraMinute: values.extraMinute || undefined
      });
      setMessage(result.message);
      if (result.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteMatchGoalAction(id);
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="grid min-w-0 gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("matches.goals.title")}
      </p>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        {sides.slice(0, 2).map((side) => {
          const sideGoals = goals.filter((goal) => goal.matchSideId === side.id);

          return (
            <div key={side.id} className="min-w-0">
              <p className="mb-1 truncate text-xs font-semibold">
                {side.name} · {t("matches.goals.goalCount", { count: sideGoals.length })}
              </p>
              <div className="grid gap-1">
                {sideGoals.map((goal) => (
                  <div key={goal.id} className="flex min-w-0 items-center gap-2 text-sm">
                    {goal.minute ? (
                      <button
                        type="button"
                        className="w-12 shrink-0 text-left font-medium text-primary hover:underline"
                        title={t("matches.goals.jumpToMinute")}
                        onClick={() => onMinuteClick?.(goal.minute!, goal.extraMinute ?? 0)}
                      >
                        {goal.minute}{goal.extraMinute ? `+${goal.extraMinute}` : ""}’
                      </button>
                    ) : (
                      <span className="w-12 shrink-0 text-muted-foreground">—</span>
                    )}
                    <span className="min-w-0 flex-1 truncate">{goal.playerName}</span>
                    {manageableSideIds.includes(side.id) ? (
                      <button
                        type="button"
                        className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
                        disabled={pending}
                        onClick={() => remove(goal.id)}
                      >
                        {t("matches.goals.delete")}
                      </button>
                    ) : null}
                  </div>
                ))}
                {!sideGoals.length ? (
                  <p className="text-xs text-muted-foreground">{t("matches.goals.empty")}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {manageableSides.length ? (
        <form
          className="grid min-w-0 gap-2 border-t pt-3 sm:grid-cols-2 2xl:grid-cols-[110px_minmax(0,1fr)_70px_70px_auto]"
          onSubmit={submit}
        >
          <label className="grid min-w-0 gap-1 text-xs text-muted-foreground">
            <span>{t("matches.goals.team")}</span>
            <select
              name="matchSideId"
              value={selectedSideId}
              onChange={(event) => setSelectedSideId(event.target.value)}
              className="h-9 min-w-0 w-full rounded-md border bg-background px-2 text-sm text-foreground"
              required
            >
              {manageableSides.map((side) => (
                <option key={side.id} value={side.id}>{side.name}</option>
              ))}
            </select>
          </label>

          <label className="grid min-w-0 gap-1 text-xs text-muted-foreground">
            <span>{t("matches.goals.scorer")}</span>
            <select
              key={selectedSideId}
              name="matchPlayerId"
              className="h-9 min-w-0 w-full rounded-md border bg-background px-2 text-sm text-foreground"
              required
              disabled={!selectablePlayers.length}
              defaultValue=""
            >
              <option value="" disabled>
                {selectablePlayers.length ? t("matches.goals.selectPlayer") : t("matches.goals.noActivePlayer")}
              </option>
              {selectablePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {getPlayerName(player, t("matches.goals.unnamedPlayer"))}{player.shirtNumber ? ` · #${player.shirtNumber}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="grid min-w-0 gap-1 text-xs text-muted-foreground">
            <span>{t("matches.goals.minute")}</span>
            <Input className="min-w-0" name="minute" type="number" min={1} max={150} placeholder="67" />
          </label>
          <label className="grid min-w-0 gap-1 text-xs text-muted-foreground">
            <span>{t("matches.goals.extraMinute")}</span>
            <Input className="min-w-0" name="extraMinute" type="number" min={0} max={15} placeholder="2" />
          </label>
          <Button
            className="self-end sm:col-span-2 2xl:col-span-1"
            size="sm"
            disabled={pending || !selectablePlayers.length}
          >
            {t("matches.goals.add")}
          </Button>
        </form>
      ) : null}

      {message ? <p className="break-words text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}

function getPlayerName(player: MatchSideDto["players"][number], fallback: string) {
  return (
    player.user?.name ??
    player.user?.username ??
    player.clubGuest?.fullName ??
    player.guestName ??
    fallback
  );
}
