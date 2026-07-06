"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { deleteMessageSchema, sendMessageSchema } from "@/lib/validations/message";
import { findDirectConversationForUsers, isConversationMember } from "@/server/queries/message.queries";
import { canSendDirectMessage } from "@/server/services/privacy.service";
import { encryptMessage } from "@/server/services/message-encryption.service";
import { publishMessageCreatedEvent, publishMessageDeletedEvent } from "@/server/services/ably.service";
import type { ApiResponse } from "@/types/api.types";
import type { SendMessageInput } from "@/types/message.types";

type ActionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function sendMessageAction(input: SendMessageInput): Promise<ApiResponse<{ messageId: string; conversationId: string }>> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const result = sendMessageSchema.safeParse(input);

  if (!result.success) {
    return {
      ok: false,
      message: "Message details are invalid.",
      issues: result.error.flatten().fieldErrors
    };
  }

  let conversationId = result.data.conversationId;

  if (conversationId) {
    if (!(await isConversationMember(conversationId, user.id))) {
      return {
        ok: false,
        message: "Conversation was not found."
      };
    }
  } else if (result.data.recipientId) {
    const recipient = await prisma.user.findUnique({
      where: {
        id: result.data.recipientId
      },
      select: {
        id: true
      }
    });

    if (!recipient || !(await canSendDirectMessage(user.id, recipient.id))) {
      return {
        ok: false,
        message: "You can only message accepted friends."
      };
    }

    conversationId = await getOrCreateDirectConversation(user.id, recipient.id);
  }

  if (!conversationId) {
    return {
      ok: false,
      message: "Conversation was not found."
    };
  }

  let encryptedMessage;

  try {
    encryptedMessage = encryptMessage(result.data.content);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Message encryption failed."
    };
  }

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId,
        senderId: user.id,
        ciphertext: encryptedMessage.ciphertext,
        iv: encryptedMessage.iv,
        authTag: encryptedMessage.authTag,
        algorithm: encryptedMessage.algorithm,
        keyVersion: encryptedMessage.keyVersion
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        createdAt: true
      }
    });

    await tx.conversation.update({
      where: {
        id: conversationId
      },
      data: {
        updatedAt: created.createdAt
      },
      select: {
        id: true
      }
    });

    return created;
  });

  await publishMessageCreatedEvent({
    conversationId: message.conversationId,
    createdAt: message.createdAt.toISOString(),
    messageId: message.id,
    senderId: message.senderId
  });

  revalidateMessageSurfaces();

  return {
    ok: true,
    message: "Message sent.",
    data: {
      messageId: message.id,
      conversationId: message.conversationId
    }
  };
}

export async function deleteMessageAction(messageId: string): Promise<ApiResponse> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  const result = deleteMessageSchema.safeParse({ messageId });

  if (!result.success) {
    return {
      ok: false,
      message: "Message details are invalid.",
      issues: result.error.flatten().fieldErrors
    };
  }

  const message = await prisma.message.findUnique({
    where: {
      id: result.data.messageId
    },
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      deletedAt: true
    }
  });

  if (!message || !(await isConversationMember(message.conversationId, user.id))) {
    return {
      ok: false,
      message: "Message was not found."
    };
  }

  if (message.senderId !== user.id) {
    return {
      ok: false,
      message: "You can only delete your own messages."
    };
  }

  if (message.deletedAt) {
    return {
      ok: true,
      message: "Message deleted."
    };
  }

  const deletedAt = new Date();

  await prisma.message.update({
    where: {
      id: message.id
    },
    data: {
      deletedAt
    },
    select: {
      id: true
    }
  });

  await publishMessageDeletedEvent({
    conversationId: message.conversationId,
    deletedAt: deletedAt.toISOString(),
    messageId: message.id
  });

  revalidateMessageSurfaces();

  return {
    ok: true,
    message: "Message deleted."
  };
}

async function getOrCreateDirectConversation(currentUserId: string, recipientId: string) {
  const existingConversation = await findDirectConversationForUsers(currentUserId, recipientId);

  if (existingConversation) {
    return existingConversation.id;
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: "DIRECT",
      members: {
        create: [
          {
            userId: currentUserId,
            encryptedConversationKey: "server-managed",
            keyVersion: 1
          },
          {
            userId: recipientId,
            encryptedConversationKey: "server-managed",
            keyVersion: 1
          }
        ]
      }
    },
    select: {
      id: true
    }
  });

  return conversation.id;
}

async function requireUser() {
  return getCurrentUser();
}

function unauthenticatedResponse(): ApiResponse<never> {
  return {
    ok: false,
    message: "You need to sign in first."
  };
}

function revalidateMessageSurfaces() {
  revalidatePath("/direct");
}
