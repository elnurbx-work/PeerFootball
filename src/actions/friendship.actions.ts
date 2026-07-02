"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getFriendshipBetweenUsers,
  getFriendshipById
} from "@/server/queries/friendship.queries";
import { userExistsById } from "@/server/queries/user.queries";
import type { FriendshipActionResult } from "@/types/friendship.types";

type AuthenticatedUserResult =
  | {
      ok: true;
      userId: string;
    }
  | {
      ok: false;
      message: string;
    };

async function requireCurrentUserId(): Promise<AuthenticatedUserResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, message: "You need to sign in first." };
  }

  return { ok: true, userId };
}

function refreshFriendshipPaths() {
  revalidatePath("/friends");
  revalidatePath("/profile");
  revalidatePath("/search");
}

export async function sendFriendRequest(
  targetUserId: string
): Promise<FriendshipActionResult<{ friendshipId: string }>> {
  const authResult = await requireCurrentUserId();

  if (!authResult.ok) {
    return authResult;
  }

  const currentUserId = authResult.userId;

  if (currentUserId === targetUserId) {
    return { ok: false, message: "You cannot send a friend request to yourself." };
  }

  if (!(await userExistsById(targetUserId))) {
    return { ok: false, message: "User not found." };
  }

  const existing = await getFriendshipBetweenUsers(currentUserId, targetUserId);

  if (existing && ["PENDING", "ACCEPTED", "BLOCKED"].includes(existing.status)) {
    return { ok: false, message: "A friendship relationship already exists." };
  }

  if (existing?.status === "DECLINED") {
    await prisma.friendship.delete({ where: { id: existing.id } });
  }

  const friendship = await prisma.friendship.create({
    data: {
      requesterId: currentUserId,
      addresseeId: targetUserId
    },
    select: { id: true }
  });

  refreshFriendshipPaths();
  revalidatePath(`/profile/${targetUserId}`);

  return { ok: true, message: "Friend request sent.", data: { friendshipId: friendship.id } };
}

export async function acceptFriendRequest(
  friendshipId: string
): Promise<FriendshipActionResult<{ friendshipId: string }>> {
  const authResult = await requireCurrentUserId();

  if (!authResult.ok) {
    return authResult;
  }

  const friendship = await getFriendshipById(friendshipId);

  if (!friendship || friendship.status !== "PENDING") {
    return { ok: false, message: "Pending friend request not found." };
  }

  if (friendship.addresseeId !== authResult.userId) {
    return { ok: false, message: "Only the request recipient can accept this request." };
  }

  const updated = await prisma.friendship.update({
    where: { id: friendshipId },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date()
    },
    select: { id: true }
  });

  refreshFriendshipPaths();

  return { ok: true, message: "Friend request accepted.", data: { friendshipId: updated.id } };
}

export async function declineFriendRequest(
  friendshipId: string
): Promise<FriendshipActionResult<{ friendshipId: string }>> {
  const authResult = await requireCurrentUserId();

  if (!authResult.ok) {
    return authResult;
  }

  const friendship = await getFriendshipById(friendshipId);

  if (!friendship || friendship.status !== "PENDING") {
    return { ok: false, message: "Pending friend request not found." };
  }

  if (friendship.addresseeId !== authResult.userId) {
    return { ok: false, message: "Only the request recipient can decline this request." };
  }

  const updated = await prisma.friendship.update({
    where: { id: friendshipId },
    data: {
      status: "DECLINED",
      acceptedAt: null
    },
    select: { id: true }
  });

  refreshFriendshipPaths();

  return { ok: true, message: "Friend request declined.", data: { friendshipId: updated.id } };
}

export async function cancelFriendRequest(
  friendshipId: string
): Promise<FriendshipActionResult<{ friendshipId: string }>> {
  const authResult = await requireCurrentUserId();

  if (!authResult.ok) {
    return authResult;
  }

  const friendship = await getFriendshipById(friendshipId);

  if (!friendship || friendship.status !== "PENDING") {
    return { ok: false, message: "Pending friend request not found." };
  }

  if (friendship.requesterId !== authResult.userId) {
    return { ok: false, message: "Only the requester can cancel this request." };
  }

  await prisma.friendship.delete({
    where: { id: friendshipId }
  });

  refreshFriendshipPaths();

  return { ok: true, message: "Friend request cancelled.", data: { friendshipId } };
}

export async function removeFriend(
  friendshipId: string
): Promise<FriendshipActionResult<{ friendshipId: string }>> {
  const authResult = await requireCurrentUserId();

  if (!authResult.ok) {
    return authResult;
  }

  const friendship = await getFriendshipById(friendshipId);

  if (!friendship || friendship.status !== "ACCEPTED") {
    return { ok: false, message: "Accepted friendship not found." };
  }

  if (friendship.requesterId !== authResult.userId && friendship.addresseeId !== authResult.userId) {
    return { ok: false, message: "Only friends can remove this friendship." };
  }

  await prisma.friendship.delete({
    where: { id: friendshipId }
  });

  refreshFriendshipPaths();

  return { ok: true, message: "Friend removed.", data: { friendshipId } };
}
