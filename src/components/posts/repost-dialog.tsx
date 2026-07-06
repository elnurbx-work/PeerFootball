"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Repeat2, X } from "lucide-react";
import { repostPostAction } from "@/actions/post.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PostMediaGrid } from "@/components/posts/post-media-grid";
import { REPOST_NOTE_MAX_LENGTH } from "@/lib/validations/post";
import type { OriginalPostPreview } from "@/types/post.types";

type RepostDialogProps = {
  open: boolean;
  originalPost: OriginalPostPreview | null;
  onOpenChange: (open: boolean) => void;
};

export function RepostDialog({ open, originalPost, onOpenChange }: RepostDialogProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open || !originalPost) {
    return null;
  }

  const authorName = originalPost.author.name ?? "FanPitch Player";
  const trimmedLength = note.trim().length;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (trimmedLength > REPOST_NOTE_MAX_LENGTH || !originalPost) {
      return;
    }

    startTransition(async () => {
      const result = await repostPostAction({
        originalPostId: originalPost.id,
        repostNote: note
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setNote("");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <form
        className="grid max-h-[90vh] w-full max-w-lg gap-4 overflow-y-auto rounded-md bg-card p-4 shadow-xl"
        role="dialog"
        aria-modal="true"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Repost</h2>
          <Button size="sm" variant="ghost" type="button" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Textarea
          maxLength={REPOST_NOTE_MAX_LENGTH}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add a note..."
          value={note}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{trimmedLength}/{REPOST_NOTE_MAX_LENGTH}</span>
        </div>

        <div className="grid gap-3 rounded-md border bg-background p-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-secondary font-semibold">
              {originalPost.author.image ? (
                <img src={originalPost.author.image} alt="" className="h-full w-full object-cover" />
              ) : (
                authorName.charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{authorName}</p>
              <p className="truncate text-xs text-muted-foreground">@{originalPost.author.username ?? "profile"}</p>
            </div>
          </div>
          {originalPost.content ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-6">{originalPost.content}</p>
          ) : null}
          <PostMediaGrid media={originalPost.media} compact />
        </div>

        {message ? <p className="text-sm text-destructive">{message}</p> : null}

        <Button type="submit" disabled={pending || trimmedLength > REPOST_NOTE_MAX_LENGTH}>
          <Repeat2 className="h-4 w-4" />
          {pending ? "Reposting..." : "Repost"}
        </Button>
      </form>
    </div>
  );
}
