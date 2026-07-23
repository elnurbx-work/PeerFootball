"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, MessageCircle, Repeat2, ThumbsUp, UserPlus, Users } from "lucide-react";
import { markNotificationReadAction } from "@/actions/notification.actions";
import { cn } from "@/lib/utils";
import { getActorDisplayName } from "@/lib/notifications/notification-copy";
import type { NotificationListItem, NotificationType } from "@/types/notification.types";
import { useI18n } from "@/components/i18n/i18n-provider";
import { RelativeTime } from "@/components/i18n/relative-time";
import { logPerformance, measureAsync, performanceNow } from "@/lib/performance";

type NotificationItemProps = {
  notification: NotificationListItem;
  onNavigate?: () => void;
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

export function NotificationItem({ notification, onNavigate, onRead }: NotificationItemProps) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const Icon = typeIcon[notification.type] ?? Bell;
  const actorName = getActorDisplayName(notification.actor, t("notifications.someone"));
  const isUnread = !notification.readAt;

  async function handleClick() {
    const navigationStartedAt = performanceNow();

    if (pending) {
      return;
    }

    if (!isUnread) {
      onNavigate?.();
      logPerformance("notification.navigation.beforePush", performanceNow() - navigationStartedAt, "success", {
        route: "notification-destination",
        notificationWasUnread: false,
        hasDestination: Boolean(notification.href)
      });
      router.push(notification.href);
      return;
    }

    setPending(true);
    const result = await measureAsync(
      "notification.navigation.markReadAction",
      () => markNotificationReadAction(notification.id),
      {
        route: "notification-destination",
        notificationWasUnread: true,
        hasDestination: Boolean(notification.href)
      }
    );

    if (result.ok) {
      onRead?.(notification.id);
    }

    setPending(false);
    onNavigate?.();
    logPerformance("notification.navigation.beforePush", performanceNow() - navigationStartedAt, "success", {
      route: "notification-destination",
      notificationWasUnread: true,
      hasDestination: Boolean(notification.href)
    });
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
        <span className="mt-1 block text-xs text-muted-foreground">
          <RelativeTime value={notification.createdAt} locale={locale} />
        </span>
      </span>

      {isUnread ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" /> : null}
    </button>
  );
}
