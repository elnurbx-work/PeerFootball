"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MatchPlayerSelector } from "@/components/matches/match-player-selector";
import type { ClubGuestDto, ClubMemberDto } from "@/types/club.types";
import type { MatchSideDto } from "@/types/match.types";
import { useI18n } from "@/components/i18n/i18n-provider";

export type MatchSideOptions = Record<string, { members: ClubMemberDto[]; guests: ClubGuestDto[]; canManage: boolean }>;
const filters = ["ALL", "GK", "DEF", "MID", "FWD"] as const;

export function MatchPlayersTab({ matchId, sides, options, editable, clubMatch }: {
  matchId: string;
  sides: MatchSideDto[];
  options: MatchSideOptions;
  editable: boolean;
  clubMatch: boolean;
}) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");
  const assignedUserIds = new Set(sides.flatMap((side) => side.players.flatMap((player) => player.userId ? [player.userId] : [])));
  return <div className="grid gap-5">
    <div className="flex flex-wrap gap-2">
      {filters.map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1 text-xs ${filter === item ? "bg-primary text-primary-foreground" : "bg-background"}`}>{item === "ALL" ? t("matches.players.all") : item}</button>)}
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      {sides.slice(0, 2).map((side, index) => {
        const clubId = side.clubId ?? "";
        const sideOptions = options[clubId];
        const filtered = { ...side, players: side.players.filter((player) => matchesFilter(player.position, filter)) };
        return <div key={side.id} className="rounded-xl border p-4">
          <div className="mb-4 flex items-center gap-2">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border text-sm font-bold ${index === 0 ? "bg-team-a/15" : "bg-team-b/15"}`}>
              {side.club?.logoUrl ? <img src={side.club.logoUrl} alt="" className="h-full w-full object-cover" /> : side.name.charAt(0).toUpperCase()}
            </span>
            <h3 className="font-semibold">{side.name}</h3>
            <Badge variant="secondary">{side.players.length}</Badge>
          </div>
          <MatchPlayerSelector
            matchId={matchId}
            side={filtered}
            members={(sideOptions?.members ?? []).filter((member) => !assignedUserIds.has(member.userId))}
            guests={sideOptions?.guests ?? []}
            canManage={Boolean(editable && sideOptions?.canManage)}
            clubMatch={clubMatch}
          />
        </div>;
      })}
    </div>
  </div>;
}

function matchesFilter(position: string | null, filter: (typeof filters)[number]) {
  if (filter === "ALL") return true;
  if (filter === "GK") return position === "GK";
  if (filter === "DEF") return ["CB", "LB", "RB", "LWB", "RWB"].includes(position ?? "");
  if (filter === "MID") return ["CDM", "CM", "CAM", "LM", "RM"].includes(position ?? "");
  return ["LW", "RW", "CF", "ST"].includes(position ?? "");
}
