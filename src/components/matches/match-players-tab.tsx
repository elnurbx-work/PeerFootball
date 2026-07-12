"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MatchPlayerSelector } from "@/components/matches/match-player-selector";
import type { ClubGuestDto, ClubMemberDto } from "@/types/club.types";
import type { MatchSideDto } from "@/types/match.types";

export type MatchSideOptions = Record<string, { members: ClubMemberDto[]; guests: ClubGuestDto[]; canManage: boolean }>;
const filters = ["ALL", "GK", "DEF", "MID", "FWD"] as const;
export function MatchPlayersTab({ matchId, sides, options, editable }: { matchId: string; sides: MatchSideDto[]; options: MatchSideOptions; editable: boolean }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");
  return <div className="grid gap-5"><div className="flex flex-wrap gap-2">{filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1 text-xs ${filter === item ? "bg-primary text-primary-foreground" : "bg-background"}`}>{item === "ALL" ? "Hamısı" : item}</button>)}</div><div className="grid gap-5 lg:grid-cols-2">{sides.slice(0, 2).map((side, index) => { const clubId = side.clubId ?? ""; const sideOptions = options[clubId]; const filtered = { ...side, players: side.players.filter((player) => matchesFilter(player.position, filter)) }; return <div key={side.id} className="rounded-xl border p-4"><div className="mb-4 flex items-center gap-2"><i className={`h-3 w-3 rounded-full ${index === 0 ? "bg-blue-600" : "bg-red-600"}`} /><h3 className="font-semibold">{side.name}</h3><Badge variant="secondary">{side.players.length}</Badge></div><MatchPlayerSelector matchId={matchId} side={filtered} members={sideOptions?.members ?? []} guests={sideOptions?.guests ?? []} canManage={Boolean(editable && sideOptions?.canManage)} /></div>; })}</div></div>;
}
function matchesFilter(position: string | null, filter: (typeof filters)[number]) { if (filter === "ALL") return true; if (filter === "GK") return position === "GK"; if (filter === "DEF") return ["CB", "LB", "RB", "LWB", "RWB"].includes(position ?? ""); if (filter === "MID") return ["CDM", "CM", "CAM", "LM", "RM"].includes(position ?? ""); return ["LW", "RW", "CF", "ST"].includes(position ?? ""); }
