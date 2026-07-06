"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import { deleteCommentAction } from "@/actions/post.actions";
import { CommentForm } from "@/components/posts/comment-form";
import type { PostComment } from "@/types/post.types";

type CommentItemProps = {
  comment: PostComment;
  canReply?: boolean;
};

export function CommentItem({ comment, canReply = true }: CommentItemProps) {
  const router = useRouter();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const authorName = comment.author.name ?? "FanPitch Player";
  const profileHref = `/profile/${comment.author.username ?? comment.author.id}`;

  function handleDelete() {
    setMessage(null);

    startTransition(async () => {
      const result = await deleteCommentAction(comment.id);

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="grid gap-3">
      <div className="flex gap-3">
        <Link
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold"
          href={profileHref}
        >
          {comment.author.image ? <img src={comment.author.image} alt="" className="h-full w-full object-cover" /> : authorName.charAt(0)}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="rounded-md bg-secondary px-3 py-2">
            <Link className="font-medium hover:underline" href={profileHref}>
              {authorName}
            </Link>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{comment.content}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{formatRelativeTime(comment.createdAt)}</span>
            {canReply ? (
              <button
                className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                type="button"
                onClick={() => setShowReplyForm((value) => !value)}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Reply
              </button>
            ) : null}
            {comment.canDelete ? (
              <button
                className="inline-flex items-center gap-1 font-medium text-destructive hover:underline disabled:opacity-50"
                type="button"
                disabled={pending}
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            ) : null}
          </div>
          {message ? <p className="mt-1 text-xs text-destructive">{message}</p> : null}
        </div>
      </div>

      {showReplyForm ? (
        <div className="ml-12">
          <CommentForm
            compact
            parentId={comment.id}
            postId={comment.postId}
            placeholder={`Reply to ${authorName}`}
            onSubmitted={() => {
              setShowReplyForm(false);
              router.refresh();
            }}
          />
        </div>
      ) : null}

      {comment.replies.length ? (
        <div className="ml-8 grid gap-3 border-l pl-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} canReply={false} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diffSeconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));

  if (diffSeconds < 60) {
    return "just now";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}
