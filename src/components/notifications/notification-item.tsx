"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, MessageCircle, Repeat2, ThumbsUp, UserPlus, Users } from "lucide-react";
import { markNotificationReadAction } from "@/actions/notification.actions";
import { cn } from "@/lib/utils";
import { getActorDisplayName } from "@/lib/notifications/notification-copy";
import type { NotificationListItem, NotificationType } from "@/types/notification.types";

type NotificationItemProps = {
  notification: NotificationListItem;
  onRead?: (notificationId: string) => void;
};

const typeIcon: Record<NotificationType, typeof Bell> = {
  POST_LIKE: ThumbsUp,
  POST_COMMENT: MessageCircle,
  COMMENT_REPLY: MessageCircle,
  POST_REPOST: Repeat2,
  FRIEND_REQUEST: UserPlus,
  FRIEND_ACCEPTED: CheckCircle2,
  MESSAGE: MessageCircle
};

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const Icon = typeIcon[notification.type] ?? Bell;
  const actorName = getActorDisplayName(notification.actor);
  const isUnread = !notification.readAt;

  async function handleClick() {
    if (pending) {
      return;
    }

    if (!isUnread) {
      router.push(notification.href);
      return;
    }

    setPending(true);
    const result = await markNotificationReadAction(notification.id);

    if (result.ok) {
      onRead?.(notification.id);
    }

    setPending(false);
    router.push(notification.href);
  }

  return (
    <button
      className={cn(
        "flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-secondary",
        isUnread && "bg-primary/5"
      )}
      disabled={pending}
      type="button"
      onClick={handleClick}
    >
      <div className="relative shrink-0">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold">
          {notification.actor?.image ? (
            <img src={notification.actor.image} alt="" className="h-full w-full object-cover" />
          ) : (
            actorName.charAt(0)
          )}
        </div>
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border bg-card">
          <Icon className="h-3 w-3 text-primary" />
        </span>
      </div>

      <span className="min-w-0 flex-1">
        <span className={cn("block break-words text-sm leading-5", isUnread ? "font-semibold" : "font-medium")}>
          {notification.text}
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">{formatRelativeTime(notification.createdAt)}</span>
      </span>

      {isUnread ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" /> : null}
    </button>
  );
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diffSeconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));

  if (diffSeconds < 60) {
    return "just now";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}
