"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { loadPostCommentsAction } from "@/actions/pagination.actions";
import { CommentForm } from "@/components/posts/comment-form";
import { CommentItem } from "@/components/posts/comment-item";
import { LoadMoreButton } from "@/components/pagination/load-more-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { PostComment } from "@/types/post.types";
import { useI18n } from "@/components/i18n/i18n-provider";

type CommentListProps = {
  postId: string;
  comments: PostComment[];
  isAuthenticated?: boolean;
  totalCount: number;
};

export function CommentList({ postId, comments, isAuthenticated = true, totalCount }: CommentListProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState(comments);
  const [hasMore, setHasMore] = useState(comments.length < totalCount);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function loadMore() {
    const cursor = items.at(-1)?.id ?? null;
    setError(null);
    startTransition(async () => {
      const result = await loadPostCommentsAction(postId, cursor);
      if (!result.ok || !result.data) {
        setError(result.message);
        return;
      }
      setItems((current) => {
        const ids = new Set(current.map((comment) => comment.id));
        return [...current, ...result.data!.items.filter((comment) => !ids.has(comment.id))];
      });
      setHasMore(result.data.hasMore);
    });
  }

  return (
    <div className="grid gap-4 border-t pt-4">
      {isAuthenticated ? (
        <CommentForm postId={postId} onSubmitted={() => router.refresh()} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground">{t("responses.signInRequired")}</p>
          <Button asChild size="sm"><Link href="/auth/login">{t("nav.login")}</Link></Button>
        </div>
      )}
      {items.length ? (
        <div className="grid gap-4">
          {items.map((comment) => (
            <CommentItem key={comment.id} comment={comment} isAuthenticated={isAuthenticated} />
          ))}
        </div>
      ) : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <LoadMoreButton hasMore={hasMore} pending={pending} onClick={loadMore} />
    </div>
  );
}
