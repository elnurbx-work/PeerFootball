"use server";

import { revalidatePath } from "next/cache";
import { addClubMatchMembersSchema, clubMatchSchema, matchSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateClubMatches, ensureClubActive } from "@/server/services/club-permissions.service";
import type { ApiResponse } from "@/types/api.types";

export async function createMatchAction(formData: FormData): Promise<ApiResponse> {
  const result = matchSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { ok: false, message: "Match details are invalid.", issues: result.error.flatten().fieldErrors };
  }

  return { ok: true, message: "Match validation passed.", data: result.data };
}

export async function createClubMatchAction(input: unknown): Promise<ApiResponse<{ matchId: string }>> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, message: "You need to sign in first." };
  }

  const result = clubMatchSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return { ok: false, message: "Match details are invalid.", issues: result.error.flatten().fieldErrors };
  }

  const { clubId, participantUserIds, ...matchData } = result.data;

  if (!(await canCreateClubMatches(user.id, clubId))) {
    return { ok: false, message: "You cannot create matches for this club." };
  }

  await ensureClubActive(clubId);

  const requestedUserIds = [...new Set([user.id, ...participantUserIds])];
  const members = await getActiveClubUsers(clubId, requestedUserIds);

  if (members.length !== requestedUserIds.length) {
    return { ok: false, message: "Every selected player must be an active member of this club." };
  }

  if (members.length > matchData.maxPlayers) {
    return { ok: false, message: "Selected club members exceed the match player limit." };
  }

  const match = await prisma.match.create({
    data: {
      ...matchData,
      clubId,
      creatorId: user.id,
      status: members.length === matchData.maxPlayers ? "FULL" : "OPEN",
      participants: {
        create: members.map((member) => ({
          userId: member.id,
          position: member.preferredPosition ?? "UNASSIGNED"
        }))
      }
    },
    select: { id: true }
  });

  revalidateMatchSurfaces(clubId);

  return { ok: true, message: "Club match created.", data: { matchId: match.id } };
}

export async function addClubMembersToMatchAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, message: "You need to sign in first." };
  }

  const result = addClubMatchMembersSchema.safeParse(toInputObject(input));

  if (!result.success) {
    return { ok: false, message: "Selected match members are invalid.", issues: result.error.flatten().fieldErrors };
  }

  const match = await prisma.match.findUnique({
    where: { id: result.data.matchId },
    select: {
      id: true,
      clubId: true,
      maxPlayers: true,
      status: true,
      participants: { select: { userId: true } }
    }
  });

  if (!match?.clubId) {
    return { ok: false, message: "Club match was not found." };
  }

  if (!(await canCreateClubMatches(user.id, match.clubId))) {
    return { ok: false, message: "You cannot manage this club match." };
  }

  await ensureClubActive(match.clubId);

  if (match.status === "COMPLETED" || match.status === "CANCELLED") {
    return { ok: false, message: "Members cannot be added to a finished match." };
  }

  const existingUserIds = new Set(match.participants.map((participant) => participant.userId));
  const newUserIds = [...new Set(result.data.userIds)].filter((userId) => !existingUserIds.has(userId));
  const members = await getActiveClubUsers(match.clubId, newUserIds);

  if (members.length !== newUserIds.length) {
    return { ok: false, message: "Every selected player must be an active member of this club." };
  }

  const nextPlayerCount = match.participants.length + members.length;

  if (nextPlayerCount > match.maxPlayers) {
    return { ok: false, message: "Selected club members exceed the remaining match places." };
  }

  await prisma.$transaction(async (tx) => {
    if (members.length) {
      await tx.matchParticipant.createMany({
        data: members.map((member) => ({
          matchId: match.id,
          userId: member.id,
          position: member.preferredPosition ?? "UNASSIGNED"
        })),
        skipDuplicates: true
      });
    }

    await tx.match.update({
      where: { id: match.id },
      data: { status: nextPlayerCount === match.maxPlayers ? "FULL" : "OPEN" }
    });
  });

  revalidateMatchSurfaces(match.clubId);

  return { ok: true, message: members.length ? "Club members added to the match." : "Members are already in the match." };
}

async function getActiveClubUsers(clubId: string, userIds: string[]) {
  if (!userIds.length) {
    return [];
  }

  const memberships = await prisma.clubMember.findMany({
    where: {
      clubId,
      userId: { in: userIds },
      status: "ACTIVE"
    },
    select: {
      user: {
        select: {
          id: true,
          preferredPosition: true
        }
      }
    }
  });

  return memberships.map((membership) => membership.user);
}

function toInputObject(input: unknown) {
  return input instanceof FormData ? Object.fromEntries(input) : input;
}

function revalidateMatchSurfaces(clubId: string) {
  revalidatePath("/matches");
  revalidatePath(`/clubs/${clubId}`);
}
