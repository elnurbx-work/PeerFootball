import "server-only";

import { prisma } from "@/lib/prisma";
import {
  canApproveJoinRequests,
  canCreateClubMatches,
  canInvitePlayers
} from "@/server/services/club-permissions.service";
import {
  clubDetailsInclude,
  clubMemberInclude,
  clubSettingsSelect,
  clubSummaryInclude,
  toClubDetailsDto,
  toClubGuestDto,
  toClubMemberDto,
  toClubMetricDefinitionDto,
  toClubSettingsDto,
  toClubSummaryDto
} from "@/server/services/club.service";
import type {
  ClubDetails,
  ClubGuestDto,
  ClubMemberDto,
  ClubMetricDefinitionDto,
  ClubSettingsDto,
  ClubSummary
} from "@/types/club.types";

export async function getMyClubs(userId: string): Promise<ClubSummary[]> {
  const memberships = await prisma.clubMember.findMany({
    where: {
      userId,
      status: "ACTIVE"
    },
    include: {
      club: {
        include: clubSummaryInclude
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return memberships.map((membership) =>
    toClubSummaryDto(membership.club, {
      role: membership.role,
      status: membership.status
    })
  );
}

export async function getMyPendingClubs(userId: string): Promise<ClubSummary[]> {
  const memberships = await prisma.clubMember.findMany({
    where: { userId, status: { in: ["INVITED", "REQUESTED"] } },
    include: { club: { include: clubSummaryInclude } },
    orderBy: { updatedAt: "desc" }
  });
  return memberships.map((membership) =>
    toClubSummaryDto(membership.club, { role: membership.role, status: membership.status })
  );
}

export async function getClubBySlug(slug: string, currentUserId?: string): Promise<ClubDetails | null> {
  const club = await prisma.club.findUnique({
    where: { slug },
    include: clubDetailsInclude
  });

  if (!club) {
    return null;
  }

  const currentUserMembership = currentUserId
    ? await prisma.clubMember.findFirst({
        where: {
          clubId: club.id,
          userId: currentUserId,
          status: {
            in: ["ACTIVE", "INVITED", "REQUESTED"]
          }
        },
        select: {
          role: true,
          status: true
        }
      })
    : null;

  return toClubDetailsDto(club, currentUserMembership);
}

export async function getClubMembers(clubId: string): Promise<ClubMemberDto[]> {
  const members = await prisma.clubMember.findMany({
    where: {
      clubId,
      status: "ACTIVE"
    },
    include: clubMemberInclude,
    orderBy: [{ status: "asc" }, { role: "asc" }, { createdAt: "asc" }]
  });

  return members.map(toClubMemberDto);
}

export async function getClubMembershipState(clubId: string, userId: string) {
  const [membership, canInviteUsers, canApproveRequests, canCreateMatches] = await Promise.all([
    prisma.clubMember.findFirst({
      where: { clubId, userId, status: { in: ["ACTIVE", "INVITED", "REQUESTED"] } },
      select: { role: true, status: true }
    }),
    canInvitePlayers(userId, clubId),
    canApproveJoinRequests(userId, clubId),
    canCreateClubMatches(userId, clubId)
  ]);

  return {
    isMember: membership?.status === "ACTIVE",
    role: membership?.role ?? null,
    status: membership?.status ?? null,
    canManageMembers: membership?.role === "OWNER",
    canInviteUsers,
    canApproveRequests,
    canCreateMatches
  };
}

export async function getClubSettings(clubId: string): Promise<ClubSettingsDto | null> {
  const settings = await prisma.clubSettings.findUnique({
    where: { clubId },
    select: clubSettingsSelect
  });

  return settings ? toClubSettingsDto(settings) : null;
}

export async function getClubGuests(clubId: string): Promise<ClubGuestDto[]> {
  const guests = await prisma.clubGuest.findMany({
    where: {
      clubId
    },
    orderBy: [{ isActive: "desc" }, { fullName: "asc" }]
  });

  return guests.map(toClubGuestDto);
}

export async function getClubMetricDefinitions(clubId: string): Promise<ClubMetricDefinitionDto[]> {
  const metrics = await prisma.clubMetricDefinition.findMany({
    where: {
      clubId
    },
    orderBy: [{ isActive: "desc" }, { order: "asc" }, { createdAt: "asc" }]
  });

  return metrics.map(toClubMetricDefinitionDto);
}

export async function getPendingJoinRequests(clubId: string, currentUserId: string): Promise<ClubMemberDto[]> {
  if (!(await canApproveJoinRequests(currentUserId, clubId))) {
    return [];
  }

  const members = await prisma.clubMember.findMany({
    where: {
      clubId,
      status: "REQUESTED"
    },
    include: clubMemberInclude,
    orderBy: {
      createdAt: "asc"
    }
  });

  return members.map(toClubMemberDto);
}

export async function getClubInvitationForUser(clubId: string, userId: string): Promise<ClubMemberDto | null> {
  const invite = await prisma.clubMember.findFirst({
    where: { clubId, userId, status: "INVITED" },
    include: clubMemberInclude,
    orderBy: { createdAt: "desc" }
  });

  return invite ? toClubMemberDto(invite) : null;
}

export async function searchClubs(query?: string, currentUserId?: string): Promise<ClubSummary[]> {
  const trimmedQuery = query?.trim();
  const clubs = await prisma.club.findMany({
    where: {
      isActive: true,
      ...(trimmedQuery
        ? {
            OR: [
              { name: { contains: trimmedQuery, mode: "insensitive" } },
              { city: { contains: trimmedQuery, mode: "insensitive" } },
              { country: { contains: trimmedQuery, mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: clubSummaryInclude,
    orderBy: {
      updatedAt: "desc"
    },
    take: 30
  });

  const memberships = currentUserId
    ? await prisma.clubMember.findMany({
        where: { userId: currentUserId, clubId: { in: clubs.map((club) => club.id) }, status: { in: ["ACTIVE", "INVITED", "REQUESTED"] } },
        select: { clubId: true, role: true, status: true }
      })
    : [];
  return clubs.map((club) => {
    const membership = memberships.find((item) => item.clubId === club.id);
    return toClubSummaryDto(club, membership ?? null);
  });
}
