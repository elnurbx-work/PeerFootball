import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth";
import {
  getNotifications,
  getUnreadNotificationCount
} from "@/server/queries/notification.queries";

export default async function MainLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const currentUser = await getCurrentUser();
  const [notifications, unreadNotificationCount] = currentUser
    ? await Promise.all([
        getNotifications(currentUser.id),
        getUnreadNotificationCount(currentUser.id)
      ])
    : [[], 0];

  return (
    <AppShell
      currentUser={currentUser}
      initialNotifications={notifications}
      initialUnreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </AppShell>
  );
}
