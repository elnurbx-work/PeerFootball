"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { MessageCircle, Repeat2, ThumbsUp, Trash2 } from "lucide-react";
import { deletePostAction, toggleLikePostAction } from "@/actions/post.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CommentList } from "@/components/posts/comment-list";
import { DeletePostDialog } from "@/components/posts/delete-post-dialog";
import { PostMediaGrid } from "@/components/posts/post-media-grid";
import { RepostDialog } from "@/components/posts/repost-dialog";
import type { FeedPost, OriginalPostPreview, PostComment } from "@/types/post.types";
import { useI18n } from "@/components/i18n/i18n-provider";
import { RelativeTime } from "@/components/i18n/relative-time";

type PostCardProps = {
  post: FeedPost;
  comments?: PostComment[];
};

export function PostCard({ post, comments = [] }: PostCardProps) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [liked, setLiked] = useState(post.likedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRepostDialog, setShowRepostDialog] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const authorName = post.author.name ?? t("profile.summary.playerFallback");
  const profileHref = `/profile/${post.author.username ?? post.author.id}`;
  const displayedContent = post.originalPost ? post.repostNote : post.content;
  const repostTarget = useMemo<OriginalPostPreview | null>(() => {
    if (post.originalPost) {
      return post.originalPost;
    }

    return {
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      author: post.author,
      media: post.media
    };
  }, [post]);

  function handleLike() {
    setMessage(null);
    const previousLiked = liked;
    const previousCount = likesCount;
    const nextLiked = !previousLiked;

    setLiked(nextLiked);
    setLikesCount((count) => count + (nextLiked ? 1 : -1));

    startTransition(async () => {
      const result = await toggleLikePostAction(post.id);

      if (!result.ok || !result.data) {
        setLiked(previousLiked);
        setLikesCount(previousCount);
        setMessage(result.message);
        return;
      }

      setLiked(result.data.liked);
      setLikesCount(result.data.likesCount);
    });
  }

  function handleDelete() {
    setDeleteError(null);

    startTransition(async () => {
      const result = await deletePostAction(post.id);

      if (!result.ok) {
        setDeleteError(result.message);
        return;
      }

      setShowDeleteDialog(false);
      router.refresh();
    });
  }

  return (
    <Card id={`post-${post.id}`} className="scroll-mt-6">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-semibold"
              href={profileHref}
            >
              {post.author.image ? <img src={post.author.image} alt="" className="h-full w-full object-cover" /> : authorName.charAt(0)}
            </Link>
            <div className="min-w-0">
              <Link className="truncate font-semibold hover:underline" href={profileHref}>
                {authorName}
              </Link>
              <p className="truncate text-sm text-muted-foreground">
                @{post.author.username ?? t("profile.summary.profileFallback")} - <RelativeTime value={post.createdAt} locale={locale} />
              </p>
              {post.originalPost ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Repeat2 className="h-3.5 w-3.5" />
                  {t("posts.card.reposted")}
                </p>
              ) : null}
            </div>
          </div>

          {post.isOwner ? (
            <Button
              size="sm"
              variant="ghost"
              type="button"
              disabled={pending}
              onClick={() => {
                setDeleteError(null);
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        {displayedContent ? (
          <p className="whitespace-pre-wrap break-words leading-7">{displayedContent}</p>
        ) : null}

        {post.originalPost ? (
          <OriginalPostPreviewCard post={post.originalPost} />
        ) : (
          <PostMediaGrid media={post.media} />
        )}

        <div className="flex flex-wrap gap-2 border-t pt-3">
          <Button variant="ghost" size="sm" type="button" disabled={pending} onClick={handleLike}>
            <ThumbsUp className={liked ? "h-4 w-4 fill-current" : "h-4 w-4"} />
            {likesCount}
          </Button>
          <Button variant="ghost" size="sm" type="button" onClick={() => setShowComments((value) => !value)}>
            <MessageCircle className="h-4 w-4" />
            {post.commentsCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            disabled={pending || !repostTarget}
            onClick={() => setShowRepostDialog(true)}
          >
            <Repeat2 className="h-4 w-4" />
            {post.repostsCount}
          </Button>
        </div>

        {message ? <p className="text-sm text-destructive">{message}</p> : null}
        {showComments ? <CommentList postId={post.id} comments={comments} /> : null}
      </CardContent>

      <DeletePostDialog
        error={deleteError}
        open={showDeleteDialog}
        pending={pending}
        onConfirm={handleDelete}
        onOpenChange={setShowDeleteDialog}
      />
      <RepostDialog open={showRepostDialog} originalPost={repostTarget} onOpenChange={setShowRepostDialog} />
    </Card>
  );
}

function OriginalPostPreviewCard({ post }: { post: OriginalPostPreview }) {
  const { locale, t } = useI18n();
  const authorName = post.author.name ?? t("profile.summary.playerFallback");

  return (
    <div className="grid gap-3 rounded-md border bg-background p-3">
      <div className="flex min-w-0 items-center gap-2">
        <Link
          className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold"
          href={`/profile/${post.author.username ?? post.author.id}`}
        >
          {post.author.image ? <img src={post.author.image} alt="" className="h-full w-full object-cover" /> : authorName.charAt(0)}
        </Link>
        <div className="min-w-0">
          <Link className="truncate text-sm font-medium hover:underline" href={`/profile/${post.author.username ?? post.author.id}`}>
            {authorName}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            @{post.author.username ?? t("profile.summary.profileFallback")} - <RelativeTime value={post.createdAt} locale={locale} />
          </p>
        </div>
      </div>
      {post.content ? <p className="whitespace-pre-wrap break-words text-sm leading-6">{post.content}</p> : null}
      <PostMediaGrid media={post.media} compact />
    </div>
  );
}
