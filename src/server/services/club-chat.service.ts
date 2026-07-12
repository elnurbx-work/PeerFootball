import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DatabaseClient = Prisma.TransactionClient | typeof prisma;

export async function addUserToClubChat(db: DatabaseClient, clubId: string, userId: string) {
  const conversation = await db.conversation.upsert({
    where: { clubId },
    update: {},
    create: {
      type: "CLUB",
      clubId
    },
    select: { id: true }
  });

  await db.conversationMember.upsert({
    where: {
      conversationId_userId: {
        conversationId: conversation.id,
        userId
      }
    },
    update: {},
    create: {
      conversationId: conversation.id,
      userId,
      encryptedConversationKey: "server-managed"
    }
  });

  return conversation.id;
}

export async function removeUserFromClubChat(db: DatabaseClient, clubId: string, userId: string) {
  const conversation = await db.conversation.findUnique({
    where: { clubId },
    select: { id: true }
  });

  if (!conversation) {
    return;
  }

  await db.conversationMember.deleteMany({
    where: {
      conversationId: conversation.id,
      userId
    }
  });
}
