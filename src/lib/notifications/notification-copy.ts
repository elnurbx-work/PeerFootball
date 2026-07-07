import type { AppNotification, NotificationActor, NotificationListItem, NotificationType } from "@/types/notification.types";

const fallbackActorName = "Someone";

const notificationCopy: Record<NotificationType, (actorName: string) => string> = {
  POST_LIKE: (actorName) => `${actorName} liked your post`,
  POST_COMMENT: (actorName) => `${actorName} commented on your post`,
  COMMENT_REPLY: (actorName) => `${actorName} replied to your comment`,
  POST_REPOST: (actorName) => `${actorName} reposted your post`,
  FRIEND_REQUEST: (actorName) => `${actorName} sent you a friend request`,
  FRIEND_ACCEPTED: (actorName) => `${actorName} accepted your friend request`,
  MESSAGE: (actorName) => `${actorName} sent you a message`
};

export function getNotificationText(notification: Pick<AppNotification, "actor" | "body" | "title" | "type">) {
  if (notification.body) {
    return notification.body;
  }

  if (notification.title) {
    return notification.title;
  }

  return notificationCopy[notification.type](getActorDisplayName(notification.actor));
}

export function getActorDisplayName(actor: NotificationActor | null) {
  return actor?.name || actor?.username || fallbackActorName;
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

export function toNotificationListItem(notification: AppNotification): NotificationListItem {
  return {
    ...notification,
    href: getNotificationHref(notification),
    text: getNotificationText(notification)
  };
}
