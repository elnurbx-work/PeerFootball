"use client";

import { useEffect, useRef, useState } from "react";
import { Realtime, type InboundMessage } from "ably";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { getUserInboxChannelName, NOTIFICATION_EVENTS } from "@/lib/ably-channels";
import { cn } from "@/lib/utils";
import { toNotificationListItem } from "@/lib/notifications/notification-copy";
import type { AppNotification, NotificationListItem } from "@/types/notification.types";
import { useI18n } from "@/components/i18n/i18n-provider";

type NotificationBellProps = {
  currentUserId: string;
  initialNotifications: AppNotification[];
  initialUnreadCount: number;
};

export function NotificationBell({
  currentUserId,
  initialNotifications,
  initialUnreadCount
}: NotificationBellProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationListItem[]>(
    initialNotifications.map((notification) => toNotificationListItem(notification, t))
  );
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  useEffect(() => {
    setNotifications(initialNotifications.map((notification) => toNotificationListItem(notification, t)));
  }, [initialNotifications, t]);

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const channelName = getUserInboxChannelName(currentUserId);
    const ably = new Realtime({
      authUrl: `/api/ably/token?channel=${encodeURIComponent(channelName)}`,
      closeOnUnload: true
    });
    const channel = ably.channels.get(channelName);

    const handleNewNotification = (message: InboundMessage) => {
      const notification = toNotificationListItem(message.data as AppNotification, t);

      if (notification.type === "MESSAGE") {
        return;
      }

      setNotifications((current) => {
        if (current.some((item) => item.id === notification.id)) {
          return current;
        }

        return [notification, ...current].slice(0, 30);
      });

      if (!notification.readAt) {
        setUnreadCount((count) => count + 1);
      }
    };

    const handleNotificationRead = (message: InboundMessage) => {
      const payload = message.data as { notificationId: string };

      markLocalRead(payload.notificationId);
    };

    const handleNotificationsReadAll = () => {
      markLocalReadAll();
    };

    channel.subscribe(NOTIFICATION_EVENTS.notificationNew, handleNewNotification).catch((error) => {
      debugRealtime("notification subscription error", error);
    });
    channel.subscribe(NOTIFICATION_EVENTS.notificationRead, handleNotificationRead).catch((error) => {
      debugRealtime("notification read subscription error", error);
    });
    channel.subscribe(NOTIFICATION_EVENTS.notificationsReadAll, handleNotificationsReadAll).catch((error) => {
      debugRealtime("notification read-all subscription error", error);
    });

    return () => {
      channel.unsubscribe(NOTIFICATION_EVENTS.notificationNew, handleNewNotification);
      channel.unsubscribe(NOTIFICATION_EVENTS.notificationRead, handleNotificationRead);
      channel.unsubscribe(NOTIFICATION_EVENTS.notificationsReadAll, handleNotificationsReadAll);
      ably.close();
    };
  }, [currentUserId, t]);

  function markLocalRead(notificationId: string) {
    const readAt = new Date().toISOString();

    setNotifications((current) => {
      let changed = false;
      const nextNotifications = current.map((notification) => {
        if (notification.id !== notificationId || notification.readAt) {
          return notification;
        }

        changed = true;
        return {
          ...notification,
          readAt
        };
      });

      if (changed) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }

      return nextNotifications;
    });
  }

  function markLocalReadAll() {
    const readAt = new Date().toISOString();

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        readAt: notification.readAt ?? readAt
      }))
    );
    setUnreadCount(0);
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        className={cn(
          "relative h-11 w-11 px-0 text-muted-foreground hover:text-foreground",
          open && "bg-secondary text-foreground"
        )}
        title={t("notifications.title")}
        type="button"
        variant="ghost"
        aria-label={t("notifications.title")}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <NotificationDropdown
          notifications={notifications}
          onClose={() => setOpen(false)}
          onRead={markLocalRead}
          onReadAll={markLocalReadAll}
        />
      ) : null}
    </div>
  );
}

function debugRealtime(message: string, details?: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[ably] ${message}`, details);
  }
}
