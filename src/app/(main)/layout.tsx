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

export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true }
};

export default async function MainLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const currentUser = await getCurrentUser();
  const locale = currentUser?.locale ?? await getRequestLocale();
  const [notifications, unreadNotificationCount, unreadDirectConversationCounts] = currentUser
    ? await Promise.all([
        getNotifications(currentUser.id),
        getUnreadNotificationCount(currentUser.id),
        getUnreadDirectConversationCounts(currentUser.id)
      ])
    : [[], 0, {}];

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
