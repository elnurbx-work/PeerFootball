import "server-only";

import { FriendshipStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { FriendshipStatusResult, FriendshipWithUser } from "@/types/friendship.types";

const friendUserSelect = {
  id: true,
  name: true,
  username: true,
  image: true
};

function toFriendshipWithUser(
  friendship: {
    id: string;
    requesterId: string;
    addresseeId: string;
    status: FriendshipStatus;
    createdAt: Date;
    updatedAt: Date;
    acceptedAt: Date | null;
    requester: { id: string; name: string | null; username: string | null; image: string | null };
    addressee: { id: string; name: string | null; username: string | null; image: string | null };
  },
  currentUserId: string
): FriendshipWithUser {
  return {
    id: friendship.id,
    requesterId: friendship.requesterId,
    addresseeId: friendship.addresseeId,
    status: friendship.status,
    createdAt: friendship.createdAt,
    updatedAt: friendship.updatedAt,
    acceptedAt: friendship.acceptedAt,
    user: friendship.requesterId === currentUserId ? friendship.addressee : friendship.requester
  };
}

export async function getFriendshipBetweenUsers(userId: string, targetUserId: string) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: targetUserId },
        { requesterId: targetUserId, addresseeId: userId }
      ]
    }
  });
}

export async function getFriendshipById(friendshipId: string) {
  return prisma.friendship.findUnique({
    where: { id: friendshipId }
  });
}

export async function getFriendshipStatusForUsers(
  currentUserId: string,
  targetUserId: string
): Promise<FriendshipStatusResult> {
  if (currentUserId === targetUserId) {
    return { state: "FRIENDS" };
  }

  const friendship = await getFriendshipBetweenUsers(currentUserId, targetUserId);

  if (!friendship || friendship.status === "DECLINED") {
    return { state: "ADD_FRIEND" };
  }

  if (friendship.status === "BLOCKED") {
    return { state: "BLOCKED", friendshipId: friendship.id };
  }

  if (friendship.status === "ACCEPTED") {
    return { state: "FRIENDS", friendshipId: friendship.id };
  }

  if (friendship.addresseeId === currentUserId) {
    return { state: "RESPOND", friendshipId: friendship.id, direction: "INCOMING" };
  }

  return { state: "REQUEST_SENT", friendshipId: friendship.id, direction: "OUTGOING" };
}

export async function getFriendsForUser(userId: string): Promise<FriendshipWithUser[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }]
    },
    orderBy: { acceptedAt: "desc" },
    include: {
      requester: { select: friendUserSelect },
      addressee: { select: friendUserSelect }
    }
  });

  return friendships.map((friendship) => toFriendshipWithUser(friendship, userId));
}

export async function getIncomingFriendRequestsForUser(userId: string): Promise<FriendshipWithUser[]> {
  const requests = await prisma.friendship.findMany({
    where: {
      addresseeId: userId,
      status: "PENDING"
    },
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: friendUserSelect },
      addressee: { select: friendUserSelect }
    }
  });

  return requests.map((friendship) => toFriendshipWithUser(friendship, userId));
}

export async function getOutgoingFriendRequestsForUser(userId: string): Promise<FriendshipWithUser[]> {
  const requests = await prisma.friendship.findMany({
    where: {
      requesterId: userId,
      status: "PENDING"
    },
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: friendUserSelect },
      addressee: { select: friendUserSelect }
    }
  });

  return requests.map((friendship) => toFriendshipWithUser(friendship, userId));
}
