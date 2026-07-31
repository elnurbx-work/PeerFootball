"use client";

import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchListItemDto } from "@/types/match.types";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ClientDateTime } from "@/components/i18n/client-date-time";
import { getMatchCategoryLabel, getMatchStatusLabel, getMatchTypeLabel } from "@/components/matches/match-labels";

export function MatchCard({ match }: { match: MatchListItemDto }) {
  const { t } = useI18n();
  const playerCount = match.sides.reduce((total, side) => total + side.playerCount, 0);
  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:justify-between">
          <CardTitle className="min-w-0 break-words">{match.title ?? match.sides.map((side) => side.name).join(` ${t("matches.card.versus")} `)}</CardTitle>
          <Badge className="shrink-0" variant="secondary">{getMatchStatusLabel(match.status, t)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-lg bg-secondary/50 p-3">
          <ClubIdentity side={match.sides[0]} />
          <span className="text-xs font-bold text-muted-foreground">{t("matches.card.versus")}</span>
          <ClubIdentity side={match.sides[1]} />
        </div>
        <div className="grid gap-2 text-sm text-muted-foreground">
          <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0" /><ClientDateTime value={match.startTime} /></p>
          <p className="flex items-start gap-2 break-words"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{match.venue ?? t("matches.card.venueNotSet")}</p>
          <p className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0" />{t("matches.card.selectedPlayers", { count: playerCount })}</p>
        </div>
        <div className="flex flex-wrap gap-2"><Badge>{getMatchTypeLabel(match.type, t)}</Badge><Badge variant="secondary">{getMatchCategoryLabel(match.category, t)}</Badge></div>
        <Button asChild variant="outline" className="w-full sm:w-fit"><Link href={`/matches/${match.id}`}>{t("matches.card.open")}</Link></Button>
      </CardContent>
    </Card>
  );
}

function ClubIdentity({ side }: { side: MatchListItemDto["sides"][number] | undefined }) {
  const name = side?.name ?? "?";
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
      <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border bg-background font-bold">
        {side?.logoUrl ? <img src={side.logoUrl} alt="" className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
      </span>
      <span className="w-full truncate text-xs font-semibold text-foreground">{name}</span>
    </div>
  );
}
