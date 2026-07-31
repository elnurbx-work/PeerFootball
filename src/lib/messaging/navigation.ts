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
