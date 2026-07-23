import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  publishNotificationCreated,
  publishNotificationRead,
  publishNotificationsReadAll
} from "@/server/services/ably.service";
import type { AppNotification, NotificationType } from "@/types/notification.types";
import { measureAsync } from "@/lib/performance";

export const notificationActorSelect = {
  id: true,
  name: true,
  username: true,
  image: true
} as const;

export const notificationInclude = {
  actor: {
    select: notificationActorSelect
  }
} satisfies Prisma.NotificationInclude;

type NotificationRecord = Prisma.NotificationGetPayload<{
  include: typeof notificationInclude;
}>;

type CreateNotificationInput = {
  recipientId: string;
  actorId?: string | null;
  type: NotificationType;
  postId?: string | null;
  commentId?: string | null;
  conversationId?: string | null;
  messageId?: string | null;
  friendshipId?: string | null;
  title?: string | null;
  body?: string | null;
};

export async function createNotification(input: CreateNotificationInput): Promise<AppNotification | null> {
  if (input.actorId && input.recipientId === input.actorId) {
    return null;
  }

  const notification = await prisma.notification.create({
    data: {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      postId: input.postId,
      commentId: input.commentId,
      conversationId: input.conversationId,
      messageId: input.messageId,
      friendshipId: input.friendshipId,
      title: input.title,
      body: input.body
    },
    include: notificationInclude
  });
  const dto = toAppNotification(notification);

  await publishNotificationBestEffort(input.recipientId, dto);

  return dto;
}

export async function createPostLikeNotification({ actorId, postId }: { actorId: string; postId: string }) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true }
  });

  if (!post || post.authorId === actorId) {
    return null;
  }

  const existing = await prisma.notification.findFirst({
    where: {
      actorId,
      postId,
      recipientId: post.authorId,
      type: "POST_LIKE"
    },
    include: notificationInclude
  });

  if (existing) {
    return toAppNotification(existing);
  }

  return createNotification({
    actorId,
    postId,
    recipientId: post.authorId,
    type: "POST_LIKE"
  });
}

export async function createPostCommentNotification({
  actorId,
  commentId,
  postId
}: {
  actorId: string;
  commentId: string;
  postId: string;
}) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true }
  });

  if (!post || post.authorId === actorId) {
    return null;
  }

  return createNotification({
    actorId,
    commentId,
    postId,
    recipientId: post.authorId,
    type: "POST_COMMENT"
  });
}

export async function createCommentReplyNotification({
  actorId,
  parentCommentId,
  postId,
  replyCommentId
}: {
  actorId: string;
  parentCommentId: string;
  postId: string;
  replyCommentId: string;
}) {
  const parentComment = await prisma.comment.findUnique({
    where: { id: parentCommentId },
    select: { authorId: true }
  });

  if (!parentComment || parentComment.authorId === actorId) {
    return null;
  }

  return createNotification({
    actorId,
    commentId: replyCommentId,
    postId,
    recipientId: parentComment.authorId,
    type: "COMMENT_REPLY"
  });
}

export async function createPostRepostNotification({
  actorId,
  originalPostId,
  repostId
}: {
  actorId: string;
  originalPostId: string;
  repostId: string;
}) {
  const originalPost = await prisma.post.findUnique({
    where: { id: originalPostId },
    select: { authorId: true }
  });

  if (!originalPost || originalPost.authorId === actorId) {
    return null;
  }

  return createNotification({
    actorId,
    postId: originalPostId,
    commentId: null,
    recipientId: originalPost.authorId,
    title: null,
    body: null,
    type: "POST_REPOST"
  });
}

export async function createFriendRequestNotification({
  actorId,
  friendshipId,
  recipientId
}: {
  actorId: string;
  friendshipId: string;
  recipientId: string;
}) {
  if (actorId === recipientId) {
    return null;
  }

  const existing = await prisma.notification.findFirst({
    where: {
      actorId,
      friendshipId,
      recipientId,
      type: "FRIEND_REQUEST"
    },
    include: notificationInclude
  });

  if (existing) {
    return toAppNotification(existing);
  }

  return createNotification({
    actorId,
    friendshipId,
    recipientId,
    type: "FRIEND_REQUEST"
  });
}

export async function createFriendAcceptedNotification({
  actorId,
  friendshipId,
  recipientId
}: {
  actorId: string;
  friendshipId: string;
  recipientId: string;
}) {
  return createNotification({
    actorId,
    friendshipId,
    recipientId,
    type: "FRIEND_ACCEPTED"
  });
}

export async function createMessageNotification({
  actorId,
  conversationId,
  messageId,
  recipientId
}: {
  actorId: string;
  conversationId: string;
  messageId: string;
  recipientId: string;
}) {
  return createNotification({
    actorId,
    conversationId,
    messageId,
    recipientId,
    type: "MESSAGE"
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const notification = await measureAsync("notification.service.findFirst", () =>
    prisma.notification.findFirst({
      where: {
        id: notificationId,
        recipientId: userId
      },
      select: {
        id: true,
        readAt: true
      }
    }), { route: "notification-destination" });

  if (!notification) {
    return null;
  }

  if (!notification.readAt) {
    await measureAsync("notification.service.update", () =>
      prisma.notification.update({
        where: {
          id: notification.id
        },
        data: {
          readAt: new Date()
        },
        select: {
          id: true
        }
      }), { route: "notification-destination" });
  }

  await publishReadBestEffort(userId, notification.id);

  return { id: notification.id };
}

export async function markAllNotificationsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: {
      recipientId: userId,
      readAt: null,
      type: {
        not: "MESSAGE"
      }
    },
    data: {
      readAt: new Date()
    }
  });

  if (result.count > 0) {
    await publishReadAllBestEffort(userId);
  }

  return result.count;
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: {
      recipientId: userId,
      readAt: null,
      type: {
        not: "MESSAGE"
      }
    }
  });
}

export function toAppNotification(notification: NotificationRecord): AppNotification {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
    actor: notification.actor,
    postId: notification.postId,
    commentId: notification.commentId,
    conversationId: notification.conversationId,
    friendshipId: notification.friendshipId
  };
}

async function publishNotificationBestEffort(userId: string, notification: AppNotification) {
  try {
    await publishNotificationCreated(userId, notification);
  } catch (error) {
    logAblyFailure("notification publish failed", error);
  }
}

async function publishReadBestEffort(userId: string, notificationId: string) {
  try {
    await measureAsync(
      "notification.service.ablyPublish",
      () => publishNotificationRead(userId, notificationId),
      { route: "notification-destination" }
    );
  } catch (error) {
    logAblyFailure("notification read publish failed", error);
  }
}

async function publishReadAllBestEffort(userId: string) {
  try {
    await publishNotificationsReadAll(userId);
  } catch (error) {
    logAblyFailure("notifications read-all publish failed", error);
  }
}

function logAblyFailure(message: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[ably] ${message}`, error);
  }
}
