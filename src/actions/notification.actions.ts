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
import { getServerTranslator } from "@/i18n/server";
import { measureAsync } from "@/lib/performance";

export async function markNotificationReadAction(notificationId: string): Promise<ApiResponse<{ notificationId: string }>> {
  const t = await getServerTranslator();
  const user = await measureAsync("notification.action.currentUser", getCurrentUser, {
    route: "notification-destination"
  });

  if (!user) {
    return { ok: false, message: t("responses.signInRequired") };
  }

  const notification = await measureAsync(
    "notification.action.lookup",
    () => getNotificationById(notificationId, user.id),
    { route: "notification-destination" }
  );

  if (!notification) {
    return {
      ok: false,
      message: t("responses.notification.notFound")
    };
  }

  const result = await measureAsync(
    "notification.action.markAsRead",
    () => markNotificationRead(notification.id, user.id),
    { route: "notification-destination" }
  );

  if (!result) {
    return {
      ok: false,
      message: t("responses.notification.notFound")
    };
  }

  revalidatePath("/notifications");

  return {
    ok: true,
    message: t("responses.notification.read"),
    data: {
      notificationId: result.id
    }
  };
}

export async function markAllNotificationsReadAction(): Promise<ApiResponse<{ count: number }>> {
  const t = await getServerTranslator();
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, message: t("responses.signInRequired") };
  }

  const count = await markAllNotificationsRead(user.id);

  revalidatePath("/notifications");

  return {
    ok: true,
    message: t("responses.notification.allRead"),
    data: {
      count
    }
  };
}

export async function deleteNotificationAction(notificationId: string): Promise<ApiResponse<{ notificationId: string }>> {
  const t = await getServerTranslator();
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, message: t("responses.signInRequired") };
  }

  const notification = await getNotificationById(notificationId, user.id);

  if (!notification) {
    return {
      ok: false,
      message: t("responses.notification.notFound")
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
    message: t("responses.notification.deleted"),
    data: {
      notificationId: notification.id
    }
  };
}
