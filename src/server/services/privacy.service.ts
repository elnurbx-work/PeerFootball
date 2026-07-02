import "server-only";

import { getPostVisibilityById } from "@/server/queries/post.queries";
import { prisma } from "@/lib/prisma";

async function areAcceptedFriends(userAId: string, userBId: string): Promise<boolean> {
  if (userAId === userBId) {
    return true;
  }

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: userAId, addresseeId: userBId },
        { requesterId: userBId, addresseeId: userAId }
      ]
    },
    select: { id: true }
  });

  return Boolean(friendship);
}

export async function isBlockedBetween(userAId?: string | null, userBId?: string | null): Promise<boolean> {
  if (!userAId || !userBId || userAId === userBId) {
    return false;
  }

  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userAId, blockedId: userBId },
        { blockerId: userBId, blockedId: userAId }
      ]
    },
    select: { id: true }
  });

  return Boolean(block);
}

export async function canViewProfile(
  viewerId: string | null | undefined,
  profileOwnerId: string
): Promise<boolean> {
  if (viewerId === profileOwnerId) {
    return true;
  }

  if (await isBlockedBetween(viewerId, profileOwnerId)) {
    return false;
  }

  const owner = await prisma.user.findUnique({
    where: { id: profileOwnerId },
    select: { profileVisibility: true }
  });

  if (!owner) {
    return false;
  }

  if (owner.profileVisibility === "PUBLIC") {
    return true;
  }

  if (!viewerId) {
    return false;
  }

  if (owner.profileVisibility === "FRIENDS_ONLY") {
    return areAcceptedFriends(viewerId, profileOwnerId);
  }

  return false;
}

export async function canSendDirectMessage(senderId: string, receiverId: string): Promise<boolean> {
  if (senderId === receiverId) {
    return false;
  }

  if (await isBlockedBetween(senderId, receiverId)) {
    return false;
  }

  return areAcceptedFriends(senderId, receiverId);
}

export async function canViewPost(
  viewerId: string | null | undefined,
  postId: string
): Promise<boolean> {
  const post = await getPostVisibilityById(postId);

  if (!post) {
    return false;
  }

  if (viewerId === post.authorId) {
    return true;
  }

  if (await isBlockedBetween(viewerId, post.authorId)) {
    return false;
  }

  if (post.visibility === "PUBLIC") {
    return true;
  }

  if (!viewerId) {
    return false;
  }

  if (post.visibility === "FRIENDS_ONLY") {
    return areAcceptedFriends(viewerId, post.authorId);
  }

  return false;
}
