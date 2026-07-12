"use server";

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
  updateMatchVideoSchema
} from "@/lib/validations/match";
import { canCreateClubMatches, ensureClubActive } from "@/server/services/club-permissions.service";
import { deleteCloudinaryAsset } from "@/server/services/cloudinary.service";
import { normalizeMatchVideoUrl } from "@/lib/videos/video-url";
import type { ApiResponse } from "@/types/api.types";

export async function createMatchAction(): Promise<ApiResponse> {
  return { ok: false, message: "Matches must be created from an active club." };
}

export async function createInternalMatchAction(input: unknown): Promise<ApiResponse<{ matchId: string }>> {
  const user = await getCurrentUser();
  if (!user) return unauthenticated();
  const parsed = createInternalMatchSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid("Internal match details are invalid.", parsed.error.flatten().fieldErrors);
  const { clubId, teamAName, teamBName, initialStatus, ...data } = parsed.data;
  if (!(await canCreateClubMatches(user.id, clubId))) return forbidden("You cannot create matches for this club.");
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
  return { ok: true, message: "Internal match created.", data: { matchId: match.id } };
}

export async function updateInternalMatchSidesAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthenticated();
  const parsed = updateInternalMatchSidesSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid("Team names are invalid.", parsed.error.flatten().fieldErrors);
  const match = await getMatchForManagement(parsed.data.matchId);
  if (!match || match.type !== "INTERNAL") return notFound();
  if (!(await canCreateClubMatches(user.id, match.creatorClubId))) return forbidden();
  await ensureClubActive(match.creatorClubId);
  await prisma.$transaction([
    prisma.matchSide.update({ where: { matchId_side: { matchId: match.id, side: "TEAM_A" } }, data: { name: parsed.data.teamAName } }),
    prisma.matchSide.update({ where: { matchId_side: { matchId: match.id, side: "TEAM_B" } }, data: { name: parsed.data.teamBName } })
  ]);
  revalidateMatchSurfaces(match.id);
  return { ok: true, message: "Team names updated." };
}

export async function createClubVsClubMatchProposalAction(input: unknown): Promise<ApiResponse<{ matchId: string }>> {
  const user = await getCurrentUser();
  if (!user) return unauthenticated();
  const parsed = createClubVsClubMatchProposalSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid("Match proposal details are invalid.", parsed.error.flatten().fieldErrors);
  const { homeClubId, awayClubId, ...data } = parsed.data;
  if (!(await canCreateClubMatches(user.id, homeClubId))) return forbidden("You cannot create matches for this club.");
  await Promise.all([ensureClubActive(homeClubId), ensureClubActive(awayClubId)]);
  const clubs = await prisma.club.findMany({ where: { id: { in: [homeClubId, awayClubId] }, isActive: true }, select: { id: true, name: true } });
  if (clubs.length !== 2) return notFound("One of the clubs was not found.");
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
  return { ok: true, message: "Match proposal sent.", data: { matchId: match.id } };
}

export async function respondToClubVsClubMatchProposalAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthenticated();
  const parsed = respondToMatchProposalSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid("Proposal response is invalid.", parsed.error.flatten().fieldErrors);
  const match = await getMatchForManagement(parsed.data.matchId);
  if (!match || match.type !== "CLUB_VS_CLUB" || !match.awayClubId) return notFound();
  if (match.status !== "PENDING_OPPONENT_APPROVAL") return invalid("This proposal is no longer pending.");
  if (!(await canCreateClubMatches(user.id, match.awayClubId))) return forbidden("You cannot respond for the away club.");
  await ensureClubActive(match.awayClubId);
  await prisma.match.update({ where: { id: match.id }, data: { status: parsed.data.response === "ACCEPT" ? "SCHEDULED" : "CANCELLED" } });
  revalidateMatchSurfaces(match.id);
  return { ok: true, message: parsed.data.response === "ACCEPT" ? "Match proposal accepted." : "Match proposal rejected." };
}

export async function addMatchPlayerAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthenticated();
  const parsed = addMatchPlayerSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid("Player details are invalid.", parsed.error.flatten().fieldErrors);
  const match = await prisma.match.findUnique({
    where: { id: parsed.data.matchId },
    include: { sides: true }
  });
  if (!match || ["FINISHED", "CANCELLED"].includes(match.status)) return notFound("This match cannot be edited.");
  const side = match.sides.find((item) => item.id === parsed.data.matchSideId);
  if (!side) return notFound("Match side was not found.");
  const managingClubId = match.type === "INTERNAL" ? match.creatorClubId : side.clubId;
  if (!managingClubId || !(await canCreateClubMatches(user.id, managingClubId))) return forbidden();
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
    if (!guest) return invalid("Choose an active guest from this club.");
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
      return invalid("This registered player is already assigned to a match side.");
    }
    throw error;
  }
  revalidateMatchSurfaces(match.id);
  return { ok: true, message: status === "INVITED" ? "Player invited to the match." : "Player added to the side." };
}

export async function removeMatchPlayerAction(matchPlayerId: string): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthenticated();
  const player = await prisma.matchPlayer.findUnique({
    where: { id: matchPlayerId }, include: { match: true, matchSide: true }
  });
  if (!player) return notFound("Match player was not found.");
  const clubId = player.match.type === "INTERNAL" ? player.match.creatorClubId : player.matchSide.clubId;
  if (!clubId || !(await canCreateClubMatches(user.id, clubId))) return forbidden();
  await ensureClubActive(clubId);
  await prisma.matchPlayer.update({ where: { id: player.id }, data: { status: "REMOVED" } });
  revalidateMatchSurfaces(player.matchId);
  return { ok: true, message: "Player removed from the match." };
}

export async function acceptMatchInviteAction(matchPlayerId: string): Promise<ApiResponse> {
  return respondToPlayerInvite(matchPlayerId, "ACCEPTED");
}

export async function declineMatchInviteAction(matchPlayerId: string): Promise<ApiResponse> {
  return respondToPlayerInvite(matchPlayerId, "DECLINED");
}

export async function submitMatchResultAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthenticated();
  const parsed = submitMatchResultSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid("Match result is invalid.", parsed.error.flatten().fieldErrors);
  const match = await getMatchForManagement(parsed.data.matchId);
  if (!match || !["SCHEDULED", "LIVE"].includes(match.status)) return invalid("This match is not ready for a result.");
  const submittingClubId = match.type === "INTERNAL" ? match.creatorClubId : match.homeClubId;
  if (!submittingClubId || !(await canCreateClubMatches(user.id, submittingClubId))) return forbidden();
  await ensureClubActive(submittingClubId);
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
  return { ok: true, message: match.type === "INTERNAL" ? "Internal match finished." : "Result submitted for away club confirmation." };
}

export async function confirmMatchResultAction(matchId: string): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthenticated();
  const match = await getMatchForManagement(matchId);
  if (!match || match.type !== "CLUB_VS_CLUB" || !match.awayClubId || match.status !== "RESULT_PENDING_CONFIRMATION") return invalid("This result cannot be confirmed.");
  if (!(await canCreateClubMatches(user.id, match.awayClubId))) return forbidden();
  if (match.homeClubId && (await canCreateClubMatches(user.id, match.homeClubId))) return forbidden("A home club manager cannot confirm its own result.");
  await ensureClubActive(match.awayClubId);
  await prisma.match.update({ where: { id: match.id }, data: { status: "FINISHED", resultConfirmedById: user.id, resultConfirmedAt: new Date() } });
  revalidateMatchSurfaces(match.id);
  return { ok: true, message: "Match result confirmed." };
}

export async function disputeMatchResultAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthenticated();
  const parsed = disputeMatchResultSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid("Dispute reason is invalid.", parsed.error.flatten().fieldErrors);
  const match = await getMatchForManagement(parsed.data.matchId);
  if (!match || match.type !== "CLUB_VS_CLUB" || !match.awayClubId || match.status !== "RESULT_PENDING_CONFIRMATION") return invalid("This result cannot be disputed.");
  if (!(await canCreateClubMatches(user.id, match.awayClubId))) return forbidden();
  if (match.homeClubId && (await canCreateClubMatches(user.id, match.homeClubId))) return forbidden("A home club manager cannot review its own result.");
  await ensureClubActive(match.awayClubId);
  await prisma.match.update({ where: { id: match.id }, data: { status: "DISPUTED", disputeReason: parsed.data.disputeReason } });
  revalidateMatchSurfaces(match.id);
  return { ok: true, message: "Result disputed for future admin review." };
}

export async function addMatchVideoAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthenticated();
  const parsed = addMatchVideoSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors.url?.[0] ?? "Video details are invalid.", parsed.error.flatten().fieldErrors);
  const match = await getMatchForManagement(parsed.data.matchId);
  if (!match) return notFound();
  const homeClubId = match.type === "INTERNAL" ? match.creatorClubId : match.homeClubId;
  if (!homeClubId || !(await canCreateClubMatches(user.id, homeClubId))) return forbidden();
  await ensureClubActive(homeClubId);
  if (match.status === "FINISHED") return invalid("Videos cannot be added after the match is finished.");
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
  return { ok: true, message: "Match video added." };
}

export async function updateMatchVideoAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthenticated();
  const parsed = updateMatchVideoSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors.url?.[0] ?? "Video details are invalid.", parsed.error.flatten().fieldErrors);
  const video = await prisma.matchVideo.findUnique({ where: { id: parsed.data.matchVideoId }, include: { match: true } });
  if (!video) return notFound("Match video was not found.");
  const clubId = video.match.type === "INTERNAL" ? video.match.creatorClubId : video.match.homeClubId;
  if (!clubId || !(await canCreateClubMatches(user.id, clubId))) return forbidden();
  await ensureClubActive(clubId);
  if (video.match.status === "FINISHED") return invalid("Videos cannot be updated after the match is finished.");
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
  return { ok: true, message: "Match video updated." };
}

export async function deleteMatchVideoAction(matchVideoId: string): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthenticated();
  const video = await prisma.matchVideo.findUnique({ where: { id: matchVideoId }, include: { match: true } });
  if (!video) return notFound("Match video was not found.");
  const clubId = video.match.type === "INTERNAL" ? video.match.creatorClubId : video.match.homeClubId;
  if (!clubId || !(await canCreateClubMatches(user.id, clubId))) return forbidden();
  await ensureClubActive(clubId);
  if (video.match.status === "FINISHED") return invalid("Videos cannot be deleted after the match is finished.");
  await prisma.matchVideo.delete({ where: { id: video.id } });
  if (video.publicId) await deleteCloudinaryAsset(video.publicId, "video");
  revalidateMatchSurfaces(video.matchId);
  return { ok: true, message: "Match video deleted." };
}

export async function addMatchGoalAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthenticated();
  const parsed = addMatchGoalSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid("Goal details are invalid.", parsed.error.flatten().fieldErrors);
  const side = await prisma.matchSide.findUnique({ where: { id: parsed.data.matchSideId }, include: { match: true } });
  if (!side || side.matchId !== parsed.data.matchId) return notFound("Match side was not found.");
  const clubId = side.match.type === "INTERNAL" ? side.match.creatorClubId : side.clubId;
  if (!clubId || !(await canCreateClubMatches(user.id, clubId))) return forbidden();
  await ensureClubActive(clubId);
  if (parsed.data.matchPlayerId) {
    const player = await prisma.matchPlayer.findFirst({
      where: { id: parsed.data.matchPlayerId, matchId: side.matchId, matchSideId: side.id, status: { not: "REMOVED" } },
      select: { id: true }
    });
    if (!player) return invalid("Selected scorer is not on this match side.");
  }
  await prisma.matchGoal.create({ data: parsed.data });
  revalidateMatchSurfaces(side.matchId);
  return { ok: true, message: "Goal scorer added." };
}

export async function deleteMatchGoalAction(matchGoalId: string): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthenticated();
  const goal = await prisma.matchGoal.findUnique({ where: { id: matchGoalId }, include: { match: true, matchSide: true } });
  if (!goal) return notFound("Goal was not found.");
  const clubId = goal.match.type === "INTERNAL" ? goal.match.creatorClubId : goal.matchSide.clubId;
  if (!clubId || !(await canCreateClubMatches(user.id, clubId))) return forbidden();
  await prisma.matchGoal.delete({ where: { id: goal.id } });
  revalidateMatchSurfaces(goal.matchId);
  return { ok: true, message: "Goal scorer removed." };
}

export async function createMatchCommentAction(input: unknown): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthenticated();
  const parsed = createMatchCommentSchema.safeParse(toObject(input));
  if (!parsed.success) return invalid("Comment is invalid.", parsed.error.flatten().fieldErrors);
  const match = await prisma.match.findUnique({ where: { id: parsed.data.matchId }, select: { id: true } });
  if (!match) return notFound();
  if (parsed.data.parentId) {
    const parent = await prisma.matchComment.findFirst({ where: { id: parsed.data.parentId, matchId: match.id }, select: { id: true } });
    if (!parent) return notFound("Parent comment was not found.");
  }
  await prisma.matchComment.create({ data: { ...parsed.data, authorId: user.id } });
  revalidateMatchSurfaces(match.id);
  return { ok: true, message: "Comment added." };
}

async function respondToPlayerInvite(matchPlayerId: string, status: "ACCEPTED" | "DECLINED"): Promise<ApiResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthenticated();
  const player = await prisma.matchPlayer.findUnique({
    where: { id: matchPlayerId },
    include: { match: { select: { creatorClubId: true } }, matchSide: { select: { clubId: true } } }
  });
  if (!player || player.userId !== user.id || player.status !== "INVITED") return notFound("Active match invite was not found.");
  await ensureClubActive(player.matchSide.clubId ?? player.match.creatorClubId);
  await prisma.matchPlayer.update({ where: { id: player.id }, data: { status, acceptedAt: status === "ACCEPTED" ? new Date() : null } });
  revalidateMatchSurfaces(player.matchId);
  return { ok: true, message: status === "ACCEPTED" ? "Match invite accepted." : "Match invite declined." };
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
function unauthenticated(): ApiResponse<never> { return { ok: false, message: "You need to sign in first." }; }
function forbidden(message = "You do not have permission to manage this match."): ApiResponse<never> { return { ok: false, message }; }
function notFound(message = "Match was not found."): ApiResponse<never> { return { ok: false, message }; }
function invalid(message: string, issues?: Record<string, string[] | undefined>): ApiResponse<never> { return { ok: false, message, issues }; }
