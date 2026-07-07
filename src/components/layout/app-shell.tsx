"use client";

import type { ReactNode } from "react";
import type { SessionUser } from "@/types/auth.types";
import { SiteSidebar } from "@/components/layout/site-sidebar";
import { useSecondaryPanel } from "@/components/layout/site-sidebar-nav";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/notification.types";

type AppShellProps = {
  children: ReactNode;
  currentUser: SessionUser | null;
  initialNotifications: AppNotification[];
  initialUnreadNotificationCount: number;
};

export function AppShell({
  children,
  currentUser,
  initialNotifications,
  initialUnreadNotificationCount
}: AppShellProps) {
  const hasSecondaryPanel = useSecondaryPanel();

  return (
    <>
      <SiteSidebar
        currentUser={currentUser}
        initialNotifications={initialNotifications}
        initialUnreadNotificationCount={initialUnreadNotificationCount}
      />
      <main
        className={cn(
          "min-h-screen pb-20 md:pb-0",
          hasSecondaryPanel ? "md:pl-80" : "md:pl-20"
        )}
      >
        {children}
      </main>
    </>
  );
}
