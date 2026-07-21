"use client";

import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchListItemDto } from "@/types/match.types";
import { useI18n } from "@/components/i18n/i18n-provider";
import { getMatchCategoryLabel, getMatchStatusLabel, getMatchTypeLabel } from "@/components/matches/match-labels";

export function MatchCard({ match }: { match: MatchListItemDto }) {
  const { locale, t } = useI18n();
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
        <div className="grid gap-2 text-sm text-muted-foreground">
          <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />{formatDate(match.startTime, locale)}</p>
          <p className="flex items-start gap-2 break-words"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{match.venue ?? t("matches.card.venueNotSet")}</p>
          <p className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0" />{t("matches.card.selectedPlayers", { count: playerCount })}</p>
        </div>
        <div className="flex flex-wrap gap-2"><Badge>{getMatchTypeLabel(match.type, t)}</Badge><Badge variant="secondary">{getMatchCategoryLabel(match.category, t)}</Badge></div>
        <Button asChild variant="outline" className="w-full sm:w-fit"><Link href={`/matches/${match.id}`}>{t("matches.card.open")}</Link></Button>
      </CardContent>
    </Card>
  );
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
