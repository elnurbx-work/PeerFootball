"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import { deleteCommentAction } from "@/actions/post.actions";
import { loadCommentRepliesAction } from "@/actions/pagination.actions";
import { CommentForm } from "@/components/posts/comment-form";
import { LoadMoreButton } from "@/components/pagination/load-more-button";
import type { PostComment } from "@/types/post.types";
import { useI18n } from "@/components/i18n/i18n-provider";
import { RelativeTime } from "@/components/i18n/relative-time";

type CommentItemProps = {
  comment: PostComment;
  canReply?: boolean;
};

export function CommentItem({ comment, canReply = true }: CommentItemProps) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replies, setReplies] = useState(comment.replies);
  const [hasMoreReplies, setHasMoreReplies] = useState(comment.replies.length >= 2);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const authorName = comment.author.name ?? t("profile.summary.playerFallback");
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

  function loadMoreReplies() {
    const cursor = replies.at(-1)?.id ?? null;
    setMessage(null);
    startTransition(async () => {
      const result = await loadCommentRepliesAction(comment.id, cursor);
      if (!result.ok || !result.data) {
        setMessage(result.message);
        return;
      }
      setReplies((current) => {
        const ids = new Set(current.map((reply) => reply.id));
        return [...current, ...result.data!.items.filter((reply) => !ids.has(reply.id))];
      });
      setHasMoreReplies(result.data.hasMore);
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
            <RelativeTime value={comment.createdAt} locale={locale} />
            {canReply ? (
              <button
                className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                type="button"
                onClick={() => setShowReplyForm((value) => !value)}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {t("posts.comments.reply")}
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
                {t("posts.comments.delete")}
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
            placeholder={t("posts.comments.replyTo", { name: authorName })}
            onSubmitted={() => {
              setShowReplyForm(false);
              router.refresh();
            }}
          />
        </div>
      ) : null}

      {replies.length ? (
        <div className="ml-8 grid gap-3 border-l pl-4">
          {replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} canReply={false} />
          ))}
          {canReply ? (
            <LoadMoreButton
              hasMore={hasMoreReplies}
              pending={pending}
              onClick={loadMoreReplies}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
