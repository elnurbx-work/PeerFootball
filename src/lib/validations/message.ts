import { z } from "zod";

export const MESSAGE_CONTENT_MAX_LENGTH = 2000;

export const sendMessageSchema = z
  .object({
    conversationId: z.string().min(1).optional(),
    recipientId: z.string().min(1).optional(),
    content: z.string().trim().min(1).max(MESSAGE_CONTENT_MAX_LENGTH)
  })
  .refine((value) => value.conversationId || value.recipientId, {
    message: "validation.messageTarget",
    path: ["conversationId"]
  });

export const deleteMessageSchema = z.object({
  messageId: z.string().min(1)
});

export type SendMessageSchemaInput = z.infer<typeof sendMessageSchema>;
