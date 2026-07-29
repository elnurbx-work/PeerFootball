"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMatchPlayerAction, removeMatchPlayerAction } from "@/actions/match.actions";
import { MatchLineupPlayerControls } from "@/components/matches/match-lineup-player-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClubGuestDto, ClubMemberDto } from "@/types/club.types";
import type { MatchSideDto } from "@/types/match.types";
import { FOOTBALL_POSITIONS } from "@/lib/football-positions";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { Translate } from "@/i18n/dictionary";

export function MatchPlayerSelector({ matchId, side, members, guests, canManage, clubMatch }: {
  matchId: string;
  side: MatchSideDto;
  members: ClubMemberDto[];
  guests: ClubGuestDto[];
  canManage: boolean;
  clubMatch: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const activeGuests = guests.filter((guest) => guest.isActive);
  const firstChoice = members[0]
    ? `user:${members[0].userId}`
    : !clubMatch && activeGuests[0]
      ? `guest:${activeGuests[0].id}`
      : !clubMatch
        ? "manual:manual"
        : "";
  const [selectedChoice, setSelectedChoice] = useState(firstChoice);

  useEffect(() => {
    const choices = new Set([
      ...members.map((member) => `user:${member.userId}`),
      ...(!clubMatch ? activeGuests.map((guest) => `guest:${guest.id}`) : []),
      ...(!clubMatch ? ["manual:manual"] : [])
    ]);
    if (!choices.has(selectedChoice)) {
      setSelectedChoice(firstChoice);
    }
  }, [activeGuests, clubMatch, firstChoice, members, selectedChoice]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const [kind, id] = selectedChoice.split(":");
    if (!kind || !id) return;

    const payload = {
      matchId,
      matchSideId: side.id,
      position: values.position,
      shirtNumber: values.shirtNumber || undefined,
      lineupRole: values.lineupRole ?? "SUBSTITUTE",
      isCaptain: values.isCaptain === "on",
      isGoalkeeper: values.isGoalkeeper === "on",
      ...(kind === "user" ? { userId: id } : kind === "guest" ? { clubGuestId: id } : { guestName: values.guestName })
    };
    startTransition(async () => {
      const result = await addMatchPlayerAction(payload);
      setMessage(result.message);
      if (result.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await removeMatchPlayerAction(id);
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        {side.players.map((player) => {
          const name = player.user?.name ?? player.user?.username ?? player.clubGuest?.fullName ?? player.guestName ?? "Oyunçu";
          return (
            <div key={player.id} className="rounded-md border px-3 py-2 text-sm">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-secondary text-xs font-semibold">
                    {player.user?.image ? <img src={player.user.image} alt="" className="h-full w-full object-cover" /> : getInitials(name)}
                  </span>
                  <span className="min-w-0 break-words">
                    {name} · {player.position ?? t("matches.playerSelector.noPosition")}
                    {clubMatch ? ` · ${player.lineupRole}` : ""}
                    <span className="text-muted-foreground"> ({getStatusLabel(player.status, t)})</span>
                  </span>
                </div>
                {canManage ? (
                  <Button className="shrink-0" type="button" size="sm" variant="ghost" disabled={pending} onClick={() => remove(player.id)}>
                    {t("matches.playerSelector.remove")}
                  </Button>
                ) : null}
              </div>
              {canManage && clubMatch ? <MatchLineupPlayerControls player={player} /> : null}
            </div>
          );
        })}
        {!side.players.length ? <p className="text-sm text-muted-foreground">{t("matches.playerSelector.empty")}</p> : null}
      </div>

      {canManage ? (
        <form className="grid gap-2 border-t pt-3" onSubmit={submit}>
          <p className="text-xs font-medium text-muted-foreground">{t("matches.playerSelector.clubMembers")}</p>
          {members.length ? (
            <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {members.map((member) => {
                const choice = `user:${member.userId}`;
                const name = member.user.name ?? member.user.username ?? "Oyunçu";
                const selected = selectedChoice === choice;
                return (
                  <button
                    key={member.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedChoice(choice)}
                    className={`flex min-w-0 items-center gap-2 rounded-lg border p-2 text-left transition ${
                      selected ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:bg-secondary/60"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-semibold">
                      {member.user.image ? <img src={member.user.image} alt="" className="h-full w-full object-cover" /> : getInitials(name)}
                    </span>
                    <span className="min-w-0 truncate text-sm font-medium">{name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">{t("matches.playerSelector.empty")}</p>
          )}

          {!clubMatch ? (
            <>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{t("matches.playerSelector.clubGuests")}</p>
              <div className="flex flex-wrap gap-2">
                {activeGuests.map((guest) => {
                  const choice = `guest:${guest.id}`;
                  return (
                    <button
                      key={guest.id}
                      type="button"
                      aria-pressed={selectedChoice === choice}
                      onClick={() => setSelectedChoice(choice)}
                      className={`rounded-full border px-3 py-2 text-sm ${
                        selectedChoice === choice ? "border-primary bg-primary/10" : "hover:bg-secondary/60"
                      }`}
                    >
                      {guest.fullName}
                    </button>
                  );
                })}
                <button
                  type="button"
                  aria-pressed={selectedChoice === "manual:manual"}
                  onClick={() => setSelectedChoice("manual:manual")}
                  className={`rounded-full border px-3 py-2 text-sm ${
                    selectedChoice === "manual:manual" ? "border-primary bg-primary/10" : "hover:bg-secondary/60"
                  }`}
                >
                  {t("matches.playerSelector.manualGuest")}
                </button>
              </div>
            </>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-3">
            {!clubMatch && selectedChoice === "manual:manual" ? <Input name="guestName" required placeholder={t("matches.playerSelector.manualGuest")} /> : null}
            <select name="position" defaultValue="" className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">{t("matches.playerSelector.selectPosition")}</option>
              {FOOTBALL_POSITIONS.map((position) => <option key={position} value={position}>{position}</option>)}
            </select>
            <Input name="shirtNumber" type="number" min={1} max={99} placeholder={t("matches.playerSelector.shirtNumber")} />
          </div>

          {clubMatch ? (
            <div className="grid gap-2 sm:grid-cols-3">
              <select name="lineupRole" defaultValue="SUBSTITUTE" className="h-10 rounded-md border bg-background px-3 text-sm">
                {lineupRoles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm"><input name="isCaptain" type="checkbox" />{captainLabel}</label>
              <label className="flex items-center gap-2 text-sm"><input name="isGoalkeeper" type="checkbox" />{goalkeeperLabel}</label>
            </div>
          ) : null}

          <Button type="submit" className="w-fit" size="sm" disabled={pending || !selectedChoice}>
            {t("matches.playerSelector.add")}
          </Button>
        </form>
      ) : null}
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}

const lineupRoles = ["STARTER", "SUBSTITUTE"] as const;
const captainLabel = "C";
const goalkeeperLabel = "GK";

function getStatusLabel(status: string, t: Translate) {
  if (status === "SELECTED") return t("matches.playerSelector.statusSelected");
  if (status === "INVITED") return t("matches.playerSelector.statusInvited");
  if (status === "ACCEPTED") return t("matches.playerSelector.statusAccepted");
  if (status === "DECLINED") return t("matches.playerSelector.statusDeclined");
  if (status === "MAYBE") return status;
  if (status === "REMOVED") return t("matches.playerSelector.statusRemoved");
  return status;
}

function getInitials(value: string) {
  return value.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase() || "?";
}
