import "server-only";

import { cache } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  notificationInclude,
  toAppNotification
} from "@/server/services/notification.service";
import type { AppNotification } from "@/types/notification.types";

type NotificationCenterRow = {
  id: string;
  type: AppNotification["type"];
  title: string | null;
  body: string | null;
  readAt: Date | null;
  createdAt: Date;
  postId: string | null;
  commentId: string | null;
  conversationId: string | null;
  friendshipId: string | null;
  actorId: string | null;
  actorName: string | null;
  actorUsername: string | null;
  actorImage: string | null;
  unreadCount: number | bigint;
};

const getNotificationCenterData = cache(async (userId: string) => {
  const rows = await prisma.$queryRaw<NotificationCenterRow[]>(Prisma.sql`
    SELECT
      notification."id",
      notification."type",
      notification."title",
      notification."body",
      notification."readAt",
      notification."createdAt",
      notification."postId",
      notification."commentId",
      notification."conversationId",
      notification."friendshipId",
      actor."id" AS "actorId",
      actor."name" AS "actorName",
      actor."username" AS "actorUsername",
      actor."image" AS "actorImage",
      (COUNT(*) FILTER (WHERE notification."readAt" IS NULL) OVER ())::integer AS "unreadCount"
    FROM "Notification" AS notification
    LEFT JOIN "User" AS actor ON actor."id" = notification."actorId"
    WHERE notification."recipientId" = ${userId}
      AND notification."type" <> 'MESSAGE'
    ORDER BY notification."createdAt" DESC
    LIMIT 30
  `);

  return {
    notifications: rows.map((row): AppNotification => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      actor: row.actorId ? {
        id: row.actorId,
        name: row.actorName,
        username: row.actorUsername,
        image: row.actorImage
      } : null,
      postId: row.postId,
      commentId: row.commentId,
      conversationId: row.conversationId,
      friendshipId: row.friendshipId
    })),
    unreadCount: Number(rows[0]?.unreadCount ?? 0)
  };
});

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  return (await getNotificationCenterData(userId)).notifications;
}

export async function getUnreadNotificationCount(userId: string) {
  return (await getNotificationCenterData(userId)).unreadCount;
}

export async function getNotificationById(notificationId: string, userId: string): Promise<AppNotification | null> {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      recipientId: userId,
      type: {
        not: "MESSAGE"
      }
    },
    include: notificationInclude
  });

  return notification ? toAppNotification(notification) : null;
}
