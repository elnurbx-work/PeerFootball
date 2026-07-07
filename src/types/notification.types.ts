import type { NotificationType as PrismaNotificationType } from "@prisma/client";

export type NotificationType = PrismaNotificationType;

export type NotificationActor = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string | null;
  body: string | null;
  readAt: string | null;
  createdAt: string;
  actor: NotificationActor | null;
  postId: string | null;
  commentId: string | null;
  conversationId: string | null;
  friendshipId: string | null;
};

export type NotificationListItem = AppNotification & {
  href: string;
  text: string;
};
