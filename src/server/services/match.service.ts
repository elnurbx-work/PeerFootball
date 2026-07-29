import "server-only";

import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  addMatchPlayerSchema,
  cancelMatchSchema,
  createClubVsClubMatchProposalSchema,
  respondToMatchAttendanceSchema,
  respondToMatchProposalSchema,
  reviewMatchResultSchema,
  submitMatchResultSchema,
  updateMatchLineupSchema
} from "@/lib/validations/match";
import {
  canCreateClubMatches,
  ensureClubActive,
  getClubMatchManagerIds
} from "@/server/services/club-permissions.service";
import { createMatchNotifications } from "@/server/services/notification.service";
import {
  ACTIVE_CLUB_MATCH_STATUSES,
  appendRecentForm,
  assertProposalRules,
  assertMatchTransition,
  CANCELLABLE_MATCH_STATUSES,
  getClubResult,
  getProposalAcceptancePath,
  getStarterLimit,
  MatchDomainError,
  submittedScoresDiffer
} from "@/server/services/match-domain";

type CreateProposalInput = z.infer<typeof createClubVsClubMatchProposalSchema>;
type ProposalResponseInput = z.infer<typeof respondToMatchProposalSchema>;
type CancelMatchInput = z.infer<typeof cancelMatchSchema>;
type AddPlayerInput = z.infer<typeof addMatchPlayerSchema>;
type UpdateLineupInput = z.infer<typeof updateMatchLineupSchema>;
type AttendanceInput = z.infer<typeof respondToMatchAttendanceSchema>;
type SubmitResultInput = z.infer<typeof submitMatchResultSchema>;
type ReviewResultInput = z.infer<typeof reviewMatchResultSchema>;

export async function createClubMatchProposal(userId: string, input: CreateProposalInput) {
  assertProposalRules(input.proposerClubId, input.opponentClubId, input.startTime);
  if (!(await canCreateClubMatches(userId, input.proposerClubId))) {
    throw new MatchDomainError("FORBIDDEN", "Only an authorized club manager can create a match.");
  }

  await Promise.all([ensureClubActive(input.proposerClubId), ensureClubActive(input.opponentClubId)]);
  const clubs = await prisma.club.findMany({
    where: { id: { in: [input.proposerClubId, input.opponentClubId] }, isActive: true },
    select: { id: true, name: true }
  });
  if (clubs.length !== 2) throw new MatchDomainError("CLUB_NOT_FOUND", "One of the clubs was not found.");

  const duplicate = await prisma.match.findFirst({
    where: {
      type: "CLUB_VS_CLUB",
      startTime: input.startTime,
      status: { in: ACTIVE_CLUB_MATCH_STATUSES },
      OR: [
        { homeClubId: input.proposerClubId, awayClubId: input.opponentClubId },
        { homeClubId: input.opponentClubId, awayClubId: input.proposerClubId }
      ]
    },
    select: { id: true }
  });
  if (duplicate) throw new MatchDomainError("DUPLICATE_MATCH", "An active match already exists for these clubs at this time.");

  const proposer = clubs.find((club) => club.id === input.proposerClubId)!;
  const opponent = clubs.find((club) => club.id === input.opponentClubId)!;
  const home = input.proposerIsHome ? proposer : opponent;
  const away = input.proposerIsHome ? opponent : proposer;
  const endTime = new Date(input.startTime.getTime() + input.durationMinutes * 60_000);

  try {
    const match = await prisma.match.create({
      data: {
        type: "CLUB_VS_CLUB",
        source: "MANUAL",
        format: input.format,
        category: input.category,
        status: "PENDING",
        creatorClubId: proposer.id,
        homeClubId: home.id,
        awayClubId: away.id,
        title: input.title,
        venue: input.venue,
        note: input.note,
        startTime: input.startTime,
        endTime,
        durationMinutes: input.durationMinutes,
        createdById: userId,
        sides: {
          create: [
            { side: "HOME", name: home.name, clubId: home.id },
            { side: "AWAY", name: away.name, clubId: away.id }
          ]
        }
      },
      select: { id: true }
    });
    const recipients = await getClubMatchManagerIds(opponent.id);
    await createMatchNotifications({
      recipientIds: recipients,
      actorId: userId,
      matchId: match.id,
      type: "MATCH_INVITATION_RECEIVED"
    });
    return match;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new MatchDomainError("DUPLICATE_MATCH", "An active match already exists for these clubs at this time.");
    }
    throw error;
  }
}

export async function respondToClubMatchProposal(userId: string, input: ProposalResponseInput) {
  const match = await getClubMatch(input.matchId);
  const opponentClubId = getOpponentClubId(match);
  if (!(await canCreateClubMatches(userId, opponentClubId))) {
    throw new MatchDomainError("FORBIDDEN", "Only the invited club's managers can respond.");
  }
  await ensureClubActive(opponentClubId);

  const nextStatus = input.response === "ACCEPT" ? "SCHEDULED" : "REJECTED";
  if (input.response === "ACCEPT") getProposalAcceptancePath(match.status);
  else assertMatchTransition(match.status, "REJECTED");

  const updated = await prisma.match.updateMany({
    where: { id: match.id, status: "PENDING" },
    data: {
      status: nextStatus,
      rejectionReason: input.response === "REJECT" ? input.rejectionReason : null
    }
  });
  if (updated.count !== 1) throw new MatchDomainError("STALE_MATCH", "The proposal was already handled.");

  const recipientIds = input.response === "ACCEPT"
    ? [...await getClubMatchManagerIds(match.creatorClubId), ...await getClubMatchManagerIds(opponentClubId)]
    : await getClubMatchManagerIds(match.creatorClubId);
  await createMatchNotifications({
    recipientIds,
    actorId: userId,
    matchId: match.id,
    type: input.response === "ACCEPT" ? "MATCH_INVITATION_ACCEPTED" : "MATCH_INVITATION_REJECTED"
  });
}

export async function cancelClubMatch(userId: string, input: CancelMatchInput) {
  const match = await getClubMatch(input.matchId);
  if (!CANCELLABLE_MATCH_STATUSES.includes(match.status)) {
    throw new MatchDomainError("INVALID_STATUS_TRANSITION", "This match can no longer be cancelled.");
  }
  assertMatchTransition(match.status, "CANCELLED");
  const managingClubId = await getManagingParticipantClub(userId, match);

  const updated = await prisma.match.updateMany({
    where: { id: match.id, status: match.status },
    data: { status: "CANCELLED", cancellationReason: input.reason, cancellationNote: input.note }
  });
  if (updated.count !== 1) throw new MatchDomainError("STALE_MATCH", "The match changed before it could be cancelled.");

  const otherClubId = managingClubId === match.homeClubId ? match.awayClubId! : match.homeClubId!;
  const [managers, players] = await Promise.all([
    getClubMatchManagerIds(otherClubId),
    prisma.matchPlayer.findMany({
      where: { matchId: match.id, userId: { not: null }, status: { not: "REMOVED" } },
      select: { userId: true }
    })
  ]);
  await createMatchNotifications({
    recipientIds: [...managers, ...players.flatMap((player) => player.userId ? [player.userId] : [])],
    actorId: userId,
    matchId: match.id,
    type: "MATCH_CANCELLED"
  });
}

export async function inviteClubMatchPlayer(userId: string, input: AddPlayerInput) {
  const match = await getClubMatch(input.matchId);
  if (match.status !== "SCHEDULED") {
    throw new MatchDomainError("LINEUP_LOCKED", "Players can only be invited to a scheduled match.");
  }
  const side = await prisma.matchSide.findFirst({
    where: { id: input.matchSideId, matchId: match.id },
    select: { id: true, clubId: true }
  });
  if (!side?.clubId || !(await canCreateClubMatches(userId, side.clubId))) {
    throw new MatchDomainError("FORBIDDEN", "A club can only manage its own lineup.");
  }
  if (!input.userId || input.clubGuestId || input.guestName) {
    throw new MatchDomainError("MEMBER_REQUIRED", "Club matches only accept active club members.");
  }
  const membership = await prisma.clubMember.findFirst({
    where: { clubId: side.clubId, userId: input.userId, status: "ACTIVE" },
    select: { id: true }
  });
  if (!membership) throw new MatchDomainError("MEMBER_REQUIRED", "The player is not an active member of this club.");
  await assertStarterCapacity(match.id, match.format, side.id, input.lineupRole);

  try {
    await prisma.$transaction(async (tx) => {
      if (input.isCaptain) {
        await tx.matchPlayer.updateMany({ where: { matchSideId: side.id, isCaptain: true }, data: { isCaptain: false } });
      }

      const existingPlayer = await tx.matchPlayer.findUnique({
        where: {
          matchId_userId: {
            matchId: match.id,
            userId: input.userId!
          }
        },
        select: { id: true, status: true }
      });
      const playerData = {
        matchSideId: side.id,
        position: input.position,
        shirtNumber: input.shirtNumber,
        lineupRole: input.lineupRole,
        isCaptain: input.isCaptain,
        isGoalkeeper: input.isGoalkeeper,
        status: "INVITED" as const,
        invitedById: userId,
        acceptedAt: null
      };

      if (existingPlayer) {
        if (existingPlayer.status !== "REMOVED") {
          throw new MatchDomainError("PLAYER_DUPLICATE", "This player is already assigned to the match.");
        }
        await tx.matchPlayer.update({
          where: { id: existingPlayer.id },
          data: playerData
        });
      } else {
        await tx.matchPlayer.create({
          data: {
            matchId: match.id,
            userId: input.userId,
            ...playerData
          }
        });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new MatchDomainError("PLAYER_DUPLICATE", "This player is already assigned to the match.");
    }
    throw error;
  }
  await createMatchNotifications({
    recipientIds: [input.userId],
    actorId: userId,
    matchId: match.id,
    type: "MATCH_PLAYER_INVITED"
  });
}

export async function updateClubMatchLineup(userId: string, input: UpdateLineupInput) {
  const player = await prisma.matchPlayer.findUnique({
    where: { id: input.matchPlayerId },
    include: { match: true, matchSide: true }
  });
  if (!player || player.match.type !== "CLUB_VS_CLUB" || player.match.status !== "SCHEDULED" || !player.matchSide.clubId) {
    throw new MatchDomainError("LINEUP_LOCKED", "This lineup can no longer be changed.");
  }
  if (!(await canCreateClubMatches(userId, player.matchSide.clubId))) {
    throw new MatchDomainError("FORBIDDEN", "A club can only manage its own lineup.");
  }
  if (player.lineupRole !== "STARTER" && input.lineupRole === "STARTER") {
    await assertStarterCapacity(player.matchId, player.match.format, player.matchSideId, input.lineupRole);
  }
  await prisma.$transaction(async (tx) => {
    if (input.isCaptain) {
      await tx.matchPlayer.updateMany({
        where: { matchSideId: player.matchSideId, isCaptain: true, id: { not: player.id } },
        data: { isCaptain: false }
      });
    }
    await tx.matchPlayer.update({
      where: { id: player.id },
      data: {
        lineupRole: input.lineupRole,
        position: input.position,
        shirtNumber: input.shirtNumber,
        isCaptain: input.isCaptain,
        isGoalkeeper: input.isGoalkeeper
      }
    });
  });
}

export async function respondToClubMatchAttendance(userId: string, input: AttendanceInput) {
  const player = await prisma.matchPlayer.findUnique({
    where: { id: input.matchPlayerId },
    include: { match: true, matchSide: true }
  });
  if (!player || player.userId !== userId || player.match.status !== "SCHEDULED" || !player.matchSide.clubId) {
    throw new MatchDomainError("INVITE_NOT_FOUND", "The match invitation was not found.");
  }
  await prisma.matchPlayer.update({
    where: { id: player.id },
    data: { status: input.status, acceptedAt: input.status === "ACCEPTED" ? new Date() : null }
  });
  await createMatchNotifications({
    recipientIds: await getClubMatchManagerIds(player.matchSide.clubId),
    actorId: userId,
    matchId: player.matchId,
    type: "MATCH_ATTENDANCE_UPDATED"
  });
}

export async function submitClubMatchResult(userId: string, input: SubmitResultInput) {
  const match = await getClubMatch(input.matchId);
  assertMatchTransition(match.status, "RESULT_PENDING");
  if (Date.now() < (match.endTime ?? match.startTime).getTime()) {
    throw new MatchDomainError("MATCH_NOT_ENDED", "The result can only be submitted after the match ends.");
  }
  const submittingClubId = await getManagingParticipantClub(userId, match);
  const updated = await prisma.match.updateMany({
    where: { id: match.id, status: "SCHEDULED" },
    data: {
      status: "RESULT_PENDING",
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      resultNote: input.resultNote,
      resultSubmittedById: userId,
      resultSubmittedByClubId: submittingClubId,
      resultSubmittedAt: new Date(),
      alternativeHomeScore: null,
      alternativeAwayScore: null,
      disputeReason: null
    }
  });
  if (updated.count !== 1) throw new MatchDomainError("STALE_MATCH", "A result was already submitted.");

  const reviewingClubId = submittingClubId === match.homeClubId ? match.awayClubId! : match.homeClubId!;
  await createMatchNotifications({
    recipientIds: await getClubMatchManagerIds(reviewingClubId),
    actorId: userId,
    matchId: match.id,
    type: "MATCH_RESULT_SUBMITTED"
  });
}

export async function reviewClubMatchResult(userId: string, input: ReviewResultInput) {
  const match = await getClubMatch(input.matchId);
  if (match.status !== "RESULT_PENDING" || !match.resultSubmittedByClubId || match.homeScore === null || match.awayScore === null) {
    throw new MatchDomainError("RESULT_NOT_PENDING", "There is no result awaiting review.");
  }
  const reviewingClubId = match.resultSubmittedByClubId === match.homeClubId ? match.awayClubId! : match.homeClubId!;
  if (!(await canCreateClubMatches(userId, reviewingClubId))) {
    throw new MatchDomainError("FORBIDDEN", "Only the other club can review this result.");
  }
  if (match.resultSubmittedByClubId === reviewingClubId) {
    throw new MatchDomainError("SELF_CONFIRMATION", "A club cannot confirm its own result.");
  }

  if (input.response === "DISPUTE") {
    if (!submittedScoresDiffer(match.homeScore, match.awayScore, input.alternativeHomeScore!, input.alternativeAwayScore!)) {
      throw new MatchDomainError("SAME_SCORE", "Confirm the result when the submitted scores are the same.");
    }
    assertMatchTransition(match.status, "DISPUTED");
    const updated = await prisma.match.updateMany({
      where: { id: match.id, status: "RESULT_PENDING" },
      data: {
        status: "DISPUTED",
        resultConfirmedById: userId,
        resultReviewedByClubId: reviewingClubId,
        alternativeHomeScore: input.alternativeHomeScore,
        alternativeAwayScore: input.alternativeAwayScore,
        disputeReason: input.disputeReason
      }
    });
    if (updated.count !== 1) throw new MatchDomainError("STALE_MATCH", "The result was already reviewed.");
    await notifyBothClubManagers(match, userId, "MATCH_RESULT_DISPUTED");
    return "DISPUTED" as const;
  }

  assertMatchTransition(match.status, "COMPLETED");
  const completedAt = new Date();
  await prisma.$transaction(async (tx) => {
    const updated = await tx.match.updateMany({
      where: { id: match.id, status: "RESULT_PENDING", statsAppliedAt: null },
      data: {
        status: "COMPLETED",
        resultConfirmedById: userId,
        resultReviewedByClubId: reviewingClubId,
        resultConfirmedAt: completedAt,
        completedAt,
        statsAppliedAt: completedAt
      }
    });
    if (updated.count !== 1) throw new MatchDomainError("STALE_MATCH", "The result was already completed.");
    await applyClubStats(tx, match.homeClubId!, match.awayClubId!, match.homeScore!, match.awayScore!);
    const participants = await tx.matchPlayer.findMany({
      where: { matchId: match.id, userId: { not: null }, status: "ACCEPTED" },
      select: { userId: true }
    });
    for (const playerId of new Set(participants.flatMap((participant) => participant.userId ? [participant.userId] : []))) {
      await tx.playerStats.upsert({
        where: { userId: playerId },
        create: { userId: playerId, matchesPlayed: 1 },
        update: { matchesPlayed: { increment: 1 } }
      });
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  await notifyBothClubManagers(match, userId, "MATCH_COMPLETED");
  await createMatchNotifications({
    recipientIds: await getClubMatchManagerIds(match.resultSubmittedByClubId!),
    actorId: userId,
    matchId: match.id,
    type: "MATCH_RESULT_CONFIRMED"
  });
  return "COMPLETED" as const;
}

async function getClubMatch(matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.type !== "CLUB_VS_CLUB" || !match.homeClubId || !match.awayClubId) {
    throw new MatchDomainError("MATCH_NOT_FOUND", "The club match was not found.");
  }
  return match;
}

function getOpponentClubId(match: Awaited<ReturnType<typeof getClubMatch>>) {
  return match.creatorClubId === match.homeClubId ? match.awayClubId! : match.homeClubId!;
}

async function getManagingParticipantClub(userId: string, match: Awaited<ReturnType<typeof getClubMatch>>) {
  const [home, away] = await Promise.all([
    canCreateClubMatches(userId, match.homeClubId!),
    canCreateClubMatches(userId, match.awayClubId!)
  ]);
  if (home && away) throw new MatchDomainError("AMBIGUOUS_MANAGER", "A manager shared by both clubs cannot perform this action.");
  if (home) return match.homeClubId!;
  if (away) return match.awayClubId!;
  throw new MatchDomainError("FORBIDDEN", "Only a participating club manager can perform this action.");
}

async function assertStarterCapacity(matchId: string, format: Awaited<ReturnType<typeof getClubMatch>>["format"], sideId: string, role: "STARTER" | "SUBSTITUTE") {
  if (role !== "STARTER") return;
  const limit = getStarterLimit(format);
  if (!limit) throw new MatchDomainError("FORMAT_REQUIRED", "A club match must have a format.");
  const starters = await prisma.matchPlayer.count({
    where: { matchId, matchSideId: sideId, lineupRole: "STARTER", status: { not: "REMOVED" } }
  });
  if (starters >= limit) throw new MatchDomainError("STARTER_LIMIT", `The ${limit}-player starting lineup is full.`);
}

async function applyClubStats(
  tx: Prisma.TransactionClient,
  homeClubId: string,
  awayClubId: string,
  homeScore: number,
  awayScore: number
) {
  const outcome = getClubResult(homeScore, awayScore);
  const existing = await tx.clubStats.findMany({ where: { clubId: { in: [homeClubId, awayClubId] } } });
  const byClub = new Map(existing.map((stats) => [stats.clubId, stats]));
  await Promise.all([
    upsertClubStats(tx, homeClubId, homeScore, awayScore, outcome.home, byClub.get(homeClubId)?.recentForm),
    upsertClubStats(tx, awayClubId, awayScore, homeScore, outcome.away, byClub.get(awayClubId)?.recentForm)
  ]);
}

async function upsertClubStats(
  tx: Prisma.TransactionClient,
  clubId: string,
  goalsFor: number,
  goalsAgainst: number,
  result: "W" | "D" | "L",
  recentForm: unknown
) {
  const resultFields = result === "W" ? { wins: 1 } : result === "D" ? { draws: 1 } : { losses: 1 };
  await tx.clubStats.upsert({
    where: { clubId },
    create: {
      id: randomUUID(),
      clubId,
      matchesPlayed: 1,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      recentForm: [result],
      ...resultFields
    },
    update: {
      matchesPlayed: { increment: 1 },
      goalsFor: { increment: goalsFor },
      goalsAgainst: { increment: goalsAgainst },
      goalDifference: { increment: goalsFor - goalsAgainst },
      recentForm: appendRecentForm(recentForm, result),
      ...(result === "W" ? { wins: { increment: 1 } } : result === "D" ? { draws: { increment: 1 } } : { losses: { increment: 1 } })
    }
  });
}

async function notifyBothClubManagers(
  match: Awaited<ReturnType<typeof getClubMatch>>,
  actorId: string,
  type: "MATCH_RESULT_DISPUTED" | "MATCH_COMPLETED"
) {
  const recipients = [
    ...await getClubMatchManagerIds(match.homeClubId!),
    ...await getClubMatchManagerIds(match.awayClubId!)
  ];
  await createMatchNotifications({ recipientIds: recipients, actorId, matchId: match.id, type });
}
