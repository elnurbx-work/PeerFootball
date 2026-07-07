"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCheck, Inbox, X } from "lucide-react";
import { markAllNotificationsReadAction } from "@/actions/notification.actions";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "@/components/notifications/notification-item";
import type { NotificationListItem } from "@/types/notification.types";

type NotificationDropdownProps = {
  notifications: NotificationListItem[];
  onClose: () => void;
  onRead: (notificationId: string) => void;
  onReadAll: () => void;
};

export function NotificationDropdown({ notifications, onClose, onRead, onReadAll }: NotificationDropdownProps) {
  const [pending, setPending] = useState(false);
  const hasUnread = notifications.some((notification) => !notification.readAt);

  async function handleMarkAllRead() {
    if (pending || !hasUnread) {
      return;
    }

    setPending(true);
    const result = await markAllNotificationsReadAction();

    if (result.ok) {
      onReadAll();
    }

    setPending(false);
  }

  return (
    <div className="fixed bottom-20 right-3 z-50 w-[calc(100vw-1.5rem)] max-w-sm overflow-hidden rounded-md border bg-card shadow-xl md:bottom-auto md:left-16 md:right-auto md:top-4">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-foreground">Latest activity</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            className="h-9 px-2"
            disabled={pending || !hasUnread}
            size="sm"
            type="button"
            variant="ghost"
            aria-label="Mark all notifications as read"
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="h-4 w-4" />
          </Button>
          <Button
            className="h-9 px-2"
            size="sm"
            type="button"
            variant="ghost"
            aria-label="Close notifications"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        {notifications.length ? (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onNavigate={onClose}
              onRead={onRead}
            />
          ))
        ) : (
          <div className="grid gap-2 px-4 py-8 text-center">
            <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="text-xs text-muted-foreground">Likes, comments, messages, and friend requests will appear here.</p>
          </div>
        )}
      </div>

      <Link
        className="block border-t px-4 py-3 text-center text-sm font-medium text-primary hover:bg-secondary"
        href="/notifications"
        onClick={onClose}
      >
        View all
      </Link>
    </div>
  );
}
