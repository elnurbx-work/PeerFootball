"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MatchCommentsTab } from "@/components/matches/match-comments-tab";
import { MatchPlayersTab, type MatchSideOptions } from "@/components/matches/match-players-tab";
import { MatchVideosTab, type VideoSeekRequest } from "@/components/matches/match-videos-tab";
import type { ExtractedTimestamp } from "@/lib/videos/time";
import type { MatchDto } from "@/types/match.types";
import { useI18n } from "@/components/i18n/i18n-provider";

const tabs = ["videos", "players", "comments"] as const;

export function MatchTabs({ match, options, selectedVideoId, onSelectVideo, seekRequest, onTimestampClick, seekMessage }: { match: MatchDto; options: MatchSideOptions; selectedVideoId?: string; onSelectVideo: (videoId: string) => void; seekRequest?: VideoSeekRequest; onTimestampClick: (timestamp: ExtractedTimestamp) => void; seekMessage?: string }) {
  const { t } = useI18n();
  const [active, setActive] = useState<(typeof tabs)[number]>("videos");

  useEffect(() => {
    if (seekRequest) setActive("videos");
  }, [seekRequest]);

  function handleTimestampClick(timestamp: ExtractedTimestamp) {
    setActive("videos");
    onTimestampClick(timestamp);
  }

  return <Card className="min-w-0 overflow-hidden"><div className="grid grid-cols-3 border-b px-1 sm:px-6">{tabs.map((tab) => <button key={tab} type="button" onClick={() => setActive(tab)} className={`min-w-0 border-b-2 px-1 py-3 text-xs font-medium transition sm:px-5 sm:py-4 sm:text-sm ${active === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{tab === "videos" ? t("matches.tabs.videos") : tab === "players" ? t("matches.tabs.players") : t("matches.tabs.comments")}</button>)}</div><CardContent className="min-w-0 p-3 sm:p-7">{seekMessage ? <p className="mb-4 rounded-md bg-secondary p-3 text-sm text-muted-foreground">{seekMessage}</p> : null}{active === "videos" ? <MatchVideosTab matchId={match.id} videos={match.videos} comments={match.comments} canManage={match.permissions.canAddMatchVideo} selectedVideoId={selectedVideoId} onSelectVideo={onSelectVideo} seekRequest={seekRequest} onTimestampClick={handleTimestampClick} /> : active === "players" ? <MatchPlayersTab matchId={match.id} sides={match.sides} options={options} editable={!['FINISHED', 'CANCELLED'].includes(match.status)} /> : <MatchCommentsTab matchId={match.id} comments={match.comments} onTimestampClick={handleTimestampClick} />}</CardContent></Card>;
}
