import type { ConversationType } from "@prisma/client";

export type { ConversationType };

export type ConversationMemberKey = {
  conversationId: string;
  userId: string;
  encryptedConversationKey: string;
  keyVersion: number;
};

export type EncryptedMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  ciphertext: string;
  iv: string;
  algorithm: "AES-GCM" | string;
  keyVersion: number;
  createdAt: Date;
  editedAt?: Date | null;
  deletedAt?: Date | null;
};
