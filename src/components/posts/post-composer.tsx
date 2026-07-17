"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe2, ImagePlus, Lock, Send, Users, X } from "lucide-react";
import { createPostAction } from "@/actions/post.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";
import {
  ALLOWED_MEDIA_TYPES,
  MAX_POST_MEDIA_COUNT,
  POST_CONTENT_MAX_LENGTH,
  getPostMediaValidationError
} from "@/lib/validations/post";
import type { PostVisibility } from "@/types/post.types";
import { useI18n } from "@/components/i18n/i18n-provider";

type MediaPreview = {
  file: File;
  url: string;
};

export function PostComposer() {
  const { t } = useI18n();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("PUBLIC");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<MediaPreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const trimmedLength = content.trim().length;

  useEffect(() => {
    const nextPreviews = mediaFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file)
    }));

    setPreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [mediaFiles]);

  function handleMediaChange(event: ChangeEvent<HTMLInputElement>) {
    const incomingFiles = Array.from(event.target.files ?? []);
    setError(null);
    setToastMessage(null);

    if (!incomingFiles.length) {
      return;
    }

    if (mediaFiles.length + incomingFiles.length > MAX_POST_MEDIA_COUNT) {
      setError(t("posts.composer.mediaLimit", { count: MAX_POST_MEDIA_COUNT }));
      event.target.value = "";
      return;
    }

    const firstError = incomingFiles.map((file) => getPostMediaValidationError(file, t)).find(Boolean);

    if (firstError) {
      setError(firstError);
      event.target.value = "";
      return;
    }

    setMediaFiles((current) => [...current, ...incomingFiles]);
    event.target.value = "";
  }

  function removeMedia(index: number) {
    setMediaFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setToastMessage(null);

    if (!trimmedLength && mediaFiles.length === 0) {
      setError(t("posts.composer.emptyError"));
      return;
    }

    const formData = new FormData();
    formData.set("content", content);
    formData.set("visibility", visibility);
    mediaFiles.forEach((file) => formData.append("media", file));

    startTransition(async () => {
      const result = await createPostAction(formData);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setContent("");
      setMediaFiles([]);
      setToastMessage(result.message);
      router.refresh();
    });
  }

  return (
    <>
      <Toast message={toastMessage ?? ""} open={Boolean(toastMessage)} onOpenChange={(open) => !open && setToastMessage(null)} />
      <Card>
        <CardContent className="space-y-4 p-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Textarea
              maxLength={POST_CONTENT_MAX_LENGTH}
              onChange={(event) => setContent(event.target.value)}
              placeholder={t("posts.composer.placeholder")}
              rows={4}
              value={content}
            />

            {previews.length ? (
              <div className={previews.length === 1 ? "grid gap-2" : "grid gap-2 sm:grid-cols-2"}>
                {previews.map((preview, index) => (
                  <div
                    key={`${preview.file.name}-${index}`}
                    className={
                      previews.length === 1
                        ? "relative aspect-[4/3] max-h-[440px] overflow-hidden rounded-md border bg-secondary"
                        : "relative aspect-[4/3] overflow-hidden rounded-md border bg-secondary"
                    }
                  >
                    {preview.file.type.startsWith("video/") ? (
                      <video className="h-full w-full bg-black object-contain object-top" src={preview.url} muted />
                    ) : (
                      <img className="h-full w-full object-contain object-top" src={preview.url} alt="" />
                    )}
                    <button
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
                      type="button"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  accept={ALLOWED_MEDIA_TYPES.join(",")}
                  className="hidden"
                  multiple
                  type="file"
                  onChange={handleMediaChange}
                />
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={pending || mediaFiles.length >= MAX_POST_MEDIA_COUNT}
                >
                  <ImagePlus className="h-4 w-4" />
                  {t("posts.composer.media")}
                </Button>
                <label className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm">
                  {visibility === "PUBLIC" ? <Globe2 className="h-4 w-4" /> : visibility === "FRIENDS_ONLY" ? <Users className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  <select
                    className="bg-transparent outline-none"
                    value={visibility}
                    onChange={(event) => setVisibility(event.target.value as PostVisibility)}
                    disabled={pending}
                  >
                    <option value="PUBLIC">{t("posts.composer.public")}</option>
                    <option value="FRIENDS_ONLY">{t("posts.composer.friends")}</option>
                    <option value="PRIVATE">{t("posts.composer.private")}</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="text-xs text-muted-foreground">
                  {trimmedLength}/{POST_CONTENT_MAX_LENGTH}
                </span>
                <Button type="submit" disabled={pending || (!trimmedLength && mediaFiles.length === 0)}>
                  <Send className="h-4 w-4" />
                  {pending ? t("posts.composer.posting") : t("posts.composer.post")}
                </Button>
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </form>
        </CardContent>
      </Card>
    </>
  );
}
