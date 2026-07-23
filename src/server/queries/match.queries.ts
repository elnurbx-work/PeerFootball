import "server-only";

import { Prisma, type MatchCategory, type MatchStatus, type MatchType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canCreateClubMatches } from "@/server/services/club-permissions.service";
import type { MatchCommentDto, MatchDto, MatchListItemDto, MatchPermissions, MatchPlayerDto, MatchVideoDto } from "@/types/match.types";
import { measureAsync } from "@/lib/performance";
import { PAGINATION_LIMITS } from "@/lib/pagination";

const clubSelect = { id: true, name: true, slug: true, logoUrl: true } as const;
const userSelect = { id: true, name: true, username: true, image: true } as const;
const matchInclude = {
  creatorClub: { select: clubSelect }, homeClub: { select: clubSelect }, awayClub: { select: clubSelect },
  sides: {
    include: {
      club: { select: clubSelect },
      players: {
        where: { status: { not: "REMOVED" as const } },
        include: { user: { select: userSelect }, clubGuest: { select: { id: true, fullName: true, position: true } } },
        orderBy: { createdAt: "asc" as const }
      }
    }, orderBy: { createdAt: "asc" as const }
  },
  videos: { include: { uploadedBy: { select: userSelect } }, orderBy: { createdAt: "desc" as const } },
  goals: { orderBy: [{ minute: "asc" as const }, { createdAt: "asc" as const }] },
  comments: {
    where: { parentId: null },
    include: {
      author: { select: userSelect },
      replies: { include: { author: { select: userSelect } }, orderBy: { createdAt: "asc" as const } }
    },
    orderBy: { createdAt: "desc" as const }
  }
} satisfies Prisma.MatchInclude;

type MatchRecord = Prisma.MatchGetPayload<{ include: typeof matchInclude }>;

type MatchListRecord = {
  id: string;
  type: MatchType;
  category: MatchCategory;
  status: MatchStatus;
  creatorClubId: string;
  homeClubId: string | null;
  awayClubId: string | null;
  title: string | null;
  venue: string | null;
  startTime: Date;
  sides: unknown;
};

export async function getClubMatches(clubId: string, _currentUserId?: string): Promise<MatchListItemDto[]> {
  const metadata = { route: "/clubs/[slug]/matches", matchCount: 0 };
  return measureAsync("matches.clubList", async () => {
    const matches = await measureAsync(
      "club.matchesPage",
      () => getMatchList(Prisma.sql`
        match_record."creatorClubId" = ${clubId}
        OR match_record."homeClubId" = ${clubId}
        OR match_record."awayClubId" = ${clubId}
      `),
      { route: "/clubs/[slug]/matches" }
    );
    metadata.matchCount = matches.length;
    return matches;
  }, metadata);
}

export async function getUpcomingClubMatches(clubId: string, _currentUserId?: string): Promise<MatchListItemDto[]> {
  return getMatchList(Prisma.sql`
    (
      match_record."creatorClubId" = ${clubId}
      OR match_record."homeClubId" = ${clubId}
      OR match_record."awayClubId" = ${clubId}
    )
    AND match_record."status" IN ('DRAFT', 'SCHEDULED', 'LIVE')
  `);
}

export async function getPendingMatchProposals(clubId: string, currentUserId: string): Promise<MatchListItemDto[]> {
  if (!(await canCreateClubMatches(currentUserId, clubId))) return [];
  return getMatchList(Prisma.sql`
    match_record."awayClubId" = ${clubId}
    AND match_record."status" = 'PENDING_OPPONENT_APPROVAL'
  `, Prisma.sql`match_record."createdAt" DESC`);
}

export async function getMatchesForClubs(clubIds: string[]): Promise<MatchListItemDto[]> {
  if (!clubIds.length) return [];
  return getMatchList(Prisma.sql`
    match_record."creatorClubId" IN (${Prisma.join(clubIds)})
    OR match_record."homeClubId" IN (${Prisma.join(clubIds)})
    OR match_record."awayClubId" IN (${Prisma.join(clubIds)})
  `);
}

export async function getMatchesForUserClubs(userId: string): Promise<MatchListItemDto[]> {
  const metadata = { route: "/matches", matchCount: 0 };
  return measureAsync("matches.list", async () => {
    const matches = await measureAsync(
      "matches.page",
      () => getMatchList(Prisma.sql`
        EXISTS (
          SELECT 1
          FROM "ClubMember" AS membership
          WHERE membership."userId" = ${userId}
            AND membership."status" = 'ACTIVE'
            AND (
              membership."clubId" = match_record."creatorClubId"
              OR membership."clubId" = match_record."homeClubId"
              OR membership."clubId" = match_record."awayClubId"
            )
          )
      `),
      { route: "/matches" }
    );
    metadata.matchCount = matches.length;
    return matches;
  }, metadata);
}

export async function getMatchById(matchId: string, currentUserId?: string): Promise<MatchDto | null> {
  const metadata = {
    route: "/matches/[matchId]",
    sideCount: 0,
    playerCount: 0,
    videoCount: 0,
    goalCount: 0,
    commentCount: 0,
    replyCount: 0
  };
  const [match, manageableClubIds] = await Promise.all([
    measureAsync("matches.detail", async () => {
      const result = await prisma.match.findUnique({ where: { id: matchId }, relationLoadStrategy: "join", include: matchInclude });
      metadata.sideCount = result?.sides.length ?? 0;
      metadata.playerCount = result?.sides.reduce((count, side) => count + side.players.length, 0) ?? 0;
      metadata.videoCount = result?.videos.length ?? 0;
      metadata.goalCount = result?.goals.length ?? 0;
      metadata.commentCount = result?.comments.length ?? 0;
      metadata.replyCount = result?.comments.reduce((count, comment) => count + comment.replies.length, 0) ?? 0;
      return result;
    }, metadata),
    getManageableClubIds(currentUserId)
  ]);
  return match ? toMatchDto(match, manageableClubIds) : null;
}

export async function getMatchPlayers(matchId: string): Promise<MatchPlayerDto[]> {
  const players = await prisma.matchPlayer.findMany({
    where: { matchId, status: { not: "REMOVED" } },
    relationLoadStrategy: "join",
    include: { user: { select: userSelect }, clubGuest: { select: { id: true, fullName: true, position: true } } },
    orderBy: { createdAt: "asc" }
  });
  return players.map(toMatchPlayerDto);
}

export async function getMatchVideos(matchId: string): Promise<MatchVideoDto[]> {
  const videos = await prisma.matchVideo.findMany({ where: { matchId }, relationLoadStrategy: "join", include: { uploadedBy: { select: userSelect } }, orderBy: { createdAt: "desc" } });
  return videos.map(toMatchVideoDto);
}

function toMatchDto(match: MatchRecord, manageableClubIds: Set<string>): MatchDto {
  const permissions = getPermissions(match, manageableClubIds);
  return {
    id: match.id, type: match.type, category: match.category, status: match.status,
    creatorClubId: match.creatorClubId, homeClubId: match.homeClubId, awayClubId: match.awayClubId,
    title: match.title, venue: match.venue, startTime: match.startTime.toISOString(), endTime: match.endTime?.toISOString() ?? null,
    homeScore: match.homeScore, awayScore: match.awayScore, resultNote: match.resultNote, disputeReason: match.disputeReason,
    creatorClub: match.creatorClub, homeClub: match.homeClub, awayClub: match.awayClub,
    sides: match.sides.map((side) => ({
      id: side.id, matchId: side.matchId, clubId: side.clubId, name: side.name, side: side.side, score: side.score,
      club: side.club, players: side.players.map(toMatchPlayerDto)
    })),
    videos: match.videos.map(toMatchVideoDto),
    goals: match.goals.map((goal) => ({ id: goal.id, matchId: goal.matchId, matchSideId: goal.matchSideId, matchPlayerId: goal.matchPlayerId, playerName: goal.playerName, minute: goal.minute, extraMinute: goal.extraMinute })),
    comments: match.comments.map(toMatchCommentDto),
    permissions, createdAt: match.createdAt.toISOString(), updatedAt: match.updatedAt.toISOString()
  };
}

function toMatchListItemDto(match: MatchListRecord): MatchListItemDto {
  const sides = Array.isArray(match.sides) ? match.sides : [];
  return {
    id: match.id,
    type: match.type,
    category: match.category,
    status: match.status,
    creatorClubId: match.creatorClubId,
    homeClubId: match.homeClubId,
    awayClubId: match.awayClubId,
    title: match.title,
    venue: match.venue,
    startTime: match.startTime.toISOString(),
    sides: sides.flatMap((side) => {
      if (!side || typeof side !== "object") return [];
      const value = side as { name?: unknown; playerCount?: unknown };
      if (typeof value.name !== "string") return [];
      return [{ name: value.name, playerCount: Number(value.playerCount) || 0 }];
    })
  };
}

async function getMatchList(where: Prisma.Sql, orderBy: Prisma.Sql = Prisma.sql`match_record."startTime" ASC`) {
  const matches = await prisma.$queryRaw<MatchListRecord[]>(Prisma.sql`
    WITH side_counts AS (
      SELECT
        side."id",
        side."matchId",
        side."name",
        side."createdAt",
        COUNT(player."id") FILTER (WHERE player."status" <> 'REMOVED')::integer AS "playerCount"
      FROM "MatchSide" AS side
      LEFT JOIN "MatchPlayer" AS player ON player."matchSideId" = side."id"
      GROUP BY side."id"
    )
    SELECT
      match_record."id",
      match_record."type",
      match_record."category",
      match_record."status",
      match_record."creatorClubId",
      match_record."homeClubId",
      match_record."awayClubId",
      match_record."title",
      match_record."venue",
      match_record."startTime",
      COALESCE(
        jsonb_agg(
          jsonb_build_object('name', side_counts."name", 'playerCount', side_counts."playerCount")
          ORDER BY side_counts."createdAt"
        ) FILTER (WHERE side_counts."id" IS NOT NULL),
        '[]'::jsonb
      ) AS "sides"
    FROM "Match" AS match_record
    LEFT JOIN side_counts ON side_counts."matchId" = match_record."id"
    WHERE ${where}
    GROUP BY match_record."id"
    ORDER BY ${orderBy}, match_record."id" DESC
    LIMIT ${PAGINATION_LIMITS.matches}
  `);
  return matches.map(toMatchListItemDto);
}

function toMatchCommentDto(comment: {
  id: string; matchId: string; parentId: string | null; content: string; author: MatchCommentDto["author"]; createdAt: Date;
  replies: Array<{ id: string; matchId: string; parentId: string | null; content: string; author: MatchCommentDto["author"]; createdAt: Date }>;
}): MatchCommentDto {
  return {
    id: comment.id, matchId: comment.matchId, parentId: comment.parentId, content: comment.content,
    author: comment.author, createdAt: comment.createdAt.toISOString(),
    replies: comment.replies.map((reply) => ({ ...reply, createdAt: reply.createdAt.toISOString(), replies: [] }))
  };
}

function toMatchPlayerDto(player: {
  id: string; matchId: string; matchSideId: string; userId: string | null; clubGuestId: string | null; guestName: string | null;
  position: MatchPlayerDto["position"]; shirtNumber: number | null; status: MatchPlayerDto["status"];
  user: MatchPlayerDto["user"]; clubGuest: MatchPlayerDto["clubGuest"];
}): MatchPlayerDto {
  return { ...player };
}

function toMatchVideoDto(video: {
  id: string; matchId: string; originalUrl: string; embedUrl: string; provider: MatchVideoDto["provider"];
  videoType: MatchVideoDto["videoType"]; matchStartSecond: number; publicId: string | null; title: string | null; description: string | null;
  uploadedBy: MatchVideoDto["uploadedBy"]; createdAt: Date; updatedAt: Date;
}): MatchVideoDto {
  return { ...video, createdAt: video.createdAt.toISOString(), updatedAt: video.updatedAt.toISOString() };
}

function getPermissions(match: MatchRecord, manageableClubIds: Set<string>): MatchPermissions {
  const creator = manageableClubIds.has(match.creatorClubId);
  const home = match.homeClubId ? manageableClubIds.has(match.homeClubId) : false;
  const away = match.awayClubId ? manageableClubIds.has(match.awayClubId) : false;
  const editable = !["FINISHED", "CANCELLED"].includes(match.status);
  const canManagePlayers = (match.type === "INTERNAL" ? creator : home || away) && editable;
  return {
    canEditMatch: creator && editable,
    canAddPlayers: canManagePlayers,
    canSubmitResult: (match.type === "INTERNAL" ? creator : home) && ["SCHEDULED", "LIVE"].includes(match.status),
    canConfirmResult: match.type === "CLUB_VS_CLUB" && away && !home && match.status === "RESULT_PENDING_CONFIRMATION",
    canDisputeResult: match.type === "CLUB_VS_CLUB" && away && !home && match.status === "RESULT_PENDING_CONFIRMATION",
    canAddMatchVideo: (match.type === "INTERNAL" ? creator : home) && match.status !== "FINISHED",
    canManagePlayers
  };
}

async function getManageableClubIds(userId?: string) {
  if (!userId) return new Set<string>();
  const memberships = await prisma.clubMember.findMany({
    where: { userId, status: "ACTIVE" },
    select: {
      clubId: true,
      role: true,
      club: {
        select: {
          settings: { select: { matchCreatePermissionPolicy: true } }
        }
      }
    }
  });
  const allowedRoles = {
    OWNER_ONLY: ["OWNER"],
    OWNER_TD: ["OWNER", "TD"],
    OWNER_TD_YTD: ["OWNER", "TD", "YTD"]
  } as const;

  return new Set(
    memberships
      .filter((membership) => {
        const policy = membership.club.settings?.matchCreatePermissionPolicy ?? "OWNER_TD";
        return (allowedRoles[policy] as readonly string[]).includes(membership.role);
      })
      .map((membership) => membership.clubId)
  );
}

function emptyPermissions(): MatchPermissions {
  return { canEditMatch: false, canAddPlayers: false, canSubmitResult: false, canConfirmResult: false, canDisputeResult: false, canAddMatchVideo: false, canManagePlayers: false };
}
