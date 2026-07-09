import "server-only";

import { prisma } from "@/lib/prisma";
import { canApproveJoinRequests } from "@/server/services/club-permissions.service";
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
      status: {
        in: ["ACTIVE", "INVITED", "REQUESTED"]
      }
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
      status: {
        in: ["ACTIVE", "INVITED", "REQUESTED"]
      }
    },
    include: clubMemberInclude,
    orderBy: [{ status: "asc" }, { role: "asc" }, { createdAt: "asc" }]
  });

  return members.map(toClubMemberDto);
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

export async function searchClubs(query?: string): Promise<ClubSummary[]> {
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

  return clubs.map((club) => toClubSummaryDto(club));
}
