export const ROOM_EVENTS = {
  messageNew: "message:new",
  messageDelete: "message:delete",
  conversationRead: "conversation:read",
  typingStart: "typing:start",
  typingStop: "typing:stop"
} as const;

export const INBOX_EVENTS = {
  conversationUpdate: "conversation:update"
} as const;

export function getRoomChannelName(conversationId: string) {
  return `private:room:${conversationId}`;
}

export function getUserInboxChannelName(userId: string) {
  return `private:user:${userId}`;
}

export function parseRoomChannelName(channelName: string) {
  const match = /^private:room:([^:]+)$/.exec(channelName);

  return match?.[1] ?? null;
}

export function parseUserInboxChannelName(channelName: string) {
  const match = /^private:user:([^:]+)$/.exec(channelName);

  return match?.[1] ?? null;
}
