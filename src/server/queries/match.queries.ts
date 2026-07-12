import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canCreateClubMatches } from "@/server/services/club-permissions.service";
import type { MatchCommentDto, MatchDto, MatchPermissions, MatchPlayerDto, MatchVideoDto } from "@/types/match.types";

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

export async function getClubMatches(clubId: string, currentUserId?: string): Promise<MatchDto[]> {
  const matches = await prisma.match.findMany({
    where: { OR: [{ creatorClubId: clubId }, { homeClubId: clubId }, { awayClubId: clubId }] },
    include: matchInclude,
    orderBy: { startTime: "asc" }
  });
  return Promise.all(matches.map((match) => toMatchDto(match, currentUserId)));
}

export async function getUpcomingClubMatches(clubId: string, currentUserId?: string): Promise<MatchDto[]> {
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ creatorClubId: clubId }, { homeClubId: clubId }, { awayClubId: clubId }],
      status: { in: ["DRAFT", "SCHEDULED", "LIVE"] }
    }, include: matchInclude, orderBy: { startTime: "asc" }
  });
  return Promise.all(matches.map((match) => toMatchDto(match, currentUserId)));
}

export async function getPendingMatchProposals(clubId: string, currentUserId: string): Promise<MatchDto[]> {
  if (!(await canCreateClubMatches(currentUserId, clubId))) return [];
  const matches = await prisma.match.findMany({
    where: { awayClubId: clubId, status: "PENDING_OPPONENT_APPROVAL" }, include: matchInclude, orderBy: { createdAt: "desc" }
  });
  return Promise.all(matches.map((match) => toMatchDto(match, currentUserId)));
}

export async function getMatchById(matchId: string, currentUserId?: string): Promise<MatchDto | null> {
  const match = await prisma.match.findUnique({ where: { id: matchId }, include: matchInclude });
  return match ? toMatchDto(match, currentUserId) : null;
}

export async function getMatchPlayers(matchId: string): Promise<MatchPlayerDto[]> {
  const players = await prisma.matchPlayer.findMany({
    where: { matchId, status: { not: "REMOVED" } },
    include: { user: { select: userSelect }, clubGuest: { select: { id: true, fullName: true, position: true } } },
    orderBy: { createdAt: "asc" }
  });
  return players.map(toMatchPlayerDto);
}

export async function getMatchVideos(matchId: string): Promise<MatchVideoDto[]> {
  const videos = await prisma.matchVideo.findMany({ where: { matchId }, include: { uploadedBy: { select: userSelect } }, orderBy: { createdAt: "desc" } });
  return videos.map(toMatchVideoDto);
}

async function toMatchDto(match: MatchRecord, currentUserId?: string): Promise<MatchDto> {
  const permissions = await getPermissions(match, currentUserId);
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

async function getPermissions(match: MatchRecord, userId?: string): Promise<MatchPermissions> {
  if (!userId) return emptyPermissions();
  const [creator, home, away] = await Promise.all([
    canCreateClubMatches(userId, match.creatorClubId),
    match.homeClubId ? canCreateClubMatches(userId, match.homeClubId) : false,
    match.awayClubId ? canCreateClubMatches(userId, match.awayClubId) : false
  ]);
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

function emptyPermissions(): MatchPermissions {
  return { canEditMatch: false, canAddPlayers: false, canSubmitResult: false, canConfirmResult: false, canDisputeResult: false, canAddMatchVideo: false, canManagePlayers: false };
}
