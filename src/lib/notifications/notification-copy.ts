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
  if (notification.type === "CLUB_INVITATION") return notification.body ?? `${actor} sizi kluba dəvət etdi`;
  if (notification.type === "CLUB_CHAT_MESSAGE_PINNED") return notification.body ?? `${actor} klub mesajını sabitlədi`;
  if (notification.type.startsWith("CLUB_CHAT_")) return notification.body ?? notification.title ?? `${actor} klub söhbətində sizi qeyd etdi`;
  if (notification.type.startsWith("MATCH_")) return notification.body ?? notification.title ?? notification.type.replaceAll("_", " ");
  return t("notifications.copy.message", { actor });
}

export function getActorDisplayName(actor: NotificationActor | null, fallback: string) {
  return actor?.name || actor?.username || fallback;
}

export function getNotificationHref(notification: Pick<AppNotification, "actor" | "commentId" | "conversationId" | "friendshipId" | "matchId" | "postId" | "type">) {
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
    case "DIRECT_MESSAGE":
      return notification.conversationId
        ? `/direct?tab=messages&conversationId=${notification.conversationId}`
        : "/direct?tab=messages";
    case "CLUB_CHAT_MENTION":
    case "CLUB_CHAT_REPLY":
    case "CLUB_CHAT_MESSAGE_PINNED":
    case "CLUB_CHAT_ANNOUNCEMENT":
      return notification.conversationId
        ? `/direct?tab=clubs&conversationId=${notification.conversationId}`
        : "/direct?tab=clubs";
    case "CLUB_INVITATION":
      return "/clubs";
    case "MATCH_INVITATION_RECEIVED":
    case "MATCH_INVITATION_ACCEPTED":
    case "MATCH_INVITATION_REJECTED":
    case "MATCH_CANCELLED":
    case "MATCH_PLAYER_INVITED":
    case "MATCH_ATTENDANCE_UPDATED":
    case "MATCH_RESULT_SUBMITTED":
    case "MATCH_RESULT_CONFIRMED":
    case "MATCH_RESULT_DISPUTED":
    case "MATCH_COMPLETED":
      return notification.matchId ? `/matches/${notification.matchId}` : "/matches";
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
