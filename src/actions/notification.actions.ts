"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getNotificationById } from "@/server/queries/notification.queries";
import {
  markAllNotificationsRead,
  markNotificationRead
} from "@/server/services/notification.service";
import type { ApiResponse } from "@/types/api.types";

export async function markNotificationReadAction(notificationId: string): Promise<ApiResponse<{ notificationId: string }>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const notification = await getNotificationById(notificationId, user.id);

  if (!notification) {
    return {
      ok: false,
      message: "Notification was not found."
    };
  }

  const result = await markNotificationRead(notification.id, user.id);

  if (!result) {
    return {
      ok: false,
      message: "Notification was not found."
    };
  }

  revalidatePath("/notifications");

  return {
    ok: true,
    message: "Notification marked as read.",
    data: {
      notificationId: result.id
    }
  };
}

export async function markAllNotificationsReadAction(): Promise<ApiResponse<{ count: number }>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const count = await markAllNotificationsRead(user.id);

  revalidatePath("/notifications");

  return {
    ok: true,
    message: "Notifications marked as read.",
    data: {
      count
    }
  };
}

export async function deleteNotificationAction(notificationId: string): Promise<ApiResponse<{ notificationId: string }>> {
  const user = await getCurrentUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const notification = await getNotificationById(notificationId, user.id);

  if (!notification) {
    return {
      ok: false,
      message: "Notification was not found."
    };
  }

  await prisma.notification.delete({
    where: {
      id: notification.id
    }
  });

  revalidatePath("/notifications");

  return {
    ok: true,
    message: "Notification deleted.",
    data: {
      notificationId: notification.id
    }
  };
}

function unauthenticatedResponse(): ApiResponse<never> {
  return {
    ok: false,
    message: "You need to sign in first."
  };
}
