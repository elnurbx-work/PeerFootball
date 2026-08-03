import type { Locale } from "@/i18n/config";
import { getNotificationHref } from "@/lib/notifications/notification-copy";
import type { AppNotification, NotificationType } from "@/types/notification.types";
import type { PushNotificationPayload } from "@/types/push.types";

export const DEFAULT_PUSH_PAYLOAD: PushNotificationPayload = {
  title: "PeerFootball",
  body: "Yeni bildirişiniz var.",
  icon: "/icons/icon-192",
  badge: "/icons/icon-192",
  url: "/notifications"
};

type PushCopy = { title: string; body: string };

export function buildPushPayloadFromNotification(
  notification: AppNotification,
  locale: Locale = "az"
): PushNotificationPayload {
  const actor = notification.actor?.name || notification.actor?.username || localized(locale, "Biri", "Someone", "Кто-то");
  const copy = getPushCopy(notification.type, actor, locale, notification.title, notification.body);
  const entityId = notification.matchId
    ?? notification.conversationId
    ?? notification.friendshipId
    ?? notification.commentId
    ?? notification.postId
    ?? notification.id;

  return {
    ...copy,
    icon: "/icons/icon-192",
    badge: "/icons/icon-192",
    tag: `${notification.type.toLowerCase()}-${entityId}`,
    url: getNotificationHref(notification),
    notificationId: notification.id,
    type: notification.type,
    data: {
      ...(notification.matchId ? { matchId: notification.matchId } : {}),
      ...(notification.conversationId ? { conversationId: notification.conversationId } : {})
    }
  };
}

export function normalizePushPayload(value: unknown): PushNotificationPayload {
  if (!value || typeof value !== "object") return DEFAULT_PUSH_PAYLOAD;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.title !== "string" || typeof candidate.body !== "string" || typeof candidate.url !== "string") {
    return DEFAULT_PUSH_PAYLOAD;
  }

  return {
    title: candidate.title,
    body: candidate.body,
    url: candidate.url,
    ...(typeof candidate.icon === "string" ? { icon: candidate.icon } : {}),
    ...(typeof candidate.badge === "string" ? { badge: candidate.badge } : {}),
    ...(typeof candidate.image === "string" ? { image: candidate.image } : {}),
    ...(typeof candidate.tag === "string" ? { tag: candidate.tag } : {}),
    ...(typeof candidate.notificationId === "string" ? { notificationId: candidate.notificationId } : {})
  };
}

export function shouldDeletePushSubscription(statusCode: number | undefined) {
  return statusCode === 404 || statusCode === 410;
}

export function getPushPreferenceKey(type: NotificationType) {
  switch (type) {
    case "MESSAGE":
    case "DIRECT_MESSAGE":
      return "pushDirectMessages" as const;
    case "FRIEND_REQUEST":
    case "FRIEND_ACCEPTED":
    case "POST_LIKE":
    case "POST_COMMENT":
    case "COMMENT_REPLY":
    case "POST_REPOST":
      return "pushFriendRequests" as const;
    case "CLUB_INVITATION":
    case "CLUB_CHAT_MENTION":
    case "CLUB_CHAT_REPLY":
    case "CLUB_CHAT_MESSAGE_PINNED":
    case "CLUB_CHAT_ANNOUNCEMENT":
      return "pushClubNotifications" as const;
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
      return "pushMatchNotifications" as const;
    default:
      return assertNever(type);
  }
}

function getPushCopy(type: NotificationType, actor: string, locale: Locale, title: string | null, body: string | null): PushCopy {
  switch (type) {
    case "MESSAGE":
    case "DIRECT_MESSAGE":
      return {
        title: localized(locale, "Yeni mesaj", "New message", "Новое сообщение"),
        body: localized(locale, `${actor} sizə yeni mesaj göndərdi.`, `${actor} sent you a new message.`, `${actor} отправил(а) вам новое сообщение.`)
      };
    case "FRIEND_REQUEST":
      return generic(locale, "Yeni dostluq sorğusu", "New friend request", "Новый запрос в друзья", actor, "sizə dostluq sorğusu göndərdi", "sent you a friend request", "отправил(а) вам запрос в друзья");
    case "FRIEND_ACCEPTED":
      return generic(locale, "Dostluq sorğusu qəbul edildi", "Friend request accepted", "Запрос в друзья принят", actor, "dostluq sorğunuzu qəbul etdi", "accepted your friend request", "принял(а) ваш запрос в друзья");
    case "POST_LIKE":
      return generic(locale, "Yeni bəyənmə", "New like", "Новая отметка «Нравится»", actor, "paylaşımınızı bəyəndi", "liked your post", "оценил(а) вашу публикацию");
    case "POST_COMMENT":
      return generic(locale, "Yeni şərh", "New comment", "Новый комментарий", actor, "paylaşımınıza şərh yazdı", "commented on your post", "прокомментировал(а) вашу публикацию");
    case "COMMENT_REPLY":
      return generic(locale, "Yeni cavab", "New reply", "Новый ответ", actor, "şərhinizə cavab verdi", "replied to your comment", "ответил(а) на ваш комментарий");
    case "POST_REPOST":
      return generic(locale, "Yeni repost", "New repost", "Новый репост", actor, "paylaşımınızı repost etdi", "reposted your post", "поделился(-ась) вашей публикацией");
    case "CLUB_INVITATION":
      return { title: title || localized(locale, "Yeni klub dəvəti", "New club invitation", "Новое приглашение в клуб"), body: body || localized(locale, `${actor} sizi kluba dəvət etdi.`, `${actor} invited you to a club.`, `${actor} пригласил(а) вас в клуб.`) };
    case "CLUB_CHAT_MENTION":
    case "CLUB_CHAT_REPLY":
    case "CLUB_CHAT_MESSAGE_PINNED":
    case "CLUB_CHAT_ANNOUNCEMENT":
      return { title: title || localized(locale, "Yeni klub bildirişi", "New club notification", "Новое уведомление клуба"), body: body || localized(locale, "Klubunuzda yeni vacib bildiriş var.", "There is an important update in your club.", "В вашем клубе появилось важное обновление.") };
    case "MATCH_INVITATION_RECEIVED":
    case "MATCH_PLAYER_INVITED":
      return { title: title || localized(locale, "Yeni oyun dəvəti", "New match invitation", "Новое приглашение на матч"), body: body || localized(locale, "Yeni oyun dəvətiniz var.", "You have a new match invitation.", "У вас новое приглашение на матч.") };
    case "MATCH_INVITATION_ACCEPTED":
      return matchCopy(locale, title, body, "Oyun təklifi qəbul edildi", "Match proposal accepted", "Предложение матча принято");
    case "MATCH_INVITATION_REJECTED":
      return matchCopy(locale, title, body, "Oyun təklifi rədd edildi", "Match proposal declined", "Предложение матча отклонено");
    case "MATCH_RESULT_SUBMITTED":
      return matchCopy(locale, title, body, "Nəticə təsdiq gözləyir", "Result awaiting confirmation", "Результат ожидает подтверждения");
    case "MATCH_RESULT_CONFIRMED":
      return matchCopy(locale, title, body, "Nəticə təsdiqləndi", "Result confirmed", "Результат подтверждён");
    case "MATCH_RESULT_DISPUTED":
      return matchCopy(locale, title, body, "Nəticəyə etiraz edildi", "Result disputed", "Результат оспорен");
    case "MATCH_CANCELLED":
      return matchCopy(locale, title, body, "Oyun ləğv edildi", "Match cancelled", "Матч отменён");
    case "MATCH_ATTENDANCE_UPDATED":
      return matchCopy(locale, title, body, "İştirak statusu yeniləndi", "Attendance updated", "Статус участия обновлён");
    case "MATCH_COMPLETED":
      return matchCopy(locale, title, body, "Oyun tamamlandı", "Match completed", "Матч завершён");
    default:
      return assertNever(type);
  }
}

function generic(locale: Locale, azTitle: string, enTitle: string, ruTitle: string, actor: string, azAction: string, enAction: string, ruAction: string): PushCopy {
  return { title: localized(locale, azTitle, enTitle, ruTitle), body: localized(locale, `${actor} ${azAction}.`, `${actor} ${enAction}.`, `${actor} ${ruAction}.`) };
}

function matchCopy(locale: Locale, title: string | null, body: string | null, az: string, en: string, ru: string): PushCopy {
  return { title: title || localized(locale, az, en, ru), body: body || localized(locale, "Oyun məlumatlarını görmək üçün toxunun.", "Tap to view match details.", "Нажмите, чтобы открыть матч.") };
}

function localized(locale: Locale, az: string, en: string, ru: string) {
  return locale === "en" ? en : locale === "ru" ? ru : az;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled notification type: ${String(value)}`);
}
