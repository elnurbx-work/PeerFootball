import "server-only";

import { prisma } from "@/lib/prisma";
import { canViewTacticVisibility } from "@/lib/tactics/access";
import { sceneBallStateSchema, scenePlayerStateSchema } from "@/lib/validations/tactic";
import { canManageClubTactics, canRoleManageTactics, getActiveClubMembership } from "@/server/services/club-permissions.service";
import { parseSnapshot, TacticDomainError } from "@/server/services/tactic.service";
import type {
  LineupPlanDetailDto,
  LineupPlanListItemDto,
  LineupSlotDto,
  TacticDetailDto,
  TacticListItemDto,
  TacticSceneDto
} from "@/types/tactic.types";

const userSelect = { id: true, name: true, username: true, image: true } as const;
const tacticListSelect = {
  id: true,
  clubId: true,
  lineupPlanId: true,
  createdById: true,
  name: true,
  description: true,
  category: true,
  visibility: true,
  durationMs: true,
  status: true,
  previewData: true,
  updatedAt: true,
  lineupPlan: { select: { id: true, name: true, formationCode: true } },
  createdBy: { select: { id: true, name: true, username: true } },
  _count: { select: { scenes: true } }
} as const;

export async function getClubLineupPlans(clubId: string, userId: string, archived = false): Promise<LineupPlanListItemDto[]> {
  const membership = await getActiveClubMembership(userId, clubId);
  if (!membership) return [];
  const plans = await prisma.lineupPlan.findMany({
    where: { clubId, status: archived ? "ARCHIVED" : "ACTIVE" },
    select: {
      id: true,
      clubId: true,
      name: true,
      description: true,
      playerCount: true,
      formationCode: true,
      pitchType: true,
      status: true,
      updatedAt: true,
      _count: { select: { slots: true, tactics: true } }
    },
    orderBy: { updatedAt: "desc" }
  });
  return plans.map((plan) => ({
    ...plan,
    updatedAt: plan.updatedAt.toISOString(),
    slotCount: plan._count.slots,
    tacticCount: plan._count.tactics
  }));
}

export async function getLineupPlanDetail(lineupPlanId: string, userId: string): Promise<LineupPlanDetailDto | null> {
  const plan = await prisma.lineupPlan.findUnique({
    where: { id: lineupPlanId },
    include: {
      club: { select: { id: true, name: true, slug: true, logoUrl: true } },
      createdBy: { select: { id: true, name: true, username: true } },
      slots: {
        include: {
          assignedClubMember: {
            select: { id: true, userId: true, user: { select: userSelect } }
          }
        },
        orderBy: { sortOrder: "asc" }
      },
      tactics: {
        where: { status: { not: "ARCHIVED" } },
        select: tacticListSelect,
        orderBy: { updatedAt: "desc" }
      }
    }
  });
  if (!plan) return null;
  const membership = await getActiveClubMembership(userId, plan.clubId);
  if (!membership) return null;
  const canEdit = canRoleManageTactics(membership.role);
  const visibleTactics = plan.tactics
    .filter((tactic) => canViewWithRole(tactic, userId, membership.role))
    .map(toTacticListItem);
  return {
    id: plan.id,
    clubId: plan.clubId,
    name: plan.name,
    description: plan.description,
    playerCount: plan.playerCount,
    formationCode: plan.formationCode,
    pitchType: plan.pitchType,
    status: plan.status,
    club: plan.club,
    createdBy: plan.createdBy,
    slots: plan.slots.map(toLineupSlot),
    tactics: visibleTactics,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    canEdit
  };
}

export async function getClubTactics(clubId: string, userId?: string, archived = false): Promise<TacticListItemDto[]> {
  const [tactics, membership] = await Promise.all([
    prisma.tactic.findMany({
      where: { clubId, status: archived ? "ARCHIVED" : { not: "ARCHIVED" } },
      select: tacticListSelect,
      orderBy: { updatedAt: "desc" }
    }),
    userId ? getActiveClubMembership(userId, clubId) : null
  ]);
  return tactics
    .filter((tactic) => canViewWithRole(tactic, userId, membership?.role))
    .map(toTacticListItem);
}

export async function getTacticDetail(tacticId: string, userId?: string): Promise<TacticDetailDto | null> {
  const tactic = await prisma.tactic.findUnique({
    where: { id: tacticId },
    include: {
      club: { select: { id: true, name: true, slug: true, logoUrl: true } },
      lineupPlan: { select: { id: true, name: true, formationCode: true } },
      createdBy: { select: { id: true, name: true, username: true } },
      scenes: {
        include: {
          playerActions: { orderBy: { startTimeMs: "asc" } },
          ballActions: { orderBy: { startTimeMs: "asc" } },
          annotations: { orderBy: { startTimeMs: "asc" } }
        },
        orderBy: { sortOrder: "asc" }
      },
      matches: {
        select: {
          id: true,
          matchId: true,
          match: { select: { id: true, title: true, startTime: true } }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });
  if (!tactic || !(await canViewTacticRecord(tactic, userId))) return null;
  const canEdit = Boolean(userId && await canManageClubTactics(userId, tactic.clubId));
  try {
    return {
      id: tactic.id,
      clubId: tactic.clubId,
      lineupPlanId: tactic.lineupPlanId,
      name: tactic.name,
      description: tactic.description,
      category: tactic.category,
      visibility: tactic.visibility,
      durationMs: tactic.durationMs,
      status: tactic.status,
      previewData: tactic.previewData,
      lineupPlan: tactic.lineupPlan,
      createdBy: tactic.createdBy,
      club: tactic.club,
      snapshotData: parseSnapshot(tactic.snapshotData),
      scenes: tactic.scenes.map(toTacticScene),
      matches: tactic.matches.map((item) => ({
        ...item,
        match: { ...item.match, startTime: item.match.startTime.toISOString() }
      })),
      createdAt: tactic.createdAt.toISOString(),
      updatedAt: tactic.updatedAt.toISOString(),
      canEdit
    };
  } catch (error) {
    if (error instanceof TacticDomainError) return null;
    throw error;
  }
}

export async function getMatchTactics(matchId: string, userId: string) {
  const links = await prisma.matchTactic.findMany({
    where: { matchId },
    select: { tactic: { select: tacticListSelect } },
    orderBy: { createdAt: "desc" }
  });
  const clubIds = [...new Set(links.map((link) => link.tactic.clubId))];
  const memberships = await prisma.clubMember.findMany({
    where: { userId, clubId: { in: clubIds }, status: "ACTIVE" },
    select: { clubId: true, role: true }
  });
  const roleByClub = new Map(memberships.map((membership) => [membership.clubId, membership.role]));
  return links
    .filter((link) => canViewWithRole(link.tactic, userId, roleByClub.get(link.tactic.clubId)))
    .map((link) => toTacticListItem(link.tactic));
}

async function canViewTacticRecord(
  tactic: { clubId: string; createdById?: string; visibility: string },
  userId?: string
) {
  if (tactic.visibility === "PUBLIC") return true;
  if (!userId) return false;
  if (tactic.visibility === "PRIVATE") return tactic.createdById === userId;
  const membership = await getActiveClubMembership(userId, tactic.clubId);
  if (!membership) return false;
  if (tactic.visibility === "TEAM_MEMBERS") return true;
  return canRoleManageTactics(membership.role);
}

function canViewWithRole(
  tactic: { createdById?: string; visibility: string },
  userId?: string,
  role?: Parameters<typeof canRoleManageTactics>[0]
) {
  return canViewTacticVisibility({
    visibility: tactic.visibility as Parameters<typeof canViewTacticVisibility>[0]["visibility"],
    createdById: tactic.createdById ?? "",
    userId,
    clubRole: role
  });
}

function toLineupSlot(slot: {
  id: string; slotKey: string; label: string; position: LineupSlotDto["position"]; x: number; y: number;
  assignedClubMemberId: string | null; shirtNumber: number | null; isCaptain: boolean; isGoalkeeper: boolean;
  isSubstitute: boolean; sortOrder: number; assignedClubMember: LineupSlotDto["assignedClubMember"];
}): LineupSlotDto {
  return { ...slot };
}

function toTacticListItem(tactic: {
  id: string; clubId: string; lineupPlanId: string; name: string; description: string | null;
  createdById: string;
  category: TacticListItemDto["category"]; visibility: TacticListItemDto["visibility"]; durationMs: number;
  status: TacticListItemDto["status"]; previewData: unknown; updatedAt: Date;
  lineupPlan: TacticListItemDto["lineupPlan"]; createdBy: TacticListItemDto["createdBy"]; _count: { scenes: number };
}): TacticListItemDto {
  return {
    id: tactic.id,
    clubId: tactic.clubId,
    lineupPlanId: tactic.lineupPlanId,
    name: tactic.name,
    description: tactic.description,
    category: tactic.category,
    visibility: tactic.visibility,
    durationMs: tactic.durationMs,
    status: tactic.status,
    previewData: tactic.previewData,
    lineupPlan: tactic.lineupPlan,
    createdBy: tactic.createdBy,
    sceneCount: tactic._count.scenes,
    updatedAt: tactic.updatedAt.toISOString()
  };
}

function toTacticScene(scene: {
  id: string; name: string; description: string | null; sortOrder: number; durationMs: number;
  startState: unknown; endState: unknown; ballStartState: unknown; ballEndState: unknown;
  playerActions: TacticSceneDto["playerActions"]; ballActions: TacticSceneDto["ballActions"];
  annotations: TacticSceneDto["annotations"];
}): TacticSceneDto {
  return {
    id: scene.id,
    name: scene.name,
    description: scene.description,
    sortOrder: scene.sortOrder,
    durationMs: scene.durationMs,
    startState: scenePlayerStateSchema.array().parse(scene.startState),
    endState: scenePlayerStateSchema.array().parse(scene.endState),
    ballStartState: scene.ballStartState ? sceneBallStateSchema.parse(scene.ballStartState) : null,
    ballEndState: scene.ballEndState ? sceneBallStateSchema.parse(scene.ballEndState) : null,
    playerActions: scene.playerActions,
    ballActions: scene.ballActions,
    annotations: scene.annotations
  };
}
