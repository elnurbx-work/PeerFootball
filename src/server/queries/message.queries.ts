import "server-only";

import { Prisma } from "@prisma/client";
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
      id: true,
      conversation: {
        select: { clubId: true }
      }
    }
  });

  if (!membership) {
    return false;
  }

  if (!membership.conversation.clubId) {
    return true;
  }

  const activeClubMembership = await prisma.clubMember.findFirst({
    where: {
      clubId: membership.conversation.clubId,
      userId,
      status: "ACTIVE",
      club: { isActive: true }
    },
    select: { id: true }
  });

  return Boolean(activeClubMembership);
}

export async function getConversationMessages(conversationId: string, currentUserId: string): Promise<ChatMessage[]> {
  if (!(await isConversationMember(conversationId, currentUserId))) {
    return [];
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId
    },
    relationLoadStrategy: "join",
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
  const [conversations, unreadCounts] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId: currentUserId
          }
        }
      },
      relationLoadStrategy: "join",
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
        },
      },
      orderBy: {
        updatedAt: "desc"
      }
    }),
    getUnreadConversationCounts(currentUserId)
  ]);

  return conversations.map((conversation) => ({
    id: conversation.id,
    type: conversation.type,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    members: conversation.members.map((member) => member.user),
    lastMessage: conversation.messages[0] ? toChatMessage(conversation.messages[0], currentUserId) : null,
    unreadCount: unreadCounts.get(conversation.id) ?? 0
  }));
}

export async function getUnreadDirectConversationCounts(currentUserId: string): Promise<Record<string, number>> {
  return Object.fromEntries(await getUnreadConversationCountEntries(currentUserId, true));
}

async function getUnreadConversationCounts(currentUserId: string) {
  return new Map(await getUnreadConversationCountEntries(currentUserId, false));
}

async function getUnreadConversationCountEntries(currentUserId: string, directOnly: boolean) {
  const conversationTypeFilter = directOnly
    ? Prisma.sql`AND conversation."type" = 'DIRECT'`
    : Prisma.empty;
  const rows = await prisma.$queryRaw<Array<{ conversationId: string; unreadCount: number | bigint }>>(Prisma.sql`
    SELECT
      membership."conversationId" AS "conversationId",
      COUNT(message."id")::integer AS "unreadCount"
    FROM "ConversationMember" AS membership
    INNER JOIN "Conversation" AS conversation
      ON conversation."id" = membership."conversationId"
    LEFT JOIN "Message" AS message
      ON message."conversationId" = membership."conversationId"
      AND message."deletedAt" IS NULL
      AND message."senderId" <> ${currentUserId}
      AND (membership."lastReadAt" IS NULL OR message."createdAt" > membership."lastReadAt")
    WHERE membership."userId" = ${currentUserId}
      ${conversationTypeFilter}
    GROUP BY membership."conversationId"
  `);

  return rows
    .map((row) => [row.conversationId, Number(row.unreadCount)] as const)
    .filter(([, unreadCount]) => unreadCount > 0);
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
