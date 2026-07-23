import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentUser } from "@/lib/auth";
import {
  getNotifications,
  getUnreadNotificationCount
} from "@/server/queries/notification.queries";
import { getUnreadDirectConversationCounts } from "@/server/queries/message.queries";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { LocaleCookieSync } from "@/components/i18n/locale-cookie-sync";
import { getRequestLocale } from "@/i18n/server";
import { logPerformance, measureAsync, performanceNow } from "@/lib/performance";

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true }
};

export default async function MainLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const totalStartedAt = performanceNow();
  const currentUser = await measureAsync("mainLayout.currentUser", getCurrentUser, { route: "(main)" });
  const locale = currentUser?.locale ?? await getRequestLocale();
  const notificationsMetadata = { route: "(main)", notificationCount: 0 };
  const unreadNotificationsMetadata = { route: "(main)", unreadNotificationCount: 0 };
  const unreadDirectMetadata = { route: "(main)", unreadConversationCount: 0 };
  const [notifications, unreadNotificationCount, unreadDirectConversationCounts] = currentUser
    ? await Promise.all([
        measureAsync("mainLayout.notifications", async () => {
          const result = await getNotifications(currentUser.id);
          notificationsMetadata.notificationCount = result.length;
          return result;
        }, notificationsMetadata),
        measureAsync("mainLayout.unreadNotifications", async () => {
          const result = await getUnreadNotificationCount(currentUser.id);
          unreadNotificationsMetadata.unreadNotificationCount = result;
          return result;
        }, unreadNotificationsMetadata),
        measureAsync("mainLayout.unreadDirect", async () => {
          const result = await getUnreadDirectConversationCounts(currentUser.id);
          unreadDirectMetadata.unreadConversationCount = Object.keys(result).length;
          return result;
        }, unreadDirectMetadata)
      ])
    : [[], 0, {}];
  logPerformance("mainLayout.totalData", performanceNow() - totalStartedAt, "success", {
    route: "(main)",
    notificationCount: notifications.length,
    unreadNotificationCount,
    unreadConversationCount: Object.keys(unreadDirectConversationCounts).length
  });

  return (
    <I18nProvider locale={locale}>
      <LocaleCookieSync locale={locale} />
      <AppShell
      currentUser={currentUser}
      initialNotifications={notifications}
      initialUnreadDirectConversationCounts={unreadDirectConversationCounts}
      initialUnreadNotificationCount={unreadNotificationCount}
      >
        {children}
      </AppShell>
    </I18nProvider>
  );
}
