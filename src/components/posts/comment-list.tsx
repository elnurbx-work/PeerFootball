"use client";

import { useRouter } from "next/navigation";
import { CommentForm } from "@/components/posts/comment-form";
import { CommentItem } from "@/components/posts/comment-item";
import type { PostComment } from "@/types/post.types";

type CommentListProps = {
  postId: string;
  comments: PostComment[];
};

export function CommentList({ postId, comments }: CommentListProps) {
  const router = useRouter();

  return (
    <div className="grid gap-4 border-t pt-4">
      <CommentForm postId={postId} onSubmitted={() => router.refresh()} />
      {comments.length ? (
        <div className="grid gap-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
