import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptMessage } from "@/server/services/message-encryption.service";
import type { ChatMessage, ConversationSummary, EncryptedMessagePayload, RealtimeChatMessage } from "@/types/message.types";

const messageSenderSelect = {
  id: true,
  name: true,
  username: true,
  image: true
} as const;

const messageInclude = {
  sender: {
    select: messageSenderSelect
  }
} satisfies Prisma.MessageInclude;

type MessageRecord = Prisma.MessageGetPayload<{
  include: typeof messageInclude;
}>;

export async function isConversationMember(conversationId: string, userId: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId
      }
    },
    select: {
      id: true
    }
  });

  return Boolean(membership);
}

export async function getConversationMessages(conversationId: string, currentUserId: string): Promise<ChatMessage[]> {
  if (!(await isConversationMember(conversationId, currentUserId))) {
    return [];
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId
    },
    include: messageInclude,
    orderBy: {
      createdAt: "asc"
    },
    take: 100
  });

  return messages.map((message) => toChatMessage(message, currentUserId));
}

export async function getLatestConversationMessage(conversationId: string): Promise<RealtimeChatMessage | null> {
  const message = await prisma.message.findFirst({
    where: {
      conversationId
    },
    include: messageInclude,
    orderBy: {
      createdAt: "desc"
    }
  });

  return message ? toRealtimeChatMessage(message) : null;
}

export async function getConversationSummaries(currentUserId: string): Promise<ConversationSummary[]> {
  const conversations = await prisma.conversation.findMany({
    where: {
      members: {
        some: {
          userId: currentUserId
        }
      }
    },
    include: {
      members: {
        include: {
          user: {
            select: messageSenderSelect
          }
        }
      },
      messages: {
        include: messageInclude,
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return Promise.all(
    conversations.map(async (conversation) => {
      const currentMember = conversation.members.find((member) => member.userId === currentUserId);
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          deletedAt: null,
          senderId: {
            not: currentUserId
          },
          ...(currentMember?.lastReadAt
            ? {
                createdAt: {
                  gt: currentMember.lastReadAt
                }
              }
            : {})
        }
      });

      return {
        id: conversation.id,
        type: conversation.type,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        members: conversation.members.map((member) => member.user),
        lastMessage: conversation.messages[0] ? toChatMessage(conversation.messages[0], currentUserId) : null,
        unreadCount
      };
    })
  );
}

export async function findDirectConversationForUsers(userAId: string, userBId: string) {
  return prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        {
          members: {
            some: {
              userId: userAId
            }
          }
        },
        {
          members: {
            some: {
              userId: userBId
            }
          }
        }
      ]
    },
    select: {
      id: true
    }
  });
}

export function toChatMessage(message: MessageRecord, currentUserId: string): ChatMessage {
  return {
    ...toRealtimeChatMessage(message),
    isOwnMessage: message.senderId === currentUserId
  };
}

export function toRealtimeChatMessage(message: MessageRecord): RealtimeChatMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    sender: message.sender,
    content: message.deletedAt ? "Message deleted" : decryptMessage(toEncryptedPayload(message)),
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    deletedAt: message.deletedAt?.toISOString() ?? null
  };
}

function toEncryptedPayload(message: {
  ciphertext: string;
  iv: string;
  authTag: string;
  algorithm: string;
  keyVersion: number;
}): EncryptedMessagePayload {
  return {
    ciphertext: message.ciphertext,
    iv: message.iv,
    authTag: message.authTag,
    algorithm: message.algorithm as EncryptedMessagePayload["algorithm"],
    keyVersion: message.keyVersion as EncryptedMessagePayload["keyVersion"]
  };
}
