import "server-only";

import type { ClubPermissionPolicy, ClubRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canRoleManageMatches } from "@/server/services/match-domain";

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

  return canRoleCreateClubMatches(role, settings?.matchCreatePermissionPolicy ?? "OWNER_TD");
}

export async function getClubMatchManagerIds(clubId: string): Promise<string[]> {
  const settings = await prisma.clubSettings.findUnique({
    where: { clubId },
    select: { matchCreatePermissionPolicy: true }
  });
  const allowedRoles = policyRoles[settings?.matchCreatePermissionPolicy ?? "OWNER_TD"];
  const memberships = await prisma.clubMember.findMany({
    where: { clubId, status: "ACTIVE", role: { in: allowedRoles } },
    select: { userId: true }
  });

  return memberships.map((membership) => membership.userId);
}

export function canRoleCreateClubMatches(
  role: ClubRole | null | undefined,
  policy: ClubPermissionPolicy
) {
  return canRoleManageMatches(role, policy);
}

export async function canManageGuestList(userId: string, clubId: string) {
  const [role, settings] = await Promise.all([
    getClubRole(userId, clubId),
    prisma.clubSettings.findUnique({ where: { clubId }, select: { guestInvitePolicy: true } })
  ]);
  const policy = settings?.guestInvitePolicy ?? "ONLY_OWNER_TD_YTD";
  if (!role || policy === "CLOSED") return false;
  if (policy === "PLAYERS_CAN_INVITE_FRIENDS") return true;
  return role === "OWNER" || role === "TD" || role === "YTD";
}

export async function canManageClubMetrics(userId: string, clubId: string) {
  const role = await getClubRole(userId, clubId);

  return role === "OWNER" || role === "TD";
}

export function canRoleManageTactics(role: ClubRole | null | undefined) {
  return role === "OWNER" || role === "TD" || role === "YTD";
}

export async function canManageClubTactics(userId: string, clubId: string) {
  return canRoleManageTactics(await getClubRole(userId, clubId));
}

export async function getActiveClubMembership(userId: string, clubId: string) {
  return prisma.clubMember.findFirst({
    where: { userId, clubId, status: "ACTIVE" },
    select: { id: true, role: true }
  });
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
