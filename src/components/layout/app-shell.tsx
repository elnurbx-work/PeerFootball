"use client";

import type { ReactNode } from "react";
import type { SessionUser } from "@/types/auth.types";
import { SiteSidebar } from "@/components/layout/site-sidebar";
import { useSecondaryPanel } from "@/components/layout/site-sidebar-nav";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notification.types";
import { PushSubscriptionSessionSync } from "@/components/push/push-subscription-session-sync";

type AppShellProps = {
  children: ReactNode;
  currentUser: SessionUser | null;
  initialNotifications: AppNotification[];
  initialUnreadDirectConversationCounts: Record<string, number>;
  initialUnreadNotificationCount: number;
};

export function AppShell({
  children,
  currentUser,
  initialNotifications,
  initialUnreadDirectConversationCounts,
  initialUnreadNotificationCount
}: AppShellProps) {
  const hasSecondaryPanel = useSecondaryPanel();

  return (
    <>
      {currentUser ? <PushSubscriptionSessionSync userId={currentUser.id} /> : null}
      <SiteSidebar
        currentUser={currentUser}
        initialNotifications={initialNotifications}
        initialUnreadDirectConversationCounts={initialUnreadDirectConversationCounts}
        initialUnreadNotificationCount={initialUnreadNotificationCount}
      />
      <main
        className={cn(
          "min-h-screen min-w-0 pb-20 md:pb-0",
          hasSecondaryPanel ? "md:pl-80" : "md:pl-20"
        )}
      >
        {children}
      </main>
    </>
  );
}
