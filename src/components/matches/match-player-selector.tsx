"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMatchPlayerAction, removeMatchPlayerAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClubGuestDto, ClubMemberDto } from "@/types/club.types";
import type { MatchSideDto } from "@/types/match.types";
import { FOOTBALL_POSITIONS } from "@/lib/football-positions";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { Translate } from "@/i18n/dictionary";

export function MatchPlayerSelector({ matchId, side, members, guests, canManage }: { matchId: string; side: MatchSideDto; members: ClubMemberDto[]; guests: ClubGuestDto[]; canManage: boolean }) {
  const { t } = useI18n();
  const router = useRouter(); const [message, setMessage] = useState(""); const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<Array<{ id: string; name: string | null; username: string | null }>>([]);
  async function searchPlayers() {
    if (search.trim().length < 2) return;
    const response = await fetch(`/api/clubs/player-search?q=${encodeURIComponent(search.trim())}`);
    const data = await response.json().catch(() => null) as { ok?: boolean; players?: Array<{ id: string; name: string | null; username: string | null }> } | null;
    setPlayers(data?.ok ? data.players ?? [] : []);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form));
    const [kind, id] = String(values.playerChoice).split(":");
    const payload = { matchId, matchSideId: side.id, position: values.position, shirtNumber: values.shirtNumber || undefined, ...(kind === "user" ? { userId: id } : kind === "guest" ? { clubGuestId: id } : { guestName: values.guestName }) };
    startTransition(async () => { const result = await addMatchPlayerAction(payload); setMessage(result.message); if (result.ok) { form.reset(); router.refresh(); } });
  }
  function remove(id: string) { startTransition(async () => { const result = await removeMatchPlayerAction(id); setMessage(result.message); if (result.ok) router.refresh(); }); }
  return <div className="grid gap-3">
    <div className="grid gap-2">{side.players.map((player) => <div key={player.id} className="flex min-w-0 items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"><span className="min-w-0 break-words">{player.user?.name ?? player.clubGuest?.fullName ?? player.guestName} · {player.position ?? t("matches.playerSelector.noPosition")} <span className="text-muted-foreground">({getStatusLabel(player.status, t)})</span></span>{canManage ? <Button className="shrink-0" type="button" size="sm" variant="ghost" disabled={pending} onClick={() => remove(player.id)}>{t("matches.playerSelector.remove")}</Button> : null}</div>)}{!side.players.length ? <p className="text-sm text-muted-foreground">{t("matches.playerSelector.empty")}</p> : null}</div>
    {canManage ? <form className="grid gap-2 border-t pt-3" onSubmit={submit}>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("matches.playerSelector.searchPlaceholder")} /><Button type="button" variant="outline" onClick={searchPlayers}>{t("matches.playerSelector.search")}</Button></div>
      <select name="playerChoice" className="h-10 min-w-0 w-full rounded-md border bg-background px-3 text-sm" defaultValue="manual:" required><optgroup label={t("matches.playerSelector.clubMembers")}>{members.map((member) => <option key={member.id} value={`user:${member.userId}`}>{member.user.name ?? member.user.username}</option>)}</optgroup>{players.length ? <optgroup label={t("matches.playerSelector.registeredGuests")}>{players.map((player) => <option key={player.id} value={`user:${player.id}`}>{player.name ?? player.username}</option>)}</optgroup> : null}<optgroup label={t("matches.playerSelector.clubGuests")}>{guests.filter((guest) => guest.isActive).map((guest) => <option key={guest.id} value={`guest:${guest.id}`}>{guest.fullName}</option>)}</optgroup><option value="manual:">{t("matches.playerSelector.manualGuest")}</option></select>
      <div className="grid gap-2 sm:grid-cols-3"><Input name="guestName" placeholder={t("matches.playerSelector.manualGuest")} /><select name="position" defaultValue="" className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">{t("matches.playerSelector.selectPosition")}</option>{FOOTBALL_POSITIONS.map((position) => <option key={position} value={position}>{position}</option>)}</select><Input name="shirtNumber" type="number" min={1} max={99} placeholder={t("matches.playerSelector.shirtNumber")} /></div>
      <Button className="w-fit" size="sm" disabled={pending}>{t("matches.playerSelector.add")}</Button>
    </form> : null}
    {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
  </div>;
}

function getStatusLabel(status: string, t: Translate) {
  if (status === "SELECTED") return t("matches.playerSelector.statusSelected");
  if (status === "INVITED") return t("matches.playerSelector.statusInvited");
  if (status === "ACCEPTED") return t("matches.playerSelector.statusAccepted");
  if (status === "DECLINED") return t("matches.playerSelector.statusDeclined");
  if (status === "REMOVED") return t("matches.playerSelector.statusRemoved");
  return status;
}
