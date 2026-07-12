"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MatchCommentsTab } from "@/components/matches/match-comments-tab";
import { MatchPlayersTab, type MatchSideOptions } from "@/components/matches/match-players-tab";
import { MatchVideosTab, type VideoSeekRequest } from "@/components/matches/match-videos-tab";
import type { ExtractedTimestamp } from "@/lib/videos/time";
import type { MatchDto } from "@/types/match.types";

const tabs = ["Videolar", "Oyunçular", "Şərhlər"] as const;

export function MatchTabs({ match, options, selectedVideoId, onSelectVideo, seekRequest, onTimestampClick, seekMessage }: { match: MatchDto; options: MatchSideOptions; selectedVideoId?: string; onSelectVideo: (videoId: string) => void; seekRequest?: VideoSeekRequest; onTimestampClick: (timestamp: ExtractedTimestamp) => void; seekMessage?: string }) {
  const [active, setActive] = useState<(typeof tabs)[number]>("Videolar");

  useEffect(() => {
    if (seekRequest) setActive("Videolar");
  }, [seekRequest]);

  function handleTimestampClick(timestamp: ExtractedTimestamp) {
    setActive("Videolar");
    onTimestampClick(timestamp);
  }

  return <Card><div className="flex overflow-x-auto border-b px-3 sm:px-6">{tabs.map((tab) => <button key={tab} type="button" onClick={() => setActive(tab)} className={`border-b-2 px-5 py-4 text-sm font-medium transition ${active === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{tab}</button>)}</div><CardContent className="p-5 sm:p-7">{seekMessage ? <p className="mb-4 rounded-md bg-secondary p-3 text-sm text-muted-foreground">{seekMessage}</p> : null}{active === "Videolar" ? <MatchVideosTab matchId={match.id} videos={match.videos} comments={match.comments} canManage={match.permissions.canAddMatchVideo} selectedVideoId={selectedVideoId} onSelectVideo={onSelectVideo} seekRequest={seekRequest} onTimestampClick={handleTimestampClick} /> : active === "Oyunçular" ? <MatchPlayersTab matchId={match.id} sides={match.sides} options={options} editable={!['FINISHED', 'CANCELLED'].includes(match.status)} /> : <MatchCommentsTab matchId={match.id} comments={match.comments} onTimestampClick={handleTimestampClick} />}</CardContent></Card>;
}
