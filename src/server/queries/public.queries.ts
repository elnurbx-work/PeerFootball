import "server-only";

import { Prisma } from "@prisma/client";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type {
  PublicClub,
  PublicMatch,
  PublicPage,
  PublicPlatformStats,
  PublicPlayer
} from "@/types/public.types";

const PAGE_SIZE = 18;
const publicClubWhere = { isActive: true, visibility: "OPEN" as const };
const publicMatchWhere: Prisma.MatchWhereInput = {
  status: { in: ["SCHEDULED", "LIVE", "COMPLETED"] },
  OR: [
    {
      type: "INTERNAL",
      creatorClub: { isActive: true }
    },
    {
      type: "CLUB_VS_CLUB",
      homeClub: { isActive: true },
      awayClub: { isActive: true }
    }
  ]
};

export async function getPublicPlayers(input: {
  query?: string;
  position?: string;
  region?: string;
  page?: number;
} = {}): Promise<PublicPage<PublicPlayer>> {
  const page = normalizePage(input.page);
  const query = input.query?.trim();
  const position = input.position?.trim();
  const region = input.region?.trim();
  const where: Prisma.UserWhereInput = {
    profileVisibility: "PUBLIC",
    isBanned: false,
    email: { not: null },
    username: { not: null },
    ...(query ? { OR: [
      { name: { contains: query, mode: "insensitive" } },
      { username: { contains: query, mode: "insensitive" } },
      { bio: { contains: query, mode: "insensitive" } }
    ] } : {}),
    ...(position ? { preferredPosition: position } : {}),
    ...(region ? { location: { contains: region, mode: "insensitive" } } : {})
  };
  const [rows, totalItems] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, username: true, image: true, bio: true,
        preferredPosition: true, location: true, favoriteClub: true,
        clubMemberships: {
          where: { status: "ACTIVE", club: publicClubWhere },
          select: { club: { select: { name: true, slug: true } } },
          take: 4
        }
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    prisma.user.count({ where })
  ]);
  return pageResult(rows.map((row) => ({
    id: row.id,
    name: row.name?.trim() || row.username!,
    username: row.username!,
    image: row.image,
    bio: row.bio,
    preferredPosition: row.preferredPosition,
    location: row.location,
    favoriteClub: row.favoriteClub,
    clubs: row.clubMemberships.map((membership) => membership.club)
  })), page, totalItems);
}

export async function getPublicPlayerByUsername(username: string): Promise<PublicPlayer | null> {
  const row = await prisma.user.findFirst({
    where: {
      username: { equals: username, mode: "insensitive" },
      profileVisibility: "PUBLIC",
      isBanned: false,
      email: { not: null }
    },
    select: {
      id: true, name: true, username: true, image: true, bio: true,
      preferredPosition: true, location: true, favoriteClub: true,
      clubMemberships: {
        where: { status: "ACTIVE", club: publicClubWhere },
        select: { club: { select: { name: true, slug: true } } },
        take: 4
      }
    }
  });
  if (!row?.username) return null;
  return {
    id: row.id,
    name: row.name?.trim() || row.username,
    username: row.username,
    image: row.image,
    bio: row.bio,
    preferredPosition: row.preferredPosition,
    location: row.location,
    favoriteClub: row.favoriteClub,
    clubs: row.clubMemberships.map((membership) => membership.club)
  };
}

export async function getPublicTeams(input: { query?: string; region?: string; page?: number } = {}): Promise<PublicPage<PublicClub>> {
  const page = normalizePage(input.page);
  const query = input.query?.trim();
  const region = input.region?.trim();
  const where: Prisma.ClubWhereInput = {
    ...publicClubWhere,
    ...(query ? { OR: [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } }
    ] } : {}),
    ...(region ? { OR: [
      { city: { contains: region, mode: "insensitive" } },
      { country: { contains: region, mode: "insensitive" } }
    ] } : {})
  };
  const [rows, totalItems] = await Promise.all([
    prisma.club.findMany({
      where,
      select: {
        id: true, name: true, slug: true, description: true, logoUrl: true, coverUrl: true,
        country: true, city: true, createdAt: true, updatedAt: true,
        _count: { select: { members: { where: { status: "ACTIVE" } } } }
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    prisma.club.count({ where })
  ]);
  return pageResult(rows.map(toPublicClub), page, totalItems);
}

export async function getPublicTeamBySlug(slug: string): Promise<PublicClub | null> {
  const row = await prisma.club.findFirst({
    where: { slug, ...publicClubWhere },
    select: {
      id: true, name: true, slug: true, description: true, logoUrl: true, coverUrl: true,
      country: true, city: true, createdAt: true, updatedAt: true,
      _count: { select: { members: { where: { status: "ACTIVE" } } } }
    }
  });
  return row ? toPublicClub(row) : null;
}

export async function getPublicMatches(input: { filter?: "upcoming" | "completed"; page?: number } = {}): Promise<PublicPage<PublicMatch>> {
  const page = normalizePage(input.page);
  const where: Prisma.MatchWhereInput = {
    ...publicMatchWhere,
    ...(input.filter === "completed"
      ? { status: "COMPLETED" }
      : { status: { in: ["SCHEDULED", "LIVE"] } })
  };
  const [rows, totalItems] = await Promise.all([
    prisma.match.findMany({
      where,
      select: publicMatchSelect,
      orderBy: input.filter === "completed" ? { completedAt: "desc" } : { startTime: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    prisma.match.count({ where })
  ]);
  return pageResult(rows.map(toPublicMatch), page, totalItems);
}

export async function getPublicMatchById(id: string): Promise<PublicMatch | null> {
  const row = await prisma.match.findFirst({ where: { id, ...publicMatchWhere }, select: publicMatchSelect });
  return row ? toPublicMatch(row) : null;
}

export async function getPublicMatchesForClub(clubId: string, take = 6): Promise<PublicMatch[]> {
  const rows = await prisma.match.findMany({
    where: {
      ...publicMatchWhere,
      OR: [{ homeClubId: clubId }, { awayClubId: clubId }]
    },
    select: publicMatchSelect,
    orderBy: { startTime: "desc" },
    take: Math.min(Math.max(take, 1), 12)
  });
  return rows.map(toPublicMatch);
}

export const getPublicPlatformStats = cache(async (): Promise<PublicPlatformStats> => {
  const [players, clubs, completedMatches] = await Promise.all([
    prisma.user.count({ where: { profileVisibility: "PUBLIC", isBanned: false, username: { not: null } } }),
    prisma.club.count({ where: publicClubWhere }),
    prisma.match.count({ where: { ...publicMatchWhere, status: "COMPLETED" } })
  ]);
  return { players, clubs, completedMatches };
});

export const getPublicSitemapEntries = cache(async () => {
  const [players, teams, matches] = await Promise.all([
    prisma.user.findMany({
      where: { profileVisibility: "PUBLIC", isBanned: false, username: { not: null } },
      select: { username: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000
    }),
    prisma.club.findMany({
      where: publicClubWhere,
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000
    }),
    prisma.match.findMany({
      where: publicMatchWhere,
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000
    })
  ]);
  return {
    players: players.flatMap((player) => player.username ? [{ username: player.username, updatedAt: player.updatedAt }] : []),
    teams,
    matches
  };
});

const publicMatchSelect = {
  id: true, title: true, format: true, category: true, status: true, venue: true,
  startTime: true, homeScore: true, awayScore: true, updatedAt: true,
  sides: {
    select: { id: true, name: true, score: true, club: { select: { logoUrl: true } } },
    orderBy: { createdAt: "asc" as const }
  },
  goals: {
    select: { id: true, playerName: true, minute: true, extraMinute: true, matchSideId: true },
    orderBy: [{ minute: "asc" as const }, { createdAt: "asc" as const }]
  }
} satisfies Prisma.MatchSelect;

function toPublicMatch(row: Prisma.MatchGetPayload<{ select: typeof publicMatchSelect }>): PublicMatch {
  return {
    id: row.id, title: row.title, format: row.format, category: row.category, status: row.status,
    venue: row.venue, startTime: row.startTime.toISOString(), homeScore: row.homeScore,
    awayScore: row.awayScore, updatedAt: row.updatedAt.toISOString(),
    sides: row.sides.map((side) => ({ id: side.id, name: side.name, logoUrl: side.club?.logoUrl ?? null, score: side.score })),
    goals: row.goals.map((goal) => ({ id: goal.id, playerName: goal.playerName, minute: goal.minute, extraMinute: goal.extraMinute, sideId: goal.matchSideId }))
  };
}

function toPublicClub(row: {
  id: string; name: string; slug: string; description: string | null; logoUrl: string | null;
  coverUrl: string | null; country: string | null; city: string | null; createdAt: Date; updatedAt: Date;
  _count: { members: number };
}): PublicClub {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: row.logoUrl,
    coverUrl: row.coverUrl,
    country: row.country,
    city: row.city,
    memberCount: row._count.members,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function normalizePage(page?: number) {
  return Math.max(1, Math.trunc(page || 1));
}

function pageResult<T>(items: T[], page: number, totalItems: number): PublicPage<T> {
  return { items, page, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / PAGE_SIZE)) };
}
