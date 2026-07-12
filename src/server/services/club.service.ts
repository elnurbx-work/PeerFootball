import "server-only";

import type { FootballPosition, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ClubDetails,
  ClubGuestDto,
  ClubMemberDto,
  ClubMetricDefinitionDto,
  ClubSettingsDto,
  ClubSummary
} from "@/types/club.types";

export const clubUserSelect = {
  id: true,
  name: true,
  username: true,
  image: true
} as const;

export const clubSettingsSelect = {
  id: true,
  clubId: true,
  joinApprovalPolicy: true,
  invitePermissionPolicy: true,
  matchCreatePermissionPolicy: true,
  guestInvitePolicy: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.ClubSettingsSelect;

export const clubMemberInclude = {
  user: {
    select: clubUserSelect
  },
  invitedBy: {
    select: clubUserSelect
  }
} satisfies Prisma.ClubMemberInclude;

export const clubSummaryInclude = {
  owner: {
    select: clubUserSelect
  },
  members: {
    where: {
      status: "ACTIVE"
    },
    select: {
      id: true
    }
  }
} satisfies Prisma.ClubInclude;

export const clubDetailsInclude = {
  ...clubSummaryInclude,
  settings: {
    select: clubSettingsSelect
  }
} satisfies Prisma.ClubInclude;

type ClubSummaryRecord = Prisma.ClubGetPayload<{ include: typeof clubSummaryInclude }>;
type ClubDetailsRecord = Prisma.ClubGetPayload<{ include: typeof clubDetailsInclude }>;
type ClubMemberRecord = Prisma.ClubMemberGetPayload<{ include: typeof clubMemberInclude }>;
type ClubSettingsRecord = Prisma.ClubSettingsGetPayload<{ select: typeof clubSettingsSelect }>;

export async function userHasOwnedClub(userId: string) {
  const club = await prisma.club.findFirst({
    where: {
      ownerId: userId
    },
    select: {
      id: true
    }
  });

  return Boolean(club);
}

export async function createUniqueClubSlug(name: string, requestedSlug?: string) {
  const baseSlug = slugify(requestedSlug || name) || "club";
  let slug = baseSlug;
  let suffix = 2;

  while (await prisma.club.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function getReusableClubMembership(clubId: string, userId: string) {
  return prisma.clubMember.findFirst({
    where: {
      clubId,
      userId,
      status: {
        in: ["ACTIVE", "INVITED", "REQUESTED"]
      }
    },
    select: {
      id: true,
      status: true,
      role: true
    }
  });
}

export function toClubSettingsDto(settings: ClubSettingsRecord): ClubSettingsDto {
  return {
    id: settings.id,
    clubId: settings.clubId,
    joinApprovalPolicy: settings.joinApprovalPolicy,
    invitePermissionPolicy: settings.invitePermissionPolicy,
    matchCreatePermissionPolicy: settings.matchCreatePermissionPolicy,
    guestInvitePolicy: settings.guestInvitePolicy,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString()
  };
}

export function toClubSummaryDto(
  club: ClubSummaryRecord,
  currentUserMembership?: { role: ClubSummary["currentUserRole"]; status: ClubSummary["currentUserMemberStatus"] } | null
): ClubSummary {
  return {
    id: club.id,
    name: club.name,
    slug: club.slug,
    description: club.description,
    logoUrl: club.logoUrl,
    coverUrl: club.coverUrl,
    country: club.country,
    city: club.city,
    ownerId: club.ownerId,
    owner: club.owner,
    visibility: club.visibility,
    isActive: club.isActive,
    createdAt: club.createdAt.toISOString(),
    updatedAt: club.updatedAt.toISOString(),
    memberCount: club.members.length,
    currentUserRole: currentUserMembership?.role ?? null,
    currentUserMemberStatus: currentUserMembership?.status ?? null
  };
}

export function toClubDetailsDto(
  club: ClubDetailsRecord,
  currentUserMembership?: { role: ClubSummary["currentUserRole"]; status: ClubSummary["currentUserMemberStatus"] } | null
): ClubDetails {
  return {
    ...toClubSummaryDto(club, currentUserMembership),
    deactivatedAt: club.deactivatedAt?.toISOString() ?? null,
    deactivatedById: club.deactivatedById,
    settings: toClubSettingsDto(club.settings ?? getDefaultSettingsRecord(club.id, club.createdAt, club.updatedAt))
  };
}

export function toClubMemberDto(member: ClubMemberRecord): ClubMemberDto {
  return {
    id: member.id,
    clubId: member.clubId,
    userId: member.userId,
    user: member.user,
    role: member.role,
    status: member.status,
    invitedById: member.invitedById,
    invitedBy: member.invitedBy,
    joinedAt: member.joinedAt?.toISOString() ?? null,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString()
  };
}

export function toClubGuestDto(guest: {
  id: string;
  clubId: string;
  fullName: string;
  position: FootballPosition | null;
  phone: string | null;
  note: string | null;
  createdById: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ClubGuestDto {
  return {
    id: guest.id,
    clubId: guest.clubId,
    fullName: guest.fullName,
    position: guest.position,
    phone: guest.phone,
    note: guest.note,
    createdById: guest.createdById,
    isActive: guest.isActive,
    createdAt: guest.createdAt.toISOString(),
    updatedAt: guest.updatedAt.toISOString()
  };
}

export function toClubMetricDefinitionDto(metric: {
  id: string;
  clubId: string;
  name: string;
  description: string | null;
  order: number;
  isActive: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}): ClubMetricDefinitionDto {
  return {
    id: metric.id,
    clubId: metric.clubId,
    name: metric.name,
    description: metric.description,
    order: metric.order,
    isActive: metric.isActive,
    createdById: metric.createdById,
    createdAt: metric.createdAt.toISOString(),
    updatedAt: metric.updatedAt.toISOString()
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getDefaultSettingsRecord(clubId: string, createdAt: Date, updatedAt: Date): ClubSettingsRecord {
  return {
    id: "",
    clubId,
    joinApprovalPolicy: "OWNER_TD",
    invitePermissionPolicy: "OWNER_TD",
    matchCreatePermissionPolicy: "OWNER_TD",
    guestInvitePolicy: "ONLY_OWNER_TD_YTD",
    createdAt,
    updatedAt
  };
}
