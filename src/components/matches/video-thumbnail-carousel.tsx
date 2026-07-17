"use client";

import type { MatchVideoDto } from "@/types/match.types";
import { useI18n } from "@/components/i18n/i18n-provider";

export function VideoThumbnailCarousel({ videos, selectedId, onSelect }: { videos: MatchVideoDto[]; selectedId?: string; onSelect: (video: MatchVideoDto) => void }) {
  const { t } = useI18n();
  return <div className="flex gap-3 overflow-x-auto pb-2">{videos.map((video) => <button key={video.id} type="button" aria-pressed={selectedId === video.id} onClick={() => onSelect(video)} className={`w-44 shrink-0 overflow-hidden rounded-lg border text-left transition ${selectedId === video.id ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"}`}><div className="flex aspect-video items-center justify-center bg-secondary text-2xl">▶</div><p className="truncate p-2 text-sm font-medium">{video.title ?? t("matches.videos.defaultTitle")}</p></button>)}{!videos.length ? <p className="text-sm text-muted-foreground">{t("matches.videos.empty")}</p> : null}</div>;
}
