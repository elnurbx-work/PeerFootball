"use server";

import { localizedFieldErrors } from "@/i18n/zod";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addMatchPlayerSchema,
  addMatchGoalSchema,
  addMatchVideoSchema,
  createClubVsClubMatchProposalSchema,
  createInternalMatchSchema,
  createMatchCommentSchema,
  disputeMatchResultSchema,
  respondToMatchProposalSchema,
  submitMatchResultSchema,
  updateInternalMatchSidesSchema,
  updateMatchPlayerPositionSchema,
  updateMatchVideoSchema
} from "@/lib/validations/match";
import { canCreateClubMatches, ensureClubActive } from "@/server/services/club-permissions.service";
import { deleteCloudinaryAsset } from "@/server/services/cloudinary.service";
import { normalizeMatchVideoUrl } from "@/lib/videos/video-url";
import type { ApiResponse } from "@/types/api.types";
import { createTranslator } from "@/i18n/dictionary";
import { getServerTranslator } from "@/i18n/server";

export async function createMatchAction(): Promise<ApiResponse> {
  return { ok: false, message: (await getServerTranslator())("responses.match.activeClubRequired") };
}

export async function createInternalMatchAction(input: unknown): Promise<ApiResponse<{ matchId: string }>> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const parsed = createInternalMatchSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid(t("responses.match.internalInvalid"), localizedFieldErrors(parsed.error, t));
  const { clubId, teamAName, teamBName, initialStatus, ...data } = parsed.data;
  if (!(await canCreateClubMatches(user.id, clubId))) return forbidden(t("responses.match.cannotCreate"));
  await ensureClubActive(clubId);

  const match = await prisma.match.create({
    data: {
      ...data,
      type: "INTERNAL",
      status: initialStatus,
      creatorClubId: clubId,
      createdById: user.id,
      sides: { create: [{ side: "TEAM_A", name: teamAName, clubId }, { side: "TEAM_B", name: teamBName, clubId }] }
    },
    select: { id: true }
  });
  // Future balanced split can use position, GK count, performance and club metrics.
  revalidateMatchSurfaces(match.id);
  return { ok: true, message: t("responses.match.internalCreated"), data: { matchId: match.id } };
}

export async function updateInternalMatchSidesAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const parsed = updateInternalMatchSidesSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid(t("responses.match.teamNamesInvalid"), localizedFieldErrors(parsed.error, t));
  const match = await getMatchForManagement(parsed.data.matchId);
  if (!match || match.type !== "INTERNAL") return notFound(t("responses.match.notFound"));
  if (!(await canCreateClubMatches(user.id, match.creatorClubId))) return forbidden(t("responses.match.forbidden"));
  await ensureClubActive(match.creatorClubId);
  await prisma.$transaction([
    prisma.matchSide.update({ where: { matchId_side: { matchId: match.id, side: "TEAM_A" } }, data: { name: parsed.data.teamAName } }),
    prisma.matchSide.update({ where: { matchId_side: { matchId: match.id, side: "TEAM_B" } }, data: { name: parsed.data.teamBName } })
  ]);
  revalidateMatchSurfaces(match.id);
  return { ok: true, message: t("responses.match.teamNamesUpdated") };
}

export async function createClubVsClubMatchProposalAction(input: unknown): Promise<ApiResponse<{ matchId: string }>> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const parsed = createClubVsClubMatchProposalSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid(t("responses.match.proposalInvalid"), localizedFieldErrors(parsed.error, t));
  const { homeClubId, awayClubId, ...data } = parsed.data;
  if (!(await canCreateClubMatches(user.id, homeClubId))) return forbidden(t("responses.match.cannotCreate"));
  await Promise.all([ensureClubActive(homeClubId), ensureClubActive(awayClubId)]);
  const clubs = await prisma.club.findMany({ where: { id: { in: [homeClubId, awayClubId] }, isActive: true }, select: { id: true, name: true } });
  if (clubs.length !== 2) return notFound(t("responses.match.clubNotFound"));
  const home = clubs.find((club) => club.id === homeClubId)!;
  const away = clubs.find((club) => club.id === awayClubId)!;
  const match = await prisma.match.create({
    data: {
      ...data, type: "CLUB_VS_CLUB", status: "PENDING_OPPONENT_APPROVAL", creatorClubId: homeClubId,
      homeClubId, awayClubId, createdById: user.id,
      sides: { create: [{ side: "HOME", name: home.name, clubId: home.id }, { side: "AWAY", name: away.name, clubId: away.id }] }
    }, select: { id: true }
  });
  revalidateMatchSurfaces(match.id);
  return { ok: true, message: t("responses.match.proposalSent"), data: { matchId: match.id } };
}

export async function respondToClubVsClubMatchProposalAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const parsed = respondToMatchProposalSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid(t("responses.match.proposalResponseInvalid"), localizedFieldErrors(parsed.error, t));
  const match = await getMatchForManagement(parsed.data.matchId);
  if (!match || match.type !== "CLUB_VS_CLUB" || !match.awayClubId) return notFound(t("responses.match.notFound"));
  if (match.status !== "PENDING_OPPONENT_APPROVAL") return invalid(t("responses.match.proposalNotPending"));
  if (!(await canCreateClubMatches(user.id, match.awayClubId))) return forbidden(t("responses.match.awayResponseForbidden"));
  await ensureClubActive(match.awayClubId);
  await prisma.match.update({ where: { id: match.id }, data: { status: parsed.data.response === "ACCEPT" ? "SCHEDULED" : "CANCELLED" } });
  revalidateMatchSurfaces(match.id);
  return { ok: true, message: parsed.data.response === "ACCEPT" ? t("responses.match.proposalAccepted") : t("responses.match.proposalRejected") };
}

export async function addMatchPlayerAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const parsed = addMatchPlayerSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid(t("responses.match.playerInvalid"), localizedFieldErrors(parsed.error, t));
  const match = await prisma.match.findUnique({
    where: { id: parsed.data.matchId },
    include: { sides: true }
  });
  if (!match || ["FINISHED", "CANCELLED"].includes(match.status)) return notFound(t("responses.match.cannotEdit"));
  const side = match.sides.find((item) => item.id === parsed.data.matchSideId);
  if (!side) return notFound(t("responses.match.sideNotFound"));
  const managingClubId = match.type === "INTERNAL" ? match.creatorClubId : side.clubId;
  if (!managingClubId || !(await canCreateClubMatches(user.id, managingClubId))) return forbidden(t("responses.match.forbidden"));
  await ensureClubActive(managingClubId);

  let status: "SELECTED" | "INVITED" = "SELECTED";
  if (parsed.data.userId) {
    const membership = await prisma.clubMember.findFirst({
      where: { clubId: managingClubId, userId: parsed.data.userId, status: "ACTIVE" }, select: { id: true }
    });
    status = membership ? "SELECTED" : "INVITED";
  }
  if (parsed.data.clubGuestId) {
    const guest = await prisma.clubGuest.findFirst({ where: { id: parsed.data.clubGuestId, clubId: managingClubId, isActive: true }, select: { id: true } });
    if (!guest) return invalid(t("responses.match.activeGuestRequired"));
  }

  try {
    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, matchSideId: side.id, userId: parsed.data.userId,
        clubGuestId: parsed.data.clubGuestId, guestName: parsed.data.guestName,
        position: parsed.data.position, shirtNumber: parsed.data.shirtNumber,
        status, invitedById: user.id
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return invalid(t("responses.match.playerAlreadyAssigned"));
    }
    throw error;
  }
  revalidateMatchSurfaces(match.id);
  return { ok: true, message: status === "INVITED" ? t("responses.match.playerInvited") : t("responses.match.playerAdded") };
}

export async function removeMatchPlayerAction(matchPlayerId: string): Promise<ApiResponse> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const player = await prisma.matchPlayer.findUnique({
    where: { id: matchPlayerId }, include: { match: true, matchSide: true }
  });
  if (!player) return notFound(t("responses.match.playerNotFound"));
  const clubId = player.match.type === "INTERNAL" ? player.match.creatorClubId : player.matchSide.clubId;
  if (!clubId || !(await canCreateClubMatches(user.id, clubId))) return forbidden(t("responses.match.forbidden"));
  await ensureClubActive(clubId);
  await prisma.matchPlayer.update({ where: { id: player.id }, data: { status: "REMOVED" } });
  revalidateMatchSurfaces(player.matchId);
  return { ok: true, message: t("responses.match.playerRemoved") };
}

export async function updateMatchPlayerPositionAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const parsed = updateMatchPlayerPositionSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid(t("responses.positionInvalid"), localizedFieldErrors(parsed.error, t));

  const player = await prisma.matchPlayer.findUnique({
    where: { id: parsed.data.matchPlayerId },
    include: { match: true, matchSide: true }
  });
  if (!player || player.status === "REMOVED") return notFound(t("responses.playerNotFound"));
  if (!["DRAFT", "SCHEDULED", "LIVE"].includes(player.match.status)) {
    return invalid(t("responses.lineupLocked"));
  }

  const clubId = player.match.type === "INTERNAL" ? player.match.creatorClubId : player.matchSide.clubId;
  if (!clubId || !(await canCreateClubMatches(user.id, clubId))) return forbidden(t("responses.match.forbidden"));
  await ensureClubActive(clubId);
  await prisma.matchPlayer.update({
    where: { id: player.id },
    data: { position: parsed.data.position }
  });
  revalidateMatchSurfaces(player.matchId);
  return { ok: true, message: t("responses.positionUpdated", { position: parsed.data.position }) };
}

export async function acceptMatchInviteAction(matchPlayerId: string): Promise<ApiResponse> {
  return respondToPlayerInvite(matchPlayerId, "ACCEPTED");
}

export async function declineMatchInviteAction(matchPlayerId: string): Promise<ApiResponse> {
  return respondToPlayerInvite(matchPlayerId, "DECLINED");
}

export async function submitMatchResultAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const parsed = submitMatchResultSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid(t("responses.match.resultInvalid"), localizedFieldErrors(parsed.error, t));
  const match = await getMatchForManagement(parsed.data.matchId);
  if (!match || !["SCHEDULED", "LIVE"].includes(match.status)) return invalid(t("responses.match.resultNotReady"));
  const submittingClubId = match.type === "INTERNAL" ? match.creatorClubId : match.homeClubId;
  if (!submittingClubId || !(await canCreateClubMatches(user.id, submittingClubId))) return forbidden(t("responses.match.forbidden"));
  await ensureClubActive(submittingClubId);
  const sides = await prisma.matchSide.findMany({
    where: { matchId: match.id },
    select: { id: true, _count: { select: { goals: true } } },
    orderBy: { createdAt: "asc" },
    take: 2
  });
  const recordedHomeScore = sides[0]?._count.goals ?? 0;
  const recordedAwayScore = sides[1]?._count.goals ?? 0;
  if (parsed.data.homeScore !== recordedHomeScore || parsed.data.awayScore !== recordedAwayScore) {
    return invalid(t("responses.resultMismatch", { score: `${recordedHomeScore}:${recordedAwayScore}` }));
  }
  const nextStatus = match.type === "INTERNAL" ? "FINISHED" : "RESULT_PENDING_CONFIRMATION";
  await prisma.match.update({
    where: { id: match.id },
    data: {
      homeScore: parsed.data.homeScore,
      awayScore: parsed.data.awayScore,
      resultNote: parsed.data.resultNote,
      resultSubmittedById: user.id,
      resultSubmittedAt: new Date(),
      status: nextStatus
    }
  });
  revalidateMatchSurfaces(match.id);
  return { ok: true, message: match.type === "INTERNAL" ? t("responses.match.internalFinished") : t("responses.match.resultSubmitted") };
}

export async function confirmMatchResultAction(matchId: string): Promise<ApiResponse> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const match = await getMatchForManagement(matchId);
  if (!match || match.type !== "CLUB_VS_CLUB" || !match.awayClubId || match.status !== "RESULT_PENDING_CONFIRMATION") return invalid(t("responses.match.resultCannotConfirm"));
  if (!(await canCreateClubMatches(user.id, match.awayClubId))) return forbidden(t("responses.match.forbidden"));
  if (match.homeClubId && (await canCreateClubMatches(user.id, match.homeClubId))) return forbidden(t("responses.match.homeCannotConfirm"));
  await ensureClubActive(match.awayClubId);
  await prisma.match.update({ where: { id: match.id }, data: { status: "FINISHED", resultConfirmedById: user.id, resultConfirmedAt: new Date() } });
  revalidateMatchSurfaces(match.id);
  return { ok: true, message: t("responses.match.resultConfirmed") };
}

export async function disputeMatchResultAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const parsed = disputeMatchResultSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid(t("responses.match.disputeInvalid"), localizedFieldErrors(parsed.error, t));
  const match = await getMatchForManagement(parsed.data.matchId);
  if (!match || match.type !== "CLUB_VS_CLUB" || !match.awayClubId || match.status !== "RESULT_PENDING_CONFIRMATION") return invalid(t("responses.match.resultCannotDispute"));
  if (!(await canCreateClubMatches(user.id, match.awayClubId))) return forbidden(t("responses.match.forbidden"));
  if (match.homeClubId && (await canCreateClubMatches(user.id, match.homeClubId))) return forbidden(t("responses.match.homeCannotReview"));
  await ensureClubActive(match.awayClubId);
  await prisma.match.update({ where: { id: match.id }, data: { status: "DISPUTED", disputeReason: parsed.data.disputeReason } });
  revalidateMatchSurfaces(match.id);
  return { ok: true, message: t("responses.match.resultDisputed") };
}

export async function addMatchVideoAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const parsed = addMatchVideoSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid(t("responses.match.videoInvalid"), localizedFieldErrors(parsed.error, t));
  const match = await getMatchForManagement(parsed.data.matchId);
  if (!match) return notFound(t("responses.match.notFound"));
  const homeClubId = match.type === "INTERNAL" ? match.creatorClubId : match.homeClubId;
  if (!homeClubId || !(await canCreateClubMatches(user.id, homeClubId))) return forbidden(t("responses.match.forbidden"));
  await ensureClubActive(homeClubId);
  if (match.status === "FINISHED") return invalid(t("responses.match.videoAddLocked"));
  const normalized = normalizeMatchVideoUrl(parsed.data.url);
  await prisma.matchVideo.create({
    data: {
      matchId: parsed.data.matchId,
      title: parsed.data.title,
      description: parsed.data.description,
      videoType: parsed.data.videoType,
      matchStartSecond: parsed.data.matchStartSecond,
      originalUrl: normalized.originalUrl,
      embedUrl: normalized.embedUrl,
      provider: normalized.provider,
      uploadedById: user.id
    }
  });
  revalidateMatchSurfaces(match.id);
  return { ok: true, message: t("responses.match.videoAdded") };
}

export async function updateMatchVideoAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const parsed = updateMatchVideoSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid(t("responses.match.videoInvalid"), localizedFieldErrors(parsed.error, t));
  const video = await prisma.matchVideo.findUnique({ where: { id: parsed.data.matchVideoId }, include: { match: true } });
  if (!video) return notFound(t("responses.match.videoNotFound"));
  const clubId = video.match.type === "INTERNAL" ? video.match.creatorClubId : video.match.homeClubId;
  if (!clubId || !(await canCreateClubMatches(user.id, clubId))) return forbidden(t("responses.match.forbidden"));
  await ensureClubActive(clubId);
  if (video.match.status === "FINISHED") return invalid(t("responses.match.videoUpdateLocked"));
  const normalized = normalizeMatchVideoUrl(parsed.data.url);
  await prisma.matchVideo.update({
    where: { id: video.id },
    data: {
      originalUrl: normalized.originalUrl,
      embedUrl: normalized.embedUrl,
      provider: normalized.provider,
      videoType: parsed.data.videoType,
      matchStartSecond: parsed.data.matchStartSecond,
      title: parsed.data.title,
      description: parsed.data.description
    }
  });
  revalidateMatchSurfaces(video.matchId);
  return { ok: true, message: t("responses.match.videoUpdated") };
}

export async function deleteMatchVideoAction(matchVideoId: string): Promise<ApiResponse> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const video = await prisma.matchVideo.findUnique({ where: { id: matchVideoId }, include: { match: true } });
  if (!video) return notFound(t("responses.match.videoNotFound"));
  const clubId = video.match.type === "INTERNAL" ? video.match.creatorClubId : video.match.homeClubId;
  if (!clubId || !(await canCreateClubMatches(user.id, clubId))) return forbidden(t("responses.match.forbidden"));
  await ensureClubActive(clubId);
  if (video.match.status === "FINISHED") return invalid(t("responses.match.videoDeleteLocked"));
  await prisma.matchVideo.delete({ where: { id: video.id } });
  if (video.publicId) await deleteCloudinaryAsset(video.publicId, "video");
  revalidateMatchSurfaces(video.matchId);
  return { ok: true, message: t("responses.match.videoDeleted") };
}

export async function addMatchGoalAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const parsed = addMatchGoalSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid(t("responses.match.goalInvalid"), localizedFieldErrors(parsed.error, t));
  const side = await prisma.matchSide.findUnique({ where: { id: parsed.data.matchSideId }, include: { match: true } });
  if (!side || side.matchId !== parsed.data.matchId) return notFound(t("responses.match.sideNotFound"));
  if (!["DRAFT", "SCHEDULED", "LIVE"].includes(side.match.status)) {
    return invalid(t("responses.goalLocked"));
  }
  const clubId = side.match.type === "INTERNAL" ? side.match.creatorClubId : side.clubId;
  if (!clubId || !(await canCreateClubMatches(user.id, clubId))) return forbidden(t("responses.match.forbidden"));
  await ensureClubActive(clubId);
  const player = await prisma.matchPlayer.findFirst({
    where: {
      id: parsed.data.matchPlayerId,
      matchId: side.matchId,
      matchSideId: side.id,
      status: { in: ["SELECTED", "ACCEPTED"] }
    },
    include: {
      user: { select: { name: true, username: true } },
      clubGuest: { select: { fullName: true } }
    }
  });
  if (!player) return invalid(t("responses.scorerInvalid"));
  const playerName = player.user?.name ?? player.user?.username ?? player.clubGuest?.fullName ?? player.guestName;
  if (!playerName) return invalid(t("responses.scorerNameMissing"));
  await prisma.matchGoal.create({
    data: {
      matchId: side.matchId,
      matchSideId: side.id,
      matchPlayerId: player.id,
      playerName,
      minute: parsed.data.minute,
      extraMinute: parsed.data.extraMinute
    }
  });
  revalidateMatchSurfaces(side.matchId);
  return { ok: true, message: t("responses.goalAdded") };
}

export async function deleteMatchGoalAction(matchGoalId: string): Promise<ApiResponse> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const goal = await prisma.matchGoal.findUnique({ where: { id: matchGoalId }, include: { match: true, matchSide: true } });
  if (!goal) return notFound(t("responses.match.goalNotFound"));
  if (!["DRAFT", "SCHEDULED", "LIVE"].includes(goal.match.status)) {
    return invalid(t("responses.goalLocked"));
  }
  const clubId = goal.match.type === "INTERNAL" ? goal.match.creatorClubId : goal.matchSide.clubId;
  if (!clubId || !(await canCreateClubMatches(user.id, clubId))) return forbidden(t("responses.match.forbidden"));
  await prisma.matchGoal.delete({ where: { id: goal.id } });
  revalidateMatchSurfaces(goal.matchId);
  return { ok: true, message: t("responses.match.goalRemoved") };
}

export async function createMatchCommentAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const parsed = createMatchCommentSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid(t("responses.match.commentInvalid"), localizedFieldErrors(parsed.error, t));
  const match = await prisma.match.findUnique({ where: { id: parsed.data.matchId }, select: { id: true } });
  if (!match) return notFound(t("responses.match.notFound"));
  if (parsed.data.parentId) {
    const parent = await prisma.matchComment.findFirst({ where: { id: parsed.data.parentId, matchId: match.id }, select: { id: true } });
    if (!parent) return notFound(t("responses.match.parentCommentNotFound"));
  }
  await prisma.matchComment.create({ data: { ...parsed.data, authorId: user.id } });
  revalidateMatchSurfaces(match.id);
  return { ok: true, message: t("responses.match.commentAdded") };
}

async function respondToPlayerInvite(matchPlayerId: string, status: "ACCEPTED" | "DECLINED"): Promise<ApiResponse> {
  const user = await getCurrentUser();
  const t = await actionTranslator(user);
  if (!user) return invalid(t("responses.signInRequired"));
  const player = await prisma.matchPlayer.findUnique({
    where: { id: matchPlayerId },
    include: { match: { select: { creatorClubId: true } }, matchSide: { select: { clubId: true } } }
  });
  if (!player || player.userId !== user.id || player.status !== "INVITED") return notFound(t("responses.match.inviteNotFound"));
  await ensureClubActive(player.matchSide.clubId ?? player.match.creatorClubId);
  await prisma.matchPlayer.update({ where: { id: player.id }, data: { status, acceptedAt: status === "ACCEPTED" ? new Date() : null } });
  revalidateMatchSurfaces(player.matchId);
  return { ok: true, message: status === "ACCEPTED" ? t("responses.match.inviteAccepted") : t("responses.match.inviteDeclined") };
}

function getMatchForManagement(matchId: string) {
  return prisma.match.findUnique({ where: { id: matchId } });
}

function revalidateMatchSurfaces(matchId: string) {
  revalidatePath("/matches");
  revalidatePath("/clubs", "layout");
  revalidatePath(`/matches/${matchId}`);
}

function toObject(input: unknown) { return input instanceof FormData ? Object.fromEntries(input) : input; }
function forbidden(message: string): ApiResponse<never> { return { ok: false, message }; }
function notFound(message: string): ApiResponse<never> { return { ok: false, message }; }
function invalid(message: string, issues?: Record<string, string[] | undefined>): ApiResponse<never> { return { ok: false, message, issues }; }

async function actionTranslator(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  return user ? createTranslator(user.locale) : getServerTranslator();
}
