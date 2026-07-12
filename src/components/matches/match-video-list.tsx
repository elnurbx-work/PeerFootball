"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMatchVideoAction } from "@/actions/match.actions";
import { Button } from "@/components/ui/button";
import { MatchVideoForm } from "@/components/matches/match-video-form";
import type { MatchVideoDto } from "@/types/match.types";

export function MatchVideoList({ matchId, videos, canManage }: { matchId: string; videos: MatchVideoDto[]; canManage: boolean }) {
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
            Video əlavə et
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
                  {video.title ?? "Oyun videosu"}
                </a>
                <p className="mt-1 text-xs text-muted-foreground">
                  {video.provider.replaceAll("_", " ")} · {video.videoType.replaceAll("_", " ")}
                </p>
                {video.description ? <p className="mt-1 text-sm text-muted-foreground">{video.description}</p> : null}
                <p className="mt-1 text-xs text-muted-foreground">{video.uploadedBy.name ?? video.uploadedBy.username}</p>
              </div>
              {canManage ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingId(editingId === video.id ? null : video.id)}>
                    Redaktə et
                  </Button>
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => remove(video.id)}>
                    Sil
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
        {!videos.length ? <p className="text-sm text-muted-foreground">Oyun videosu əlavə edilməyib.</p> : null}
      </div>
    </div>
  );
}
