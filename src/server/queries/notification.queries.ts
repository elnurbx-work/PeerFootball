import "server-only";

import { prisma } from "@/lib/prisma";
import {
  getUnreadNotificationCount as getUnreadNotificationCountFromService,
  notificationInclude,
  toAppNotification
} from "@/server/services/notification.service";
import type { AppNotification } from "@/types/notification.types";

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const notifications = await prisma.notification.findMany({
    where: {
      recipientId: userId
    },
    include: notificationInclude,
    orderBy: {
      createdAt: "desc"
    },
    take: 30
  });

  return notifications.map(toAppNotification);
}

export async function getUnreadNotificationCount(userId: string) {
  return getUnreadNotificationCountFromService(userId);
}

export async function getNotificationById(notificationId: string, userId: string): Promise<AppNotification | null> {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      recipientId: userId
    },
    include: notificationInclude
  });

  return notification ? toAppNotification(notification) : null;
}
