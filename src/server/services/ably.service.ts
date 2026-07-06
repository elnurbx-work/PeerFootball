import "server-only";

import { Rest } from "ably";
import { getRoomChannelName, getUserInboxChannelName, INBOX_EVENTS, ROOM_EVENTS } from "@/lib/ably-channels";
import type { ConversationUpdatePayload, RealtimeChatMessage } from "@/types/message.types";

type ConversationReadPayload = {
  conversationId: string;
  readAt: string;
  userId: string;
};

let ablyRestClient: Rest | null = null;

export function getAblyRestClient() {
  const apiKey = process.env.ABLY_API_KEY;

  if (!apiKey) {
    throw new Error("ABLY_API_KEY is not configured.");
  }

  ablyRestClient ??= new Rest({ key: apiKey });

  return ablyRestClient;
}

export async function publishMessageCreated(conversationId: string, messagePayload: RealtimeChatMessage) {
  await publishToChannel(getRoomChannelName(conversationId), ROOM_EVENTS.messageNew, messagePayload);
}

export async function publishMessageDeleted(conversationId: string, messageId: string) {
  await publishToChannel(getRoomChannelName(conversationId), ROOM_EVENTS.messageDelete, {
    conversationId,
    messageId
  });
}

export async function publishConversationUpdated(userId: string, payload: ConversationUpdatePayload) {
  await publishToChannel(getUserInboxChannelName(userId), INBOX_EVENTS.conversationUpdate, payload);
}

export async function publishConversationRead(conversationId: string, userId: string) {
  await publishToChannel(getRoomChannelName(conversationId), ROOM_EVENTS.conversationRead, {
    conversationId,
    readAt: new Date().toISOString(),
    userId
  } satisfies ConversationReadPayload);
}

async function publishToChannel(channelName: string, eventName: string, payload: unknown) {
  await getAblyRestClient().channels.get(channelName).publish(eventName, payload);
}
