"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MatchGoalsList } from "@/components/matches/match-goals-list";
import type { MatchDto } from "@/types/match.types";
import { useI18n } from "@/components/i18n/i18n-provider";
import { getMatchCategoryLabel, getMatchStatusLabel, getMatchTypeLabel } from "@/components/matches/match-labels";

export function MatchSummaryCard({ match, manageableSideIds, actions, onGoalMinuteClick }: {
  match: MatchDto;
  manageableSideIds: string[];
  actions?: React.ReactNode;
  onGoalMinuteClick?: (minute: number, extraMinute?: number) => void;
}) {
  const { locale, t } = useI18n();
  const [first, second] = match.sides;
  const homeScore = match.homeScore ?? match.goals.filter((goal) => goal.matchSideId === first?.id).length;
  const awayScore = match.awayScore ?? match.goals.filter((goal) => goal.matchSideId === second?.id).length;

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardContent className="grid min-w-0 gap-6 p-4 sm:gap-8 sm:p-6 lg:p-8 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(240px,0.85fr)] 2xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge>{getMatchTypeLabel(match.type, t)}</Badge>
            <Badge variant="secondary">{getMatchStatusLabel(match.status, t)}</Badge>
            <Badge variant="secondary">{getMatchCategoryLabel(match.category, t)}</Badge>
            {match.format ? <Badge variant="secondary">{formatLabel(match.format)}</Badge> : null}
          </div>
          <h1 className="mt-4 break-words text-2xl font-bold sm:text-3xl">
            {match.title ?? `${first?.name ?? t("matches.common.teamA")} ${t("matches.card.versus")} ${second?.name ?? t("matches.common.teamB")}`}
          </h1>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
              {new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short" }).format(new Date(match.startTime))}
              {match.durationMinutes ? ` · ${match.durationMinutes} min` : ""}
            </p>
            <p className="flex items-start gap-2 break-words">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {match.venue ?? t("matches.summary.venueNotSet")}
            </p>
            {match.note ? <p className="whitespace-pre-wrap break-words">{match.note}</p> : null}
          </div>
        </div>

        <div className="min-w-0 rounded-xl bg-secondary/60 p-3 text-center sm:p-5">
          <div className="grid min-w-0 grid-cols-2 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-4">
            <TeamIdentity
              name={first?.name ?? t("matches.common.teamA")}
              logoUrl={first?.club?.logoUrl ?? match.homeClub?.logoUrl ?? null}
            />
            <p className="order-1 col-span-2 max-w-full whitespace-nowrap text-4xl font-black tracking-tight sm:order-none sm:col-span-1 sm:text-5xl">
              {homeScore} <span className="text-muted-foreground">:</span> {awayScore}
            </p>
            <TeamIdentity
              name={second?.name ?? t("matches.common.teamB")}
              logoUrl={second?.club?.logoUrl ?? match.awayClub?.logoUrl ?? null}
            />
          </div>
          {match.resultNote ? <p className="mx-auto mt-3 max-w-lg break-words text-sm text-muted-foreground">{match.resultNote}</p> : null}
          <div className="mt-5 min-w-0 border-t pt-4 text-left">
            <MatchGoalsList goals={match.goals} sides={match.sides} manageableSideIds={manageableSideIds} onMinuteClick={onGoalMinuteClick} />
          </div>
        </div>

        <div className="grid min-w-0 gap-3">
          {actions ?? <p className="text-sm text-muted-foreground">{t("matches.summary.actionsPlaceholder")}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function TeamIdentity({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return (
    <div className="order-2 flex min-w-0 flex-col items-center gap-2 sm:order-none">
      <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border bg-background text-lg font-bold sm:h-20 sm:w-20">
        {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
      </span>
      <p className="max-w-full truncate font-semibold">{name}</p>
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
