import "server-only";

import type { ClubPermissionPolicy, ClubRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const policyRoles: Record<ClubPermissionPolicy, ClubRole[]> = {
  OWNER_ONLY: ["OWNER"],
  OWNER_TD: ["OWNER", "TD"],
  OWNER_TD_YTD: ["OWNER", "TD", "YTD"]
};

export async function getClubRole(userId: string, clubId: string): Promise<ClubRole | null> {
  const membership = await prisma.clubMember.findFirst({
    where: {
      clubId,
      userId,
      status: "ACTIVE"
    },
    select: {
      role: true
    }
  });

  return membership?.role ?? null;
}

export async function isClubOwner(userId: string, clubId: string) {
  return (await getClubRole(userId, clubId)) === "OWNER";
}

export async function canManageClubSettings(userId: string, clubId: string) {
  return isClubOwner(userId, clubId);
}

export async function canApproveJoinRequests(userId: string, clubId: string) {
  const [role, settings] = await Promise.all([
    getClubRole(userId, clubId),
    prisma.clubSettings.findUnique({
      where: { clubId },
      select: { joinApprovalPolicy: true }
    })
  ]);

  return Boolean(role && policyRoles[settings?.joinApprovalPolicy ?? "OWNER_TD"].includes(role));
}

export async function canInvitePlayers(userId: string, clubId: string) {
  const [role, settings] = await Promise.all([
    getClubRole(userId, clubId),
    prisma.clubSettings.findUnique({
      where: { clubId },
      select: { invitePermissionPolicy: true }
    })
  ]);

  return Boolean(role && policyRoles[settings?.invitePermissionPolicy ?? "OWNER_TD"].includes(role));
}

export async function canCreateClubMatches(userId: string, clubId: string) {
  const [role, settings] = await Promise.all([
    getClubRole(userId, clubId),
    prisma.clubSettings.findUnique({
      where: { clubId },
      select: { matchCreatePermissionPolicy: true }
    })
  ]);

  return Boolean(role && policyRoles[settings?.matchCreatePermissionPolicy ?? "OWNER_TD"].includes(role));
}

export async function canManageGuestList(userId: string, clubId: string) {
  const role = await getClubRole(userId, clubId);

  return role === "OWNER" || role === "TD" || role === "YTD";
}

export async function canManageClubMetrics(userId: string, clubId: string) {
  const role = await getClubRole(userId, clubId);

  return role === "OWNER" || role === "TD";
}

export async function ensureClubActive(clubId: string) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      id: true,
      isActive: true
    }
  });

  if (!club) {
    throw new Error("Club was not found.");
  }

  if (!club.isActive) {
    throw new Error("This club is deactivated.");
  }

  return club;
}
