"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { deleteMessageSchema, sendMessageSchema } from "@/lib/validations/message";
import {
  findDirectConversationForUsers,
  getLatestConversationMessage,
  isConversationMember
} from "@/server/queries/message.queries";
import { canSendDirectMessage } from "@/server/services/privacy.service";
import { encryptMessage } from "@/server/services/message-encryption.service";
import {
  publishConversationRead,
  publishConversationUpdated,
  publishMessageCreated,
  publishMessageDeleted
} from "@/server/services/ably.service";
import type { ApiResponse } from "@/types/api.types";
import type { ChatMessage, ConversationUpdatePayload, RealtimeChatMessage, SendMessageInput } from "@/types/message.types";

type ActionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function sendMessageAction(input: SendMessageInput): Promise<ApiResponse<{ message: ChatMessage; messageId: string; conversationId: string }>> {
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
      include: {
        conversation: {
          select: {
            members: {
              select: {
                userId: true
              }
            }
          }
        },
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        }
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

  const realtimeMessage: RealtimeChatMessage = {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    sender: message.sender,
    content: result.data.content,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    deletedAt: null
  };
  const conversationUpdate: ConversationUpdatePayload = {
    conversationId: message.conversationId,
    lastMessage: realtimeMessage,
    updatedAt: message.createdAt.toISOString()
  };

  await publishRealtimeEvents([
    () => publishMessageCreated(message.conversationId, realtimeMessage),
    ...message.conversation.members.map((member) => () => publishConversationUpdated(member.userId, conversationUpdate))
  ]);

  revalidateMessageSurfaces();

  return {
    ok: true,
    message: "Message sent.",
    data: {
      message: {
        ...realtimeMessage,
        isOwnMessage: true
      },
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

  const messageUpdate = await prisma.message.update({
    where: {
      id: message.id
    },
    data: {
      deletedAt
    },
    include: {
      conversation: {
        select: {
          members: {
            select: {
              userId: true
            }
          }
        }
      }
    }
  });

  const lastMessage = await getLatestConversationMessage(message.conversationId);
  const conversationUpdate: ConversationUpdatePayload = {
    conversationId: message.conversationId,
    lastMessage,
    updatedAt: messageUpdate.updatedAt.toISOString()
  };

  await publishRealtimeEvents([
    () => publishMessageDeleted(message.conversationId, message.id),
    ...messageUpdate.conversation.members.map((member) => () => publishConversationUpdated(member.userId, conversationUpdate))
  ]);

  revalidateMessageSurfaces();

  return {
    ok: true,
    message: "Message deleted."
  };
}

export async function markConversationReadAction(conversationId: string): Promise<ApiResponse<{ conversationId: string; readAt: string }>> {
  const user = await requireUser();

  if (!user) {
    return unauthenticatedResponse();
  }

  if (!conversationId || !(await isConversationMember(conversationId, user.id))) {
    return {
      ok: false,
      message: "Conversation was not found."
    };
  }

  const readAt = new Date();

  await prisma.conversationMember.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId: user.id
      }
    },
    data: {
      lastReadAt: readAt
    },
    select: {
      id: true
    }
  });

  const lastMessage = await getLatestConversationMessage(conversationId);
  const conversationUpdate: ConversationUpdatePayload = {
    conversationId,
    lastMessage,
    unreadCount: 0,
    updatedAt: lastMessage?.createdAt ?? readAt.toISOString()
  };

  await publishRealtimeEvents([
    () => publishConversationRead(conversationId, user.id),
    () => publishConversationUpdated(user.id, conversationUpdate)
  ]);

  revalidateMessageSurfaces();

  return {
    ok: true,
    message: "Conversation marked as read.",
    data: {
      conversationId,
      readAt: readAt.toISOString()
    }
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

async function publishRealtimeEvents(publishers: Array<() => Promise<void>>) {
  const results = await Promise.allSettled(publishers.map((publish) => publish()));
  const failures = results.filter((result) => result.status === "rejected");

  if (failures.length && process.env.NODE_ENV === "development") {
    console.error("[ably] realtime publish failed", failures);
  }
}
