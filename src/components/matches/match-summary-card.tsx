"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MatchGoalsList } from "@/components/matches/match-goals-list";
import type { MatchDto } from "@/types/match.types";
import { useI18n } from "@/components/i18n/i18n-provider";
import { getMatchCategoryLabel, getMatchStatusLabel, getMatchTypeLabel } from "@/components/matches/match-labels";

export function MatchSummaryCard({ match, manageableSideIds, actions, onGoalMinuteClick }: { match: MatchDto; manageableSideIds: string[]; actions?: React.ReactNode; onGoalMinuteClick?: (minute: number, extraMinute?: number) => void }) {
  const { locale, t } = useI18n();
  const [first, second] = match.sides;
  const homeScore = match.homeScore ?? match.goals.filter((goal) => goal.matchSideId === first?.id).length;
  const awayScore = match.awayScore ?? match.goals.filter((goal) => goal.matchSideId === second?.id).length;
  const teamA = t("matches.common.teamA");
  const teamB = t("matches.common.teamB");
  return <Card className="min-w-0 overflow-hidden"><CardContent className="grid min-w-0 gap-6 p-4 sm:gap-8 sm:p-6 lg:p-8 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(240px,0.85fr)] 2xl:items-center"><div className="min-w-0"><div className="flex flex-wrap gap-2"><Badge>{getMatchTypeLabel(match.type, t)}</Badge><Badge variant="secondary">{getMatchStatusLabel(match.status, t)}</Badge><Badge variant="secondary">{getMatchCategoryLabel(match.category, t)}</Badge></div><h1 className="mt-4 break-words text-2xl font-bold sm:text-3xl">{match.title ?? `${first?.name ?? teamA} ${t("matches.card.versus")} ${second?.name ?? teamB}`}</h1><div className="mt-4 grid gap-2 text-sm text-muted-foreground"><p className="flex items-start gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />{new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short" }).format(new Date(match.startTime))}</p><p className="flex items-start gap-2 break-words"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{match.venue ?? t("matches.summary.venueNotSet")}</p></div></div><div className="min-w-0 rounded-xl bg-secondary/60 p-3 text-center sm:p-5"><div className="grid min-w-0 grid-cols-2 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-4"><p className="order-2 min-w-0 truncate font-semibold sm:order-none">{first?.name ?? teamA}</p><p className="order-1 col-span-2 max-w-full whitespace-nowrap text-4xl font-black tracking-tight sm:order-none sm:col-span-1 sm:text-5xl">{homeScore} <span className="text-muted-foreground">:</span> {awayScore}</p><p className="order-3 min-w-0 truncate font-semibold sm:order-none">{second?.name ?? teamB}</p></div>{match.resultNote ? <p className="mx-auto mt-3 max-w-lg break-words text-sm text-muted-foreground">{match.resultNote}</p> : null}<div className="mt-5 min-w-0 border-t pt-4 text-left"><MatchGoalsList goals={match.goals} sides={match.sides} manageableSideIds={manageableSideIds} onMinuteClick={onGoalMinuteClick} /></div></div><div className="grid min-w-0 gap-3">{actions ?? <p className="text-sm text-muted-foreground">{t("matches.summary.actionsPlaceholder")}</p>}</div></CardContent></Card>;
}
