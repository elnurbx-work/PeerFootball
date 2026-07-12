"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMatchPlayerAction, removeMatchPlayerAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClubGuestDto, ClubMemberDto } from "@/types/club.types";
import type { MatchSideDto } from "@/types/match.types";
import { FOOTBALL_POSITIONS } from "@/lib/football-positions";

export function MatchPlayerSelector({ matchId, side, members, guests, canManage }: { matchId: string; side: MatchSideDto; members: ClubMemberDto[]; guests: ClubGuestDto[]; canManage: boolean }) {
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
    <div className="grid gap-2">{side.players.map((player) => <div key={player.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"><span>{player.user?.name ?? player.clubGuest?.fullName ?? player.guestName} · {player.position ?? "No position"} <span className="text-muted-foreground">({player.status})</span></span>{canManage ? <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => remove(player.id)}>Remove</Button> : null}</div>)}{!side.players.length ? <p className="text-sm text-muted-foreground">No players selected.</p> : null}</div>
    {canManage ? <form className="grid gap-2 border-t pt-3" onSubmit={submit}>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search registered guest player" /><Button type="button" variant="outline" onClick={searchPlayers}>Search</Button></div>
      <select name="playerChoice" className="h-10 rounded-md border bg-background px-3 text-sm" defaultValue="manual:" required><optgroup label="Club members">{members.map((member) => <option key={member.id} value={`user:${member.userId}`}>{member.user.name ?? member.user.username}</option>)}</optgroup>{players.length ? <optgroup label="Registered guest players">{players.map((player) => <option key={player.id} value={`user:${player.id}`}>{player.name ?? player.username}</option>)}</optgroup> : null}<optgroup label="Club guests">{guests.filter((guest) => guest.isActive).map((guest) => <option key={guest.id} value={`guest:${guest.id}`}>{guest.fullName}</option>)}</optgroup><option value="manual:">Manual guest name</option></select>
      <div className="grid gap-2 sm:grid-cols-3"><Input name="guestName" placeholder="Manual guest name" /><select name="position" defaultValue="" className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">Mövqe seç</option>{FOOTBALL_POSITIONS.map((position) => <option key={position} value={position}>{position}</option>)}</select><Input name="shirtNumber" type="number" min={1} max={99} placeholder="Shirt #" /></div>
      <Button className="w-fit" size="sm" disabled={pending}>Add player</Button>
    </form> : null}
    {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
  </div>;
}
