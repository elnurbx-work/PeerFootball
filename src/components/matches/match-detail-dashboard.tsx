"use client";

import { useState } from "react";
import { MatchPitchBoard } from "@/components/matches/match-pitch-board";
import { MatchSummaryCard } from "@/components/matches/match-summary-card";
import { MatchTabs } from "@/components/matches/match-tabs";
import type { MatchSideOptions } from "@/components/matches/match-players-tab";
import type { VideoSeekRequest } from "@/components/matches/match-videos-tab";
import { getVideoSecondForMatchMinute, type ExtractedTimestamp } from "@/lib/videos/time";
import type { MatchDto } from "@/types/match.types";
import { useI18n } from "@/components/i18n/i18n-provider";

export function MatchDetailDashboard({ match, options, manageableSideIds, summaryActions, sideEditor }: { match: MatchDto; options: MatchSideOptions; manageableSideIds: string[]; summaryActions?: React.ReactNode; sideEditor?: React.ReactNode }) {
  const { t } = useI18n();
  const [selectedVideoId, setSelectedVideoId] = useState<string | undefined>(match.videos[0]?.id);
  const [seekRequest, setSeekRequest] = useState<VideoSeekRequest>();
  const [seekMessage, setSeekMessage] = useState<string>();
  const selectedVideo = match.videos.find((video) => video.id === selectedVideoId) ?? match.videos[0];

  function seekTo(seconds: number | null) {
    if (!selectedVideo) return setSeekMessage(t("matches.dashboard.addVideoBeforeSeek"));
    if (selectedVideo.provider === "EXTERNAL" || seconds === null) return setSeekMessage(t("matches.dashboard.seekUnsupported"));
    setSeekMessage(selectedVideo.provider === "GOOGLE_DRIVE" ? t("matches.videos.driveSeekNotice") : undefined);
    setSeekRequest({ videoId: selectedVideo.id, seconds, nonce: Date.now() });
  }

  function seekMatchMinute(minute: number, extraMinute = 0) {
    if (!selectedVideo) return seekTo(null);
    seekTo(getVideoSecondForMatchMinute({ minute, extraMinute, videoType: selectedVideo.videoType, matchStartSecond: selectedVideo.matchStartSecond }));
  }

  function handleTimestampClick(timestamp: ExtractedTimestamp) {
    if (timestamp.kind === "VIDEO_TIMESTAMP") seekTo(timestamp.seconds ?? null);
    else seekMatchMinute(timestamp.minute ?? 0, timestamp.extraMinute ?? 0);
  }

  function selectVideo(videoId: string) {
    setSelectedVideoId(videoId); setSeekRequest(undefined); setSeekMessage(undefined);
  }

  return <div className="grid min-w-0 gap-4 sm:gap-7"><MatchSummaryCard match={match} manageableSideIds={manageableSideIds} actions={summaryActions} onGoalMinuteClick={seekMatchMinute} />{sideEditor}<MatchPitchBoard sides={match.sides} goals={match.goals} manageableSideIds={manageableSideIds} /><MatchTabs match={match} options={options} selectedVideoId={selectedVideo?.id} onSelectVideo={selectVideo} seekRequest={seekRequest} onTimestampClick={handleTimestampClick} seekMessage={seekMessage} /></div>;
}
