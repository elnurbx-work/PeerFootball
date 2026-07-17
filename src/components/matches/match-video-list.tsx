"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMatchVideoAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { MatchVideoForm } from "@/components/matches/match-video-form";
import type { MatchVideoDto } from "@/types/match.types";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { Translate } from "@/i18n/dictionary";

export function MatchVideoList({ matchId, videos, canManage }: { matchId: string; videos: MatchVideoDto[]; canManage: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteMatchVideoAction(id);
      setMessage(result.message);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      {canManage ? (
        <details
          className="rounded-lg border bg-card"
          open={isAdding}
          onToggle={(event) => setIsAdding(event.currentTarget.open)}
        >
          <summary className="cursor-pointer select-none px-4 py-3 font-medium">
            {t("matches.videos.add")}
          </summary>
          <div className="border-t p-4">
            <MatchVideoForm matchId={matchId} onDone={() => setIsAdding(false)} />
          </div>
        </details>
      ) : null}

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="grid gap-3">
        {videos.map((video) => (
          <div key={video.id} className="rounded-md border p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <a href={video.originalUrl} target="_blank" rel="noreferrer" className="font-medium text-primary underline">
                  {video.title ?? t("matches.videos.defaultTitle")}
                </a>
                <p className="mt-1 text-xs text-muted-foreground">
                  {getProviderLabel(video.provider, t)} · {getVideoTypeLabel(video.videoType, t)}
                </p>
                {video.description ? <p className="mt-1 text-sm text-muted-foreground">{video.description}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">{video.uploadedBy.name ?? video.uploadedBy.username}</p>
              </div>
              {canManage ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingId(editingId === video.id ? null : video.id)}>
                    {t("matches.videos.edit")}
                  </Button>
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => remove(video.id)}>
                    {t("matches.videos.delete")}
                  </Button>
                </div>
              ) : null}
            </div>
            {editingId === video.id ? (
              <div className="mt-3 border-t pt-3">
                <MatchVideoForm matchId={matchId} video={video} onDone={() => setEditingId(null)} />
              </div>
            ) : null}
          </div>
        ))}
        {!videos.length ? <p className="text-sm text-muted-foreground">{t("matches.videos.empty")}</p> : null}
      </div>
    </div>
  );
}

function getProviderLabel(value: string, t: Translate) {
  if (value === "GOOGLE_DRIVE") return "Google Drive";
  if (value === "YOUTUBE") return "YouTube";
  return t("matches.videos.externalProvider");
}

function getVideoTypeLabel(value: string, t: Translate) {
  if (value === "FULL_MATCH") return t("matches.videoForm.fullMatch");
  if (value === "FIRST_HALF") return t("matches.videoForm.firstHalf");
  if (value === "SECOND_HALF") return t("matches.videoForm.secondHalf");
  return t("matches.videoForm.other");
}
