"use client";

import { MatchCommentForm } from "@/components/matches/match-comment-form";
import { MatchCommentList } from "@/components/matches/match-comment-list";
import { MatchVideoList } from "@/components/matches/match-video-list";
import { VideoThumbnailCarousel } from "@/components/matches/video-thumbnail-carousel";
import { getMatchVideoSeekUrl } from "@/lib/videos/video-url";
import type { ExtractedTimestamp } from "@/lib/videos/time";
import type { MatchCommentDto, MatchVideoDto } from "@/types/match.types";
import { useI18n } from "@/components/i18n/i18n-provider";

export type VideoSeekRequest = { videoId: string; seconds: number; nonce: number };

export function MatchVideosTab({ matchId, videos, comments, canManage, selectedVideoId, onSelectVideo, seekRequest, onTimestampClick }: { matchId: string; videos: MatchVideoDto[]; comments: MatchCommentDto[]; canManage: boolean; selectedVideoId?: string; onSelectVideo: (videoId: string) => void; seekRequest?: VideoSeekRequest; onTimestampClick?: (timestamp: ExtractedTimestamp) => void }) {
  const { t } = useI18n();
  const selected = videos.find((video) => video.id === selectedVideoId) ?? videos[0];
  return <div className="grid gap-6"><VideoThumbnailCarousel videos={videos} selectedId={selected?.id} onSelect={(video) => onSelectVideo(video.id)} />{selected ? <div className="overflow-hidden rounded-xl border bg-black"><MatchVideoPlayer selectedVideo={selected} seekRequest={seekRequest} /></div> : <div className="flex aspect-video items-center justify-center rounded-xl border bg-secondary text-muted-foreground">{t("matches.videos.notSelected")}</div>}{selected?.provider === "GOOGLE_DRIVE" ? <p className="text-xs text-amber-700">{t("matches.videos.driveSeekNotice")}</p> : null}<MatchVideoList matchId={matchId} videos={videos} canManage={canManage} /><div className="grid gap-4 border-t pt-5"><h3 className="font-semibold">{t("matches.videos.discussion")}</h3><MatchCommentForm matchId={matchId} /><MatchCommentList matchId={matchId} comments={comments} onTimestampClick={onTimestampClick} /></div></div>;
}

function MatchVideoPlayer({ selectedVideo, seekRequest }: { selectedVideo: MatchVideoDto; seekRequest?: VideoSeekRequest }) {
  const { t } = useI18n();
  if (selectedVideo.provider === "EXTERNAL") {
    return <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-secondary p-6 text-center"><p>{t("matches.videos.externalUnsupported")}</p><a className="font-medium text-primary underline" href={selectedVideo.originalUrl} target="_blank" rel="noreferrer">{t("matches.videos.openExternal")}</a></div>;
  }
  const seekMode = selectedVideo.provider === "YOUTUBE" ? "YOUTUBE_START_PARAM" : "GOOGLE_DRIVE_RELOAD";
  const shouldSeek = seekRequest?.videoId === selectedVideo.id;
  const src = shouldSeek ? getMatchVideoSeekUrl({ embedUrl: selectedVideo.embedUrl, seekMode }, seekRequest.seconds) : selectedVideo.embedUrl;
  return <iframe key={`${selectedVideo.id}:${seekRequest?.nonce ?? 0}`} className="aspect-video w-full" src={src} title={selectedVideo.title ?? t("matches.videos.defaultTitle")} allow="autoplay; fullscreen" allowFullScreen />;
}
