"use client";

import { FormEvent, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { createCommentAction } from "@/actions/post.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { COMMENT_CONTENT_MAX_LENGTH } from "@/lib/validations/post";
import { useI18n } from "@/components/i18n/i18n-provider";

type CommentFormProps = {
  postId: string;
  parentId?: string;
  compact?: boolean;
  placeholder?: string;
  onSubmitted?: () => void;
};

export function CommentForm({
  postId,
  parentId,
  compact = false,
  placeholder,
  onSubmitted
}: CommentFormProps) {
  const { t } = useI18n();
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const trimmedLength = content.trim().length;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedLength || trimmedLength > COMMENT_CONTENT_MAX_LENGTH) {
      return;
    }

    setMessage(null);

    startTransition(async () => {
      const result = await createCommentAction({
        postId,
        parentId,
        content
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setContent("");
      onSubmitted?.();
    });
  }

  return (
    <form className="grid gap-2" onSubmit={handleSubmit}>
      <Textarea
        className={compact ? "min-h-16" : "min-h-20"}
        maxLength={COMMENT_CONTENT_MAX_LENGTH}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder ?? t("posts.comments.placeholder")}
        value={content}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {trimmedLength}/{COMMENT_CONTENT_MAX_LENGTH}
        </span>
        <Button size="sm" type="submit" disabled={pending || !trimmedLength || trimmedLength > COMMENT_CONTENT_MAX_LENGTH}>
          <Send className="h-4 w-4" />
          {pending ? t("posts.composer.posting") : t("posts.composer.post")}
        </Button>
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </form>
  );
}
