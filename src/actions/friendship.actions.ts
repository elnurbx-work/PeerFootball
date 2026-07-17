"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getFriendshipBetweenUsers,
  getFriendshipById
} from "@/server/queries/friendship.queries";
import {
  createFriendAcceptedNotification,
  createFriendRequestNotification
} from "@/server/services/notification.service";
import { userExistsById } from "@/server/queries/user.queries";
import type { FriendshipActionResult } from "@/types/friendship.types";
import { getServerTranslator } from "@/i18n/server";

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
    return { ok: false, message: (await getServerTranslator())("responses.signInRequired") };
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
  const t = await getServerTranslator();
  const authResult = await requireCurrentUserId();

  if (!authResult.ok) {
    return authResult;
  }

  const currentUserId = authResult.userId;

  if (currentUserId === targetUserId) {
    return { ok: false, message: t("responses.friendship.cannotAddSelf") };
  }

  if (!(await userExistsById(targetUserId))) {
    return { ok: false, message: t("responses.friendship.userNotFound") };
  }

  const existing = await getFriendshipBetweenUsers(currentUserId, targetUserId);

  if (existing && ["PENDING", "ACCEPTED", "BLOCKED"].includes(existing.status)) {
    return { ok: false, message: t("responses.friendship.exists") };
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

  await runNotificationTask(() =>
    createFriendRequestNotification({
      actorId: currentUserId,
      friendshipId: friendship.id,
      recipientId: targetUserId
    })
  );

  refreshFriendshipPaths();
  revalidatePath(`/profile/${targetUserId}`);

  return { ok: true, message: t("responses.friendship.sent"), data: { friendshipId: friendship.id } };
}

export async function acceptFriendRequest(
  friendshipId: string
): Promise<FriendshipActionResult<{ friendshipId: string }>> {
  const t = await getServerTranslator();
  const authResult = await requireCurrentUserId();

  if (!authResult.ok) {
    return authResult;
  }

  const friendship = await getFriendshipById(friendshipId);

  if (!friendship || friendship.status !== "PENDING") {
    return { ok: false, message: t("responses.friendship.pendingNotFound") };
  }

  if (friendship.addresseeId !== authResult.userId) {
    return { ok: false, message: t("responses.friendship.onlyRecipientAccept") };
  }

  const updated = await prisma.friendship.update({
    where: { id: friendshipId },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date()
    },
    select: { id: true }
  });

  await runNotificationTask(() =>
    createFriendAcceptedNotification({
      actorId: authResult.userId,
      friendshipId: updated.id,
      recipientId: friendship.requesterId
    })
  );

  refreshFriendshipPaths();

  return { ok: true, message: t("responses.friendship.accepted"), data: { friendshipId: updated.id } };
}

export async function declineFriendRequest(
  friendshipId: string
): Promise<FriendshipActionResult<{ friendshipId: string }>> {
  const t = await getServerTranslator();
  const authResult = await requireCurrentUserId();

  if (!authResult.ok) {
    return authResult;
  }

  const friendship = await getFriendshipById(friendshipId);

  if (!friendship || friendship.status !== "PENDING") {
    return { ok: false, message: t("responses.friendship.pendingNotFound") };
  }

  if (friendship.addresseeId !== authResult.userId) {
    return { ok: false, message: t("responses.friendship.onlyRecipientDecline") };
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

  return { ok: true, message: t("responses.friendship.declined"), data: { friendshipId: updated.id } };
}

export async function cancelFriendRequest(
  friendshipId: string
): Promise<FriendshipActionResult<{ friendshipId: string }>> {
  const t = await getServerTranslator();
  const authResult = await requireCurrentUserId();

  if (!authResult.ok) {
    return authResult;
  }

  const friendship = await getFriendshipById(friendshipId);

  if (!friendship || friendship.status !== "PENDING") {
    return { ok: false, message: t("responses.friendship.pendingNotFound") };
  }

  if (friendship.requesterId !== authResult.userId) {
    return { ok: false, message: t("responses.friendship.onlyRequesterCancel") };
  }

  await prisma.friendship.delete({
    where: { id: friendshipId }
  });

  refreshFriendshipPaths();

  return { ok: true, message: t("responses.friendship.cancelled"), data: { friendshipId } };
}

export async function removeFriend(
  friendshipId: string
): Promise<FriendshipActionResult<{ friendshipId: string }>> {
  const t = await getServerTranslator();
  const authResult = await requireCurrentUserId();

  if (!authResult.ok) {
    return authResult;
  }

  const friendship = await getFriendshipById(friendshipId);

  if (!friendship || friendship.status !== "ACCEPTED") {
    return { ok: false, message: t("responses.friendship.acceptedNotFound") };
  }

  if (friendship.requesterId !== authResult.userId && friendship.addresseeId !== authResult.userId) {
    return { ok: false, message: t("responses.friendship.onlyFriendsRemove") };
  }

  await prisma.friendship.delete({
    where: { id: friendshipId }
  });

  refreshFriendshipPaths();

  return { ok: true, message: t("responses.friendship.removed"), data: { friendshipId } };
}

async function runNotificationTask(task: () => Promise<unknown>) {
  try {
    await task();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[notifications] creation failed", error);
    }
  }
}
