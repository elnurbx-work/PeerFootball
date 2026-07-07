"use server";

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

type ActionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function createPostAction(formData: FormData): Promise<ApiResponse<{ postId: string }>> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
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
      message: "Post details are invalid.",
      issues: result.error.flatten().fieldErrors
    };
  }

  if (result.data.media?.length && !isCloudinaryConfigured()) {
    return {
      ok: false,
      message: "Media upload is not configured yet. Add Cloudinary settings and try again.",
      issues: {
        media: ["Cloudinary is not configured."]
      }
    };
  }

  const uploadedMedia: UploadedPostMedia[] = [];

  try {
    for (const file of result.data.media ?? []) {
      uploadedMedia.push(await uploadPostMedia(file, `${POST_MEDIA_FOLDER}/${user.id}`));
    }
  } catch (error) {
    await cleanupUploadedMedia(uploadedMedia);

    return {
      ok: false,
      message: error instanceof Error ? error.message : "Media upload failed. Please try again.",
      issues: {
        media: ["Upload failed."]
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
      message: "Post published.",
      data: {
        postId: post.id
      }
    };
  } catch {
    await cleanupUploadedMedia(uploadedMedia);

    return {
      ok: false,
      message: "Post could not be saved. Please try again."
    };
  }
}

export async function deletePostAction(postId: string): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  return deletePostForUser(postId, user, false);
}

export async function deleteRepostAction(postId: string): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  return deletePostForUser(postId, user, true);
}

export async function toggleLikePostAction(postId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
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
      message: "Post was not found."
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
    message: liked ? "Post liked." : "Post unliked.",
    data: {
      liked,
      likesCount
    }
  };
}

export async function createCommentAction(input: CreateCommentInput): Promise<ApiResponse<{ commentId: string }>> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const result = createCommentSchema.safeParse(input);

  if (!result.success) {
    return {
      ok: false,
      message: "Comment is invalid.",
      issues: result.error.flatten().fieldErrors
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
      message: "Post was not found."
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
        message: "The comment you are replying to was not found."
      };
    }

    if (parent.parentId) {
      return {
        ok: false,
        message: "Replies can only be added to main comments."
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
    message: "Comment added.",
    data: {
      commentId: comment.id
    }
  };
}

export async function deleteCommentAction(commentId: string): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
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
      message: "Comment was not found."
    };
  }

  if (comment.authorId !== user.id && comment.post.authorId !== user.id) {
    return {
      ok: false,
      message: "You cannot delete this comment."
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
    message: "Comment deleted."
  };
}

export async function repostPostAction(input: RepostInput): Promise<ApiResponse<{ postId: string }>> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const result = createRepostSchema.safeParse(input);

  if (!result.success) {
    return {
      ok: false,
      message: "Repost details are invalid.",
      issues: result.error.flatten().fieldErrors
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
      message: "Post was not found."
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
      message: "Original post was not found."
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
    message: "Post reposted.",
    data: {
      postId: repost.id
    }
  };
}

async function deletePostForUser(postId: string, user: ActionUser, requireRepost: boolean): Promise<ApiResponse> {
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
      message: "Post was not found."
    };
  }

  if (post.authorId !== user.id) {
    return {
      ok: false,
      message: "You cannot delete this post."
    };
  }

  if (requireRepost && !post.originalPostId) {
    return {
      ok: false,
      message: "This post is not a repost."
    };
  }

  const cloudinaryDeleteResult = await deleteManyCloudinaryAssets(
    post.media.map((item) => ({ publicId: item.publicId, type: item.type }))
  );

  if (!cloudinaryDeleteResult.ok) {
    const firstFailure = cloudinaryDeleteResult.failed[0];

    return {
      ok: false,
      message: firstFailure?.message ?? "Post media could not be deleted from Cloudinary. Please try again."
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
    message: requireRepost ? "Repost deleted." : "Post deleted."
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

function unauthenticatedResponse(): ApiResponse<never> {
  return {
    ok: false,
    message: "You need to sign in first."
  };
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
