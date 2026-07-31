"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ClientDateTime } from "@/components/i18n/client-date-time";
import { getMatchCategoryLabel, getMatchStatusLabel } from "@/components/matches/match-labels";
import type { MatchDto, MatchSideDto } from "@/types/match.types";

export function MatchProposalCard({ match, actions }: { match: MatchDto; actions?: React.ReactNode }) {
  const { t } = useI18n();
  const [home, away] = match.sides;

  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-6 p-4 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{getMatchStatusLabel(match.status, t)}</Badge>
          <Badge variant="secondary">{getMatchCategoryLabel(match.category, t)}</Badge>
          {match.format ? <Badge variant="secondary">{formatLabel(match.format)}</Badge> : null}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-xl bg-secondary/60 p-4 sm:gap-8 sm:p-7">
          <ProposalClub side={home} fallback={t("matches.common.teamA")} />
          <span className="text-sm font-black text-muted-foreground">{t("matches.card.versus")}</span>
          <ProposalClub side={away} fallback={t("matches.common.teamB")} />
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground">
          {match.title ? <h1 className="text-xl font-bold text-foreground sm:text-2xl">{match.title}</h1> : null}
          <p className="flex items-start gap-2">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
            <ClientDateTime value={match.startTime} dateStyle="full" />
          </p>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            {match.venue ?? t("matches.summary.venueNotSet")}
          </p>
          {match.note ? <p className="whitespace-pre-wrap">{match.note}</p> : null}
        </div>

        {actions ? <div className="border-t pt-4">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}

function ProposalClub({ side, fallback }: { side: MatchSideDto | undefined; fallback: string }) {
  const name = side?.name ?? fallback;
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border bg-background text-xl font-bold sm:h-24 sm:w-24">
        {side?.club?.logoUrl ? <img src={side.club.logoUrl} alt="" className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
      </span>
      <span className="w-full truncate font-semibold">{name}</span>
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .replace("FIVE", "5")
    .replace("SIX", "6")
    .replace("SEVEN", "7")
    .replace("EIGHT", "8")
    .replace("NINE", "9")
    .replace("ELEVEN", "11")
    .replace("_V_", "v")
    .replaceAll("_", "");
}
