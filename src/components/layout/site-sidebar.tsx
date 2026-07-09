"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Realtime, type InboundMessage } from "ably";
import { LogIn, LogOut } from "lucide-react";
import { signOutAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  CreatePostButton,
  MatchTopButton,
  MobileBottomNav,
  SiteSidebarPanelNav,
  SiteSidebarRailNav
} from "@/components/layout/site-sidebar-nav";
import { getUserInboxChannelName, INBOX_EVENTS } from "@/lib/ably-channels";
import type { SessionUser } from "@/types/auth.types";
import type { ConversationUpdatePayload } from "@/types/message.types";
import type { AppNotification } from "@/types/notification.types";

type SiteSidebarProps = {
  currentUser: SessionUser | null;
  initialNotifications: AppNotification[];
  initialUnreadDirectConversationCounts: Record<string, number>;
  initialUnreadNotificationCount: number;
};

export function SiteSidebar({
  currentUser,
  initialNotifications,
  initialUnreadDirectConversationCounts,
  initialUnreadNotificationCount
}: SiteSidebarProps) {
  const unreadDirectConversationCounts = useUnreadDirectConversationCounts(
    currentUser?.id ?? null,
    initialUnreadDirectConversationCounts
  );
  const hasUnreadDirectMessages = useMemo(
    () => Object.values(unreadDirectConversationCounts).some((count) => count > 0),
    [unreadDirectConversationCounts]
  );

  return (
    <>
      {currentUser ? (
        <div className="fixed bottom-20 right-3 z-40 md:bottom-20 md:left-[18px] md:right-auto">
          <NotificationBell
            currentUserId={currentUser.id}
            initialNotifications={initialNotifications}
            initialUnreadCount={initialUnreadNotificationCount}
          />
        </div>
      ) : null}
      <aside className="fixed inset-y-0 left-0 z-30 hidden bg-background/95 shadow-sm backdrop-blur md:flex">
        <div className="flex w-20 shrink-0 flex-col items-center border-r px-2 py-4">
          <MatchTopButton />

          <SiteSidebarRailNav hasUnreadDirectMessages={hasUnreadDirectMessages} />
          <div className="mt-5">
            <CreatePostButton />
          </div>

          <div className="mt-auto grid gap-2">
            {currentUser ? (
              <form action={signOutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  className="h-11 w-11 px-0 text-muted-foreground hover:text-foreground"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Button asChild className="h-11 w-11 px-0" title="Login">
                <Link href="/auth/login" aria-label="Login">
                  <LogIn className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        <SiteSidebarPanelNav />
      </aside>
      <MobileBottomNav hasUnreadDirectMessages={hasUnreadDirectMessages} />
    </>
  );
}

function useUnreadDirectConversationCounts(
  currentUserId: string | null,
  initialCounts: Record<string, number>
) {
  const [counts, setCounts] = useState(initialCounts);

  useEffect(() => {
    setCounts(initialCounts);
  }, [initialCounts]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const channelName = getUserInboxChannelName(currentUserId);
    const ably = new Realtime({
      authUrl: `/api/ably/token?channel=${encodeURIComponent(channelName)}`,
      closeOnUnload: true
    });
    const channel = ably.channels.get(channelName);

    const handleConversationUpdate = (message: InboundMessage) => {
      const payload = message.data as ConversationUpdatePayload;

      setCounts((currentCounts) => {
        const currentCount = currentCounts[payload.conversationId] ?? 0;
        let nextCount = currentCount;

        if (typeof payload.unreadCount === "number") {
          nextCount = payload.unreadCount;
        } else if (payload.lastMessage && payload.lastMessage.senderId !== currentUserId) {
          nextCount = currentCount + 1;
        }

        if (nextCount === currentCount) {
          return currentCounts;
        }

        const nextCounts = { ...currentCounts };

        if (nextCount > 0) {
          nextCounts[payload.conversationId] = nextCount;
        } else {
          delete nextCounts[payload.conversationId];
        }

        return nextCounts;
      });
    };

    channel.subscribe(INBOX_EVENTS.conversationUpdate, handleConversationUpdate).catch((error) => {
      debugRealtime("direct badge subscription error", error);
    });

    return () => {
      channel.unsubscribe(INBOX_EVENTS.conversationUpdate, handleConversationUpdate);
      ably.close();
    };
  }, [currentUserId]);

  return counts;
}

function debugRealtime(message: string, details?: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[ably] ${message}`, details);
  }
}
