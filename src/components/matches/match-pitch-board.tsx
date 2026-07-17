"use client";

import type { FootballPosition } from "@prisma/client";
import { useEffect, useMemo, useRef, useState, useTransition, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { Move } from "lucide-react";
import { updateMatchPlayerPositionAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchGoalDto, MatchPlayerDto, MatchSideDto } from "@/types/match.types";
import { useI18n } from "@/components/i18n/i18n-provider";

type MatchPitchBoardProps = {
  sides: MatchSideDto[];
  goals: MatchGoalDto[];
  manageableSideIds: string[];
};

type Point = { x: number; y: number };
type DragPoint = Point & { position?: FootballPosition };

const positionPoints: Record<FootballPosition, Point> = {
  GK: { x: 7, y: 50 },
  LB: { x: 20, y: 18 },
  CB: { x: 20, y: 50 },
  RB: { x: 20, y: 82 },
  LWB: { x: 27, y: 15 },
  RWB: { x: 27, y: 85 },
  CDM: { x: 30, y: 50 },
  LM: { x: 36, y: 18 },
  CM: { x: 36, y: 50 },
  RM: { x: 36, y: 82 },
  CAM: { x: 41, y: 50 },
  LW: { x: 45, y: 18 },
  RW: { x: 45, y: 82 },
  CF: { x: 44, y: 50 },
  ST: { x: 47, y: 50 },
  OTHER: { x: 35, y: 50 }
};

const snapPositions = (Object.keys(positionPoints) as FootballPosition[]).filter(
  (position) => position !== "OTHER"
);

export function MatchPitchBoard({ sides, goals, manageableSideIds }: MatchPitchBoardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pitchRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [draggingId, setDraggingId] = useState<string>();
  const [dragPoints, setDragPoints] = useState<Record<string, DragPoint>>({});
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const goalCountByPlayer = getGoalCountByPlayer(goals, sides);
  const positionSignature = useMemo(
    () => sides.flatMap((side) => side.players.map((player) => `${player.id}:${player.position}`)).join("|"),
    [sides]
  );

  useEffect(() => {
    setDragPoints({});
    setDraggingId(undefined);
  }, [positionSignature]);

  function pointerPoint(event: PointerEvent<HTMLButtonElement>) {
    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 4, 96),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 7, 93)
    };
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>, player: MatchPlayerDto) {
    if (!editing || !manageableSideIds.includes(player.matchSideId)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingId(player.id);
    const point = pointerPoint(event);
    if (point) setDragPoints((current) => ({ ...current, [player.id]: point }));
  }

  function movePlayer(event: PointerEvent<HTMLButtonElement>, player: MatchPlayerDto) {
    if (draggingId !== player.id) return;
    event.preventDefault();
    const point = pointerPoint(event);
    if (point) setDragPoints((current) => ({ ...current, [player.id]: point }));
  }

  function finishDrag(
    event: PointerEvent<HTMLButtonElement>,
    player: MatchPlayerDto,
    sideIndex: number
  ) {
    if (draggingId !== player.id) return;
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const point = pointerPoint(event) ?? dragPoints[player.id];
    setDraggingId(undefined);
    if (!point) return;

    const position = getNearestPosition(point, sideIndex);
    setDragPoints((current) => ({
      ...current,
      [player.id]: { ...toDisplayPoint(positionPoints[position], sideIndex), position }
    }));
    setMessage(t("matches.pitch.savingPosition", { player: getPlayerName(player), position }));

    startTransition(async () => {
      const result = await updateMatchPlayerPositionAction({
        matchPlayerId: player.id,
        position
      });
      setMessage(result.message);
      if (result.ok) {
        router.refresh();
      } else {
        setDragPoints((current) => removeKey(current, player.id));
      }
    });
  }

  function cancelDrag(playerId: string) {
    setDraggingId(undefined);
    setDragPoints((current) => removeKey(current, playerId));
  }

  function toggleEditing() {
    setEditing((current) => !current);
    setDraggingId(undefined);
    setDragPoints({});
    setMessage("");
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
        <div className="grid gap-3 sm:flex sm:items-start sm:justify-between">
          <div>
            <CardTitle>{t("matches.pitch.title")}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {editing
                ? t("matches.pitch.editDescription")
                : t("matches.pitch.description")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {manageableSideIds.length ? (
              <Button
                type="button"
                size="sm"
                variant={editing ? "default" : "outline"}
                onClick={toggleEditing}
                disabled={pending}
              >
                <Move className="h-4 w-4" aria-hidden="true" />
                {editing ? t("matches.pitch.finishEdit") : t("matches.pitch.edit")}
              </Button>
            ) : null}
            <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <TeamLegend color="bg-blue-600" name={sides[0]?.name ?? t("matches.common.teamA")} />
              <TeamLegend color="bg-red-600" name={sides[1]?.name ?? t("matches.common.teamB")} />
            </div>
          </div>
        </div>
        {message ? <p className="text-xs font-medium text-primary">{message}</p> : null}
      </CardHeader>

      <CardContent className="p-3 pt-0 sm:p-5 sm:pt-0">
        <div
          ref={pitchRef}
          className={`relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-lg border-2 border-white/80 bg-emerald-700 shadow-inner sm:aspect-[16/9] sm:min-h-[360px] sm:rounded-xl sm:border-4 lg:min-h-[460px] ${
            editing ? "ring-2 ring-primary ring-offset-2" : ""
          }`}
          role="group"
          aria-label={t("matches.pitch.ariaLabel")}
        >
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(255,255,255,0.18)_50%,transparent_50%)] [background-size:12.5%_100%]" aria-hidden="true" />
          <PitchLines />

          {sides.slice(0, 2).flatMap((side, sideIndex) =>
            side.players.map((player, index) => {
              const defaultPoint = getPlayerPoint(player, index, side.players, sideIndex);
              const point = dragPoints[player.id] ?? defaultPoint;
              const displayPosition = dragPoints[player.id]?.position ?? player.position;
              const name = getPlayerName(player);
              const goalCount = goalCountByPlayer.get(player.id) ?? 0;
              const draggable = editing && manageableSideIds.includes(side.id);
              const isDragging = draggingId === player.id;

              return (
                <div
                  key={player.id}
                  className="absolute w-[4.5rem] -translate-x-1/2 -translate-y-1/2 text-center sm:w-24"
                  style={{ left: `${point.x}%`, top: `${point.y}%`, zIndex: isDragging ? 30 : 10 }}
                  title={t("matches.pitch.playerTitle", { name, position: displayPosition ?? t("matches.pitch.noPosition"), goals: goalCount ? ` · ${t("matches.goals.goalCount", { count: goalCount })}` : "" })}
                >
                  <div className="relative mx-auto w-fit">
                    <button
                      type="button"
                      className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 bg-slate-900 text-[10px] font-bold text-white shadow-lg ring-2 ring-white/80 transition sm:h-14 sm:w-14 sm:text-sm ${
                        sideIndex === 0 ? "border-blue-500" : "border-red-500"
                      } ${draggable ? "touch-none cursor-grab hover:scale-110 hover:ring-yellow-300 active:cursor-grabbing" : "cursor-default"} ${
                        isDragging ? "scale-110 ring-yellow-300" : ""
                      }`}
                      aria-label={t("matches.pitch.playerAriaLabel", { name, position: displayPosition ?? t("matches.pitch.withoutPosition"), dragHint: draggable ? `, ${t("matches.pitch.dragHint")}` : "" })}
                      onPointerDown={(event) => startDrag(event, player)}
                      onPointerMove={(event) => movePlayer(event, player)}
                      onPointerUp={(event) => finishDrag(event, player, sideIndex)}
                      onPointerCancel={() => cancelDrag(player.id)}
                    >
                      {player.user?.image ? (
                        <img src={player.user.image} alt="" className="pointer-events-none h-full w-full object-cover" />
                      ) : (
                        player.shirtNumber ?? getInitials(name)
                      )}
                    </button>

                    {goalCount ? (
                      <span className="pointer-events-none absolute -bottom-1 -right-2 flex min-h-4 min-w-4 items-center justify-center whitespace-nowrap rounded-full border border-emerald-950/20 bg-white px-0.5 text-[8px] font-black leading-none text-slate-950 shadow-md sm:-bottom-1.5 sm:-right-3 sm:min-h-5 sm:min-w-5 sm:px-1 sm:text-[10px]">
                        ⚽{goalCount > 1 ? `×${goalCount}` : ""}
                      </span>
                    ) : null}
                    <span className="pointer-events-none absolute -left-1 -top-1 rounded bg-slate-950/85 px-1 text-[7px] font-bold leading-3 text-white sm:-left-2 sm:text-[9px] sm:leading-4">
                      {displayPosition ?? "?"}
                    </span>
                  </div>
                  <span className="pointer-events-none mx-auto mt-1 block max-w-full truncate rounded bg-black/65 px-1 py-0.5 text-[8px] font-medium text-white shadow-sm sm:px-1.5 sm:text-xs">
                    {name}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TeamLegend({ color, name }: { color: string; name: string }) {
  return <span className="flex min-w-0 items-center gap-1"><i className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} /><span className="truncate">{name}</span></span>;
}

function PitchLines() {
  return <div className="pointer-events-none absolute inset-0" aria-hidden="true"><div className="absolute inset-3 rounded border-2 border-white/70" /><div className="absolute inset-y-3 left-1/2 border-l-2 border-white/70" /><div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70 sm:h-28 sm:w-28" /><div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" /><div className="absolute bottom-[28%] left-3 top-[28%] w-[15%] border-2 border-l-0 border-white/70" /><div className="absolute bottom-[28%] right-3 top-[28%] w-[15%] border-2 border-r-0 border-white/70" /><div className="absolute bottom-[40%] left-3 top-[40%] w-[6%] border-2 border-l-0 border-white/70" /><div className="absolute bottom-[40%] right-3 top-[40%] w-[6%] border-2 border-r-0 border-white/70" /></div>;
}

function getPlayerPoint(player: MatchPlayerDto, playerIndex: number, players: MatchPlayerDto[], sideIndex: number) {
  const position = player.position ?? "OTHER";
  const base = positionPoints[position];
  const samePosition = players.filter((item) => (item.position ?? "OTHER") === position);
  const occurrence = players.slice(0, playerIndex).filter((item) => (item.position ?? "OTHER") === position).length;
  const y = clamp(base.y + (occurrence - (samePosition.length - 1) / 2) * 10, 9, 91);
  return toDisplayPoint({ x: base.x, y }, sideIndex);
}

function getNearestPosition(displayPoint: Point, sideIndex: number) {
  const point = sideIndex === 0
    ? displayPoint
    : { x: 100 - displayPoint.x, y: 100 - displayPoint.y };

  return snapPositions.reduce((nearest, position) => {
    const target = positionPoints[position];
    const currentTarget = positionPoints[nearest];
    const distance = (point.x - target.x) ** 2 + (point.y - target.y) ** 2;
    const currentDistance = (point.x - currentTarget.x) ** 2 + (point.y - currentTarget.y) ** 2;
    return distance < currentDistance ? position : nearest;
  }, snapPositions[0]);
}

function toDisplayPoint(point: Point, sideIndex: number) {
  return sideIndex === 0 ? point : { x: 100 - point.x, y: 100 - point.y };
}

function getGoalCountByPlayer(goals: MatchGoalDto[], sides: MatchSideDto[]) {
  const counts = new Map<string, number>();
  for (const goal of goals) {
    let playerId = goal.matchPlayerId;
    if (!playerId) {
      playerId = sides.find((side) => side.id === goal.matchSideId)?.players.find((player) => getPlayerName(player) === goal.playerName)?.id ?? null;
    }
    if (playerId) counts.set(playerId, (counts.get(playerId) ?? 0) + 1);
  }
  return counts;
}

function getPlayerName(player: MatchPlayerDto) {
  return player.user?.name ?? player.user?.username ?? player.clubGuest?.fullName ?? player.guestName ?? "Oyunçu";
}

function getInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function removeKey<T>(record: Record<string, T>, key: string) {
  const next = { ...record };
  delete next[key];
  return next;
}
