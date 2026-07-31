-- Extend messaging notifications without changing legacy MESSAGE rows.
ALTER TYPE "NotificationType" ADD VALUE 'DIRECT_MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_CHAT_MENTION';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_CHAT_REPLY';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_CHAT_MESSAGE_PINNED';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_CHAT_ANNOUNCEMENT';

-- Store one pinned message per conversation and its moderator audit data.
ALTER TABLE "Conversation"
ADD COLUMN "pinnedMessageId" TEXT,
ADD COLUMN "pinnedById" TEXT,
ADD COLUMN "pinnedAt" TIMESTAMP(3);

-- Mute is a per-user, per-conversation preference.
ALTER TABLE "ConversationMember"
ADD COLUMN "isMuted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "mutedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Conversation_pinnedMessageId_key"
ON "Conversation"("pinnedMessageId");

CREATE INDEX "Conversation_pinnedById_idx"
ON "Conversation"("pinnedById");

ALTER TABLE "Conversation"
ADD CONSTRAINT "Conversation_pinnedMessageId_fkey"
FOREIGN KEY ("pinnedMessageId") REFERENCES "Message"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Conversation"
ADD CONSTRAINT "Conversation_pinnedById_fkey"
FOREIGN KEY ("pinnedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
