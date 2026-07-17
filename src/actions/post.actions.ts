"use server";

import { localizedFieldErrors } from "@/i18n/zod";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createCommentSchema, createPostSchema, createRepostSchema } from "@/lib/validations/post";
import { getCurrentUser } from "@/lib/auth";
import { canViewPost } from "@/server/services/privacy.service";
import {
  createCommentReplyNotification,
  createPostCommentNotification,
  createPostLikeNotification,
  createPostRepostNotification
} from "@/server/services/notification.service";
import {
  POST_MEDIA_FOLDER,
  deleteManyCloudinaryAssets,
  isCloudinaryConfigured,
  uploadPostMedia,
  type UploadedPostMedia
} from "@/server/services/cloudinary.service";
import type { ApiResponse } from "@/types/api.types";
import type { CreateCommentInput, RepostInput } from "@/types/post.types";
import { getServerTranslator } from "@/i18n/server";
import type { Translate } from "@/i18n/dictionary";

type ActionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function createPostAction(formData: FormData): Promise<ApiResponse<{ postId: string }>> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return { ok: false, message: t("responses.signInRequired") };
  }

  const media = getMediaFiles(formData);
  const result = createPostSchema.safeParse({
    content: stringValue(formData.get("content")),
    visibility: stringValue(formData.get("visibility")),
    media
  });

  if (!result.success) {
    return {
      ok: false,
      message: t("responses.post.invalid"),
      issues: localizedFieldErrors(result.error, t)
    };
  }

  if (result.data.media?.length && !isCloudinaryConfigured()) {
    return {
      ok: false,
      message: t("responses.post.mediaNotConfigured"),
      issues: {
        media: [t("responses.post.cloudinaryNotConfigured")]
      }
    };
  }

  const uploadedMedia: UploadedPostMedia[] = [];

  try {
    for (const file of result.data.media ?? []) {
      uploadedMedia.push(await uploadPostMedia(file, `${POST_MEDIA_FOLDER}/${user.id}`));
    }
  } catch {
    await cleanupUploadedMedia(uploadedMedia);

    return {
      ok: false,
      message: t("responses.post.mediaUploadFailed"),
      issues: {
        media: [t("responses.profile.uploadFailed")]
      }
    };
  }

  try {
    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        content: result.data.content,
        visibility: result.data.visibility,
        media: uploadedMedia.length
          ? {
              create: uploadedMedia.map((item, index) => ({
                type: item.type,
                url: item.url,
                publicId: item.publicId,
                width: item.width,
                height: item.height,
                duration: item.duration,
                format: item.format,
                size: item.size,
                order: index
              }))
            }
          : undefined
      },
      select: {
        id: true
      }
    });

    revalidatePostSurfaces(user);

    return {
      ok: true,
      message: t("responses.post.published"),
      data: {
        postId: post.id
      }
    };
  } catch {
    await cleanupUploadedMedia(uploadedMedia);

    return {
      ok: false,
      message: t("responses.post.saveFailed")
    };
  }
}

export async function deletePostAction(postId: string): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return { ok: false, message: t("responses.signInRequired") };
  }

  return deletePostForUser(postId, user, false, t);
}

export async function deleteRepostAction(postId: string): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return { ok: false, message: t("responses.signInRequired") };
  }

  return deletePostForUser(postId, user, true, t);
}

export async function toggleLikePostAction(postId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return { ok: false, message: t("responses.signInRequired") };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      author: {
        select: {
          id: true,
          username: true
        }
      }
    }
  });

  if (!post || !(await canViewPost(user.id, postId))) {
    return {
      ok: false,
      message: t("responses.post.notFound")
    };
  }

  const existingLike = await prisma.postLike.findUnique({
    where: {
      userId_postId: {
        userId: user.id,
        postId
      }
    },
    select: {
      id: true
    }
  });

  const liked = !existingLike;

  if (existingLike) {
    await prisma.postLike.delete({
      where: {
        id: existingLike.id
      }
    });
  } else {
    await prisma.postLike.create({
      data: {
        postId,
        userId: user.id
      }
    });

    await runNotificationTask(() => createPostLikeNotification({ actorId: user.id, postId }));
  }

  const likesCount = await prisma.postLike.count({
    where: {
      postId
    }
  });

  revalidatePostSurfaces(user);
  revalidatePathForAuthor(post.author);

  return {
    ok: true,
    message: liked ? t("responses.post.liked") : t("responses.post.unliked"),
    data: {
      liked,
      likesCount
    }
  };
}

export async function createCommentAction(input: CreateCommentInput): Promise<ApiResponse<{ commentId: string }>> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return { ok: false, message: t("responses.signInRequired") };
  }

  const result = createCommentSchema.safeParse(input);

  if (!result.success) {
    return {
      ok: false,
      message: t("responses.post.commentInvalid"),
      issues: localizedFieldErrors(result.error, t)
    };
  }

  const post = await prisma.post.findUnique({
    where: { id: result.data.postId },
    select: {
      id: true,
      authorId: true,
      author: {
        select: {
          id: true,
          username: true
        }
      }
    }
  });

  if (!post || !(await canViewPost(user.id, post.id))) {
    return {
      ok: false,
      message: t("responses.post.notFound")
    };
  }

  if (result.data.parentId) {
    const parent = await prisma.comment.findUnique({
      where: {
        id: result.data.parentId
      },
      select: {
        postId: true,
        parentId: true
      }
    });

    if (!parent || parent.postId !== post.id) {
      return {
        ok: false,
        message: t("responses.post.parentCommentNotFound")
      };
    }

    if (parent.parentId) {
      return {
        ok: false,
        message: t("responses.post.mainCommentsOnly")
      };
    }
  }

  const comment = await prisma.comment.create({
    data: {
      postId: post.id,
      authorId: user.id,
      parentId: result.data.parentId,
      content: result.data.content
    },
    select: {
      id: true
    }
  });

  if (result.data.parentId) {
    await runNotificationTask(() =>
      createCommentReplyNotification({
        actorId: user.id,
        parentCommentId: result.data.parentId!,
        postId: post.id,
        replyCommentId: comment.id
      })
    );
  } else {
    await runNotificationTask(() =>
      createPostCommentNotification({
        actorId: user.id,
        commentId: comment.id,
        postId: post.id
      })
    );
  }

  revalidatePostSurfaces(user);
  revalidatePathForAuthor(post.author);

  return {
    ok: true,
    message: t("responses.post.commentAdded"),
    data: {
      commentId: comment.id
    }
  };
}

export async function deleteCommentAction(commentId: string): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return { ok: false, message: t("responses.signInRequired") };
  }

  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId
    },
    select: {
      id: true,
      authorId: true,
      post: {
        select: {
          authorId: true,
          author: {
            select: {
              id: true,
              username: true
            }
          }
        }
      }
    }
  });

  if (!comment) {
    return {
      ok: false,
      message: t("responses.post.commentNotFound")
    };
  }

  if (comment.authorId !== user.id && comment.post.authorId !== user.id) {
    return {
      ok: false,
      message: t("responses.post.cannotDeleteComment")
    };
  }

  await prisma.comment.delete({
    where: {
      id: comment.id
    }
  });

  revalidatePostSurfaces(user);
  revalidatePathForAuthor(comment.post.author);

  return {
    ok: true,
    message: t("responses.post.commentDeleted")
  };
}

export async function repostPostAction(input: RepostInput): Promise<ApiResponse<{ postId: string }>> {
  const t = await getServerTranslator();
  const user = await requireUser();

  if (!user) {
    return { ok: false, message: t("responses.signInRequired") };
  }

  const result = createRepostSchema.safeParse(input);

  if (!result.success) {
    return {
      ok: false,
      message: t("responses.post.repostInvalid"),
      issues: localizedFieldErrors(result.error, t)
    };
  }

  const selectedPost = await prisma.post.findUnique({
    where: {
      id: result.data.originalPostId
    },
    select: {
      id: true,
      authorId: true,
      originalPostId: true,
      author: {
        select: {
          id: true,
          username: true
        }
      }
    }
  });

  if (!selectedPost || !(await canViewPost(user.id, selectedPost.id))) {
    return {
      ok: false,
      message: t("responses.post.notFound")
    };
  }

  const rootOriginalPostId = selectedPost.originalPostId ?? selectedPost.id;
  const rootOriginalPost = await prisma.post.findUnique({
    where: {
      id: rootOriginalPostId
    },
    select: {
      id: true,
      author: {
        select: {
          id: true,
          username: true
        }
      }
    }
  });

  if (!rootOriginalPost || !(await canViewPost(user.id, rootOriginalPost.id))) {
    return {
      ok: false,
      message: t("responses.post.originalNotFound")
    };
  }

  const repost = await prisma.post.create({
    data: {
      authorId: user.id,
      originalPostId: rootOriginalPost.id,
      repostNote: result.data.repostNote,
      visibility: "PUBLIC"
    },
    select: {
      id: true
    }
  });

  await runNotificationTask(() =>
    createPostRepostNotification({
      actorId: user.id,
      originalPostId: rootOriginalPost.id,
      repostId: repost.id
    })
  );

  revalidatePostSurfaces(user);
  revalidatePathForAuthor(rootOriginalPost.author);
  revalidatePathForAuthor(selectedPost.author);

  return {
    ok: true,
    message: t("responses.post.reposted"),
    data: {
      postId: repost.id
    }
  };
}

async function deletePostForUser(postId: string, user: ActionUser, requireRepost: boolean, t: Translate): Promise<ApiResponse> {
  const post = await prisma.post.findUnique({
    where: {
      id: postId
    },
    select: {
      id: true,
      authorId: true,
      originalPostId: true,
      media: {
        select: {
          publicId: true,
          type: true
        }
      },
      author: {
        select: {
          id: true,
          username: true
        }
      }
    }
  });

  if (!post) {
    return {
      ok: false,
      message: t("responses.post.notFound")
    };
  }

  if (post.authorId !== user.id) {
    return {
      ok: false,
      message: t("responses.post.cannotDelete")
    };
  }

  if (requireRepost && !post.originalPostId) {
    return {
      ok: false,
      message: t("responses.post.notRepost")
    };
  }

  const cloudinaryDeleteResult = await deleteManyCloudinaryAssets(
    post.media.map((item) => ({ publicId: item.publicId, type: item.type }))
  );

  if (!cloudinaryDeleteResult.ok) {
    return {
      ok: false,
      message: t("responses.post.mediaDeleteFailed")
    };
  }

  await prisma.$transaction([
    prisma.post.deleteMany({
      where: {
        originalPostId: post.id
      }
    }),
    prisma.post.delete({
      where: {
        id: post.id
      }
    })
  ]);

  revalidatePostSurfaces(user);
  revalidatePathForAuthor(post.author);

  return {
    ok: true,
    message: requireRepost ? t("responses.post.repostDeleted") : t("responses.post.deleted")
  };
}

function getMediaFiles(formData: FormData) {
  return formData
    .getAll("media")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : undefined;
}

async function requireUser() {
  return getCurrentUser();
}

async function cleanupUploadedMedia(media: UploadedPostMedia[]) {
  await deleteManyCloudinaryAssets(media.map((item) => ({ publicId: item.publicId, type: item.type })));
}

function revalidatePostSurfaces(user: Pick<ActionUser, "id" | "username">) {
  revalidatePath("/feed");
  revalidatePath("/profile");
  revalidatePath(`/profile/${user.username ?? user.id}`);
}

function revalidatePathForAuthor(author: { id: string; username: string | null }) {
  revalidatePath(`/profile/${author.username ?? author.id}`);
}

async function runNotificationTask(task: () => Promise<unknown>) {
  try {
    await task();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[notifications] creation failed", error);
    }
  }
}
