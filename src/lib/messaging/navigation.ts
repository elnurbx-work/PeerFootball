export type MessagingTab = "messages" | "clubs";

export function resolveMessagingTab(value?: string): MessagingTab {
  return value === "clubs" ? "clubs" : "messages";
}

export function directMessagingHref(conversationId?: string | null) {
  return conversationId
    ? `/direct?tab=messages&conversationId=${encodeURIComponent(conversationId)}`
    : "/direct?tab=messages";
}

export function clubMessagingHref(clubId?: string | null) {
  return clubId
    ? `/direct?tab=clubs&clubId=${encodeURIComponent(clubId)}`
    : "/direct?tab=clubs";
}

export function sumUnreadCounts(counts: Record<string, number>) {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}

export function sortConversationsByLatestMessage<T extends { lastMessage: { createdAt: string } | null }>(
  conversations: readonly T[]
) {
  return [...conversations].sort(
    (a, b) => getMessageTime(b.lastMessage) - getMessageTime(a.lastMessage)
  );
}

function getMessageTime(message: { createdAt: string } | null) {
  if (!message) return 0;
  const timestamp = Date.parse(message.createdAt);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
