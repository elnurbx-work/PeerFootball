import { z } from "zod";
import type { Translate } from "@/i18n/dictionary";

export const POST_CONTENT_MAX_LENGTH = 1000;
export const COMMENT_CONTENT_MAX_LENGTH = 500;
export const REPOST_NOTE_MAX_LENGTH = 500;
export const MAX_POST_MEDIA_COUNT = 4;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES] as const;

const visibilitySchema = z.enum(["PUBLIC", "FRIENDS_ONLY", "PRIVATE"]);

function optionalTrimmedString(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));
}

function isFileLike(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "type" in value &&
    "size" in value &&
    typeof (value as { name: unknown }).name === "string" &&
    typeof (value as { type: unknown }).type === "string" &&
    typeof (value as { size: unknown }).size === "number"
  );
}

export function getPostMediaValidationError(file: File, t: Translate): string | null {
  if (!ALLOWED_MEDIA_TYPES.includes(file.type as (typeof ALLOWED_MEDIA_TYPES)[number])) {
    return t("responses.validation.mediaType", { name: file.name });
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]);
  const maxSize = isImage ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;
  const maxSizeLabel = isImage ? "5MB" : "50MB";

  if (file.size > maxSize) {
    return t("responses.validation.mediaSize", { name: file.name, size: maxSizeLabel });
  }

  return null;
}

export const postMediaFileSchema = z.custom<File>(isFileLike, "validation.mediaInvalid").superRefine((file, ctx) => {
  const invalidType = !ALLOWED_MEDIA_TYPES.includes(file.type as (typeof ALLOWED_MEDIA_TYPES)[number]);
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]);
  const tooLarge = file.size > (isImage ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES);

  if (invalidType || tooLarge) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: invalidType ? "validation.mediaType" : "validation.mediaSize"
    });
  }
});

export const createPostSchema = z
  .object({
    content: optionalTrimmedString(POST_CONTENT_MAX_LENGTH),
    visibility: visibilitySchema.optional().default("PUBLIC"),
    media: z.array(postMediaFileSchema).max(MAX_POST_MEDIA_COUNT, "validation.mediaLimit").optional()
  })
  .superRefine((value, ctx) => {
    if (!value.content && (!value.media || value.media.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "validation.postContentRequired",
        path: ["content"]
      });
    }
  });

export const createCommentSchema = z.object({
  postId: z.string().min(1),
  parentId: z.string().min(1).optional(),
  content: z.string().trim().min(1).max(COMMENT_CONTENT_MAX_LENGTH)
});

export const createRepostSchema = z.object({
  originalPostId: z.string().min(1),
  repostNote: optionalTrimmedString(REPOST_NOTE_MAX_LENGTH)
});

export type CreatePostSchemaInput = z.infer<typeof createPostSchema>;
export type CreateCommentSchemaInput = z.infer<typeof createCommentSchema>;
export type CreateRepostSchemaInput = z.infer<typeof createRepostSchema>;
