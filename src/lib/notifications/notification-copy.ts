import type { AppNotification, NotificationActor, NotificationListItem, NotificationType } from "@/types/notification.types";
import type { Translate } from "@/i18n/dictionary";

export function getNotificationText(notification: Pick<AppNotification, "actor" | "body" | "title" | "type">, t: Translate) {
  const actor = getActorDisplayName(notification.actor, t("notifications.someone"));
  if (notification.type === "POST_LIKE") return t("notifications.copy.postLike", { actor });
  if (notification.type === "POST_COMMENT") return t("notifications.copy.postComment", { actor });
  if (notification.type === "COMMENT_REPLY") return t("notifications.copy.commentReply", { actor });
  if (notification.type === "POST_REPOST") return t("notifications.copy.postRepost", { actor });
  if (notification.type === "FRIEND_REQUEST") return t("notifications.copy.friendRequest", { actor });
  if (notification.type === "FRIEND_ACCEPTED") return t("notifications.copy.friendAccepted", { actor });
  return t("notifications.copy.message", { actor });
}

export function getActorDisplayName(actor: NotificationActor | null, fallback: string) {
  return actor?.name || actor?.username || fallback;
}

export function getNotificationHref(notification: Pick<AppNotification, "actor" | "commentId" | "conversationId" | "friendshipId" | "postId" | "type">) {
  switch (notification.type) {
    case "POST_LIKE":
    case "POST_COMMENT":
    case "COMMENT_REPLY":
    case "POST_REPOST":
      return notification.postId ? `/feed#post-${notification.postId}` : "/feed";
    case "FRIEND_REQUEST":
      return "/friends?tab=incoming";
    case "FRIEND_ACCEPTED":
      return notification.actor ? `/profile/${notification.actor.username ?? notification.actor.id}` : "/friends";
    case "MESSAGE":
      return notification.conversationId ? `/direct?conversationId=${notification.conversationId}` : "/direct";
    default:
      return "/notifications";
  }
}

export function toNotificationListItem(notification: AppNotification, t: Translate): NotificationListItem {
  return {
    ...notification,
    href: getNotificationHref(notification),
    text: getNotificationText(notification, t)
  };
}
