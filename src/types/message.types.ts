import type { ConversationType } from "@prisma/client";

export type { ConversationType };

export type ConversationMemberKey = {
  conversationId: string;
  userId: string;
  encryptedConversationKey: string;
  keyVersion: number;
};

export type EncryptedMessagePayload = {
  ciphertext: string;
  iv: string;
  authTag: string;
  algorithm: "aes-256-gcm";
  keyVersion: 1;
};

export type MessageSender = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  sender: MessageSender;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isOwnMessage: boolean;
};

export type RealtimeChatMessage = Omit<ChatMessage, "isOwnMessage">;

export type ConversationSummary = {
  id: string;
  type: ConversationType;
  createdAt: string;
  updatedAt: string;
  members: MessageSender[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
};

export type ConversationUpdatePayload = {
  conversationId: string;
  lastMessage: RealtimeChatMessage | null;
  updatedAt: string;
};

export type DirectFriend = MessageSender & {
  conversationId: string | null;
  lastMessage: ChatMessage | null;
  unreadCount: number;
};

export type SendMessageInput = {
  conversationId?: string;
  recipientId?: string;
  content: string;
};
