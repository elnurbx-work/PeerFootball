import "server-only";

import { Prisma } from "@prisma/client";
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
import {
  PAGINATION_LIMITS,
  toNumberedPage,
  type NumberedPage
} from "@/lib/pagination";
import { measureAsync } from "@/lib/performance";

export async function getMyClubs(userId: string): Promise<ClubSummary[]> {
  const memberships = await prisma.clubMember.findMany({
    where: {
      userId,
      status: "ACTIVE"
    },
    relationLoadStrategy: "join",
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

export type MyClubNavigationItem = {
  id: string;
  name: string;
  slug: string;
};

export async function getMyClubNavigation(userId: string): Promise<MyClubNavigationItem[]> {
  return prisma.$queryRaw<MyClubNavigationItem[]>(Prisma.sql`
    SELECT club."id", club."name", club."slug"
    FROM "ClubMember" AS membership
    INNER JOIN "Club" AS club ON club."id" = membership."clubId"
    WHERE membership."userId" = ${userId}
      AND membership."status" = 'ACTIVE'
    ORDER BY membership."updatedAt" DESC
  `);
}

export async function getMyPendingClubs(userId: string): Promise<ClubSummary[]> {
  const memberships = await prisma.clubMember.findMany({
    where: { userId, status: { in: ["INVITED", "REQUESTED"] } },
    relationLoadStrategy: "join",
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
    relationLoadStrategy: "join",
    include: {
      ...clubDetailsInclude,
      members: {
        where: { status: { in: ["ACTIVE", "INVITED", "REQUESTED"] } },
        select: {
          id: true,
          userId: true,
          role: true,
          status: true
        }
      }
    }
  });

  if (!club) {
    return null;
  }

  const currentUserMembership = currentUserId
    ? club.members.find((membership) => membership.userId === currentUserId) ?? null
    : null;

  return toClubDetailsDto(
    {
      ...club,
      members: club.members
        .filter((membership) => membership.status === "ACTIVE")
        .map((membership) => ({ id: membership.id }))
    },
    currentUserMembership
  );
}

export async function getClubMembers(clubId: string): Promise<ClubMemberDto[]> {
  const members = await prisma.clubMember.findMany({
    where: {
      clubId,
      status: "ACTIVE"
    },
    relationLoadStrategy: "join",
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

export async function getMatchClubOptions(clubIds: string[], userId: string) {
  const uniqueClubIds = [...new Set(clubIds)];
  if (!uniqueClubIds.length) return {};

  const [members, guests, memberships] = await Promise.all([
    prisma.clubMember.findMany({
      where: { clubId: { in: uniqueClubIds }, status: "ACTIVE" },
      relationLoadStrategy: "join",
      include: clubMemberInclude,
      orderBy: [{ clubId: "asc" }, { role: "asc" }, { createdAt: "asc" }]
    }),
    prisma.clubGuest.findMany({
      where: { clubId: { in: uniqueClubIds } },
      orderBy: [{ clubId: "asc" }, { isActive: "desc" }, { fullName: "asc" }]
    }),
    prisma.clubMember.findMany({
      where: { clubId: { in: uniqueClubIds }, userId, status: "ACTIVE" },
      relationLoadStrategy: "join",
      select: {
        clubId: true,
        role: true,
        club: {
          select: {
            settings: { select: { matchCreatePermissionPolicy: true } }
          }
        }
      }
    })
  ]);

  const manageableClubIds = new Set(
    memberships
      .filter((membership) => {
        const policy = membership.club.settings?.matchCreatePermissionPolicy ?? "OWNER_TD";
        const allowedRoles = policy === "OWNER_ONLY"
          ? ["OWNER"]
          : policy === "OWNER_TD_YTD"
            ? ["OWNER", "TD", "YTD"]
            : ["OWNER", "TD"];
        return allowedRoles.includes(membership.role);
      })
      .map((membership) => membership.clubId)
  );

  return Object.fromEntries(uniqueClubIds.map((clubId) => [clubId, {
    members: members.filter((member) => member.clubId === clubId).map(toClubMemberDto),
    guests: guests.filter((guest) => guest.clubId === clubId).map(toClubGuestDto),
    canManage: manageableClubIds.has(clubId)
  }]));
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

export async function getClubMembersPageData(clubId: string, userId: string, page = 1) {
  const pageSize = PAGINATION_LIMITS.clubMembers;
  const membersWhere: Prisma.ClubMemberWhereInput = {
    clubId,
    OR: [
      { status: "ACTIVE" },
      { status: "REQUESTED" },
      { status: "INVITED", userId }
    ]
  };
  const [currentMembership, memberPage, ownInviteRecord] = await Promise.all([
    prisma.clubMember.findFirst({
      where: { clubId, userId, status: { in: ["ACTIVE", "INVITED", "REQUESTED"] } },
      relationLoadStrategy: "join",
      select: {
        role: true,
        status: true,
        club: {
          select: {
            settings: {
              select: {
                joinApprovalPolicy: true,
                invitePermissionPolicy: true
              }
            }
          }
        }
      }
    }),
    measureAsync("club.membersPage", () => Promise.all([
      prisma.clubMember.findMany({
        where: membersWhere,
        relationLoadStrategy: "join",
        include: clubMemberInclude,
        orderBy: [{ status: "asc" }, { role: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.clubMember.count({ where: membersWhere })
    ]), { route: "/clubs/[slug]/members", page, pageSize }),
    prisma.clubMember.findFirst({
      where: { clubId, userId, status: "INVITED" },
      include: clubMemberInclude,
      orderBy: { createdAt: "desc" }
    })
  ]);
  const [membershipRecords, totalItems] = memberPage;

  const role = currentMembership?.status === "ACTIVE" ? currentMembership.role : null;
  const settings = currentMembership?.club.settings;
  const policyAllows = (policy: "OWNER_ONLY" | "OWNER_TD" | "OWNER_TD_YTD") => {
    if (!role) return false;
    if (policy === "OWNER_ONLY") return role === "OWNER";
    if (policy === "OWNER_TD_YTD") return role === "OWNER" || role === "TD" || role === "YTD";
    return role === "OWNER" || role === "TD";
  };
  const canManageRequests = policyAllows(settings?.joinApprovalPolicy ?? "OWNER_TD");
  const canInvite = policyAllows(settings?.invitePermissionPolicy ?? "OWNER_TD");
  const members = membershipRecords.map(toClubMemberDto);

  return {
    activeMembers: members.filter((member) => member.status === "ACTIVE"),
    pendingRequests: canManageRequests
      ? members.filter((member) => member.status === "REQUESTED")
      : [],
    ownInvite: ownInviteRecord ? toClubMemberDto(ownInviteRecord) : null,
    canManageRequests,
    canInvite,
    owner: role === "OWNER",
    page,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize))
  };
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

export async function searchClubsPage(
  query: string | undefined,
  currentUserId: string,
  page: number
): Promise<NumberedPage<ClubSummary>> {
  const trimmedQuery = query?.trim();
  const where: Prisma.ClubWhereInput = {
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
  };
  const pageSize = PAGINATION_LIMITS.clubs;
  const metadata = { route: "/clubs", itemCount: 0, page };

  return measureAsync("clubs.page", async () => {
    const [clubs, totalItems] = await Promise.all([
      prisma.club.findMany({
        where,
        include: clubSummaryInclude,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.club.count({ where })
    ]);
    const memberships = await prisma.clubMember.findMany({
      where: {
        userId: currentUserId,
        clubId: { in: clubs.map((club) => club.id) },
        status: { in: ["ACTIVE", "INVITED", "REQUESTED"] }
      },
      select: { clubId: true, role: true, status: true }
    });
    const membershipByClubId = new Map(memberships.map((item) => [item.clubId, item]));
    const result = toNumberedPage(
      clubs.map((club) => toClubSummaryDto(club, membershipByClubId.get(club.id) ?? null)),
      page,
      pageSize,
      totalItems
    );
    metadata.itemCount = result.items.length;
    return result;
  }, metadata);
}
