import "server-only";

import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createFormationSlots } from "@/lib/tactics/formations";
import {
  attachTacticToMatchSchema,
  batchUpdateLineupSlotsSchema,
  createLineupPlanSchema,
  createTacticSchema,
  saveTacticEditorStateSchema,
  updateLineupPlanSchema,
  updateTacticMetadataSchema,
  updateTacticVisibilitySchema
} from "@/lib/validations/tactic";
import { canManageClubTactics, ensureClubActive } from "@/server/services/club-permissions.service";
import type { TacticSnapshot } from "@/types/tactic.types";

type CreateLineupInput = z.infer<typeof createLineupPlanSchema>;
type UpdateLineupInput = z.infer<typeof updateLineupPlanSchema>;
type BatchSlotsInput = z.infer<typeof batchUpdateLineupSlotsSchema>;
type CreateTacticInput = z.infer<typeof createTacticSchema>;
type UpdateTacticInput = z.infer<typeof updateTacticMetadataSchema>;
type SaveEditorInput = z.infer<typeof saveTacticEditorStateSchema>;

export class TacticDomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "TacticDomainError";
  }
}

export async function createLineupPlan(userId: string, input: CreateLineupInput) {
  await assertCanManageClub(userId, input.clubId);
  const slots = createFormationSlots(input.formationCode, input.playerCount);
  try {
    return await prisma.lineupPlan.create({
      data: {
        clubId: input.clubId,
        name: input.name,
        description: input.description,
        playerCount: input.playerCount,
        formationCode: input.formationCode,
        pitchType: input.pitchType,
        createdById: userId,
        slots: { create: slots }
      },
      select: { id: true }
    });
  } catch (error) {
    throwUnique(error, "Bu adda heyət planı artıq mövcuddur.");
  }
}

export async function updateLineupPlan(userId: string, input: UpdateLineupInput) {
  const plan = await getLineupForMutation(input.lineupPlanId, userId);
  const formationChanged = plan.formationCode !== input.formationCode || plan.playerCount !== input.playerCount;
  const presets = formationChanged ? createFormationSlots(input.formationCode, input.playerCount) : [];

  try {
    await prisma.$transaction(async (tx) => {
      await tx.lineupPlan.update({
        where: { id: plan.id },
        data: {
          name: input.name,
          description: input.description,
          playerCount: input.playerCount,
          formationCode: input.formationCode,
          pitchType: input.pitchType,
          status: input.status
        }
      });
      if (!formationChanged) return;
      const presetKeys = presets.map((slot) => slot.slotKey);
      await tx.lineupSlot.deleteMany({ where: { lineupPlanId: plan.id, slotKey: { notIn: presetKeys } } });
      for (const slot of presets) {
        await tx.lineupSlot.upsert({
          where: { lineupPlanId_slotKey: { lineupPlanId: plan.id, slotKey: slot.slotKey } },
          create: { lineupPlanId: plan.id, ...slot },
          update: {
            label: slot.label,
            position: slot.position,
            x: slot.x,
            y: slot.y,
            sortOrder: slot.sortOrder,
            isGoalkeeper: slot.isGoalkeeper
          }
        });
      }
    });
  } catch (error) {
    throwUnique(error, "Bu adda heyət planı artıq mövcuddur.");
  }
}

export async function saveLineupSlots(userId: string, input: BatchSlotsInput) {
  const plan = await getLineupForMutation(input.lineupPlanId, userId);
  const slotIds = input.slots.flatMap((slot) => slot.id ? [slot.id] : []);
  const existingCount = await prisma.lineupSlot.count({ where: { id: { in: slotIds }, lineupPlanId: plan.id } });
  if (existingCount !== slotIds.length) throw new TacticDomainError("SLOT_NOT_FOUND", "Heyət slotu tapılmadı.");

  const memberIds = input.slots.flatMap((slot) => slot.assignedClubMemberId ? [slot.assignedClubMemberId] : []);
  const memberCount = await prisma.clubMember.count({
    where: { id: { in: memberIds }, clubId: plan.clubId, status: "ACTIVE" }
  });
  if (memberCount !== new Set(memberIds).size) {
    throw new TacticDomainError("FOREIGN_MEMBER", "Başqa klubun oyunçusu bu heyətə əlavə edilə bilməz.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.lineupSlot.updateMany({
      where: { lineupPlanId: plan.id },
      data: { assignedClubMemberId: null }
    });
    await tx.lineupSlot.deleteMany({
      where: {
        lineupPlanId: plan.id,
        isSubstitute: true,
        id: { notIn: slotIds }
      }
    });
    for (const slot of input.slots) {
      const data = {
        label: slot.label,
        position: slot.position,
        x: slot.x,
        y: slot.y,
        assignedClubMemberId: slot.assignedClubMemberId,
        shirtNumber: slot.shirtNumber,
        isCaptain: slot.isCaptain,
        isGoalkeeper: slot.isGoalkeeper,
        isSubstitute: slot.isSubstitute,
        sortOrder: slot.sortOrder
      };
      if (slot.id) {
        await tx.lineupSlot.update({ where: { id: slot.id }, data });
      } else {
        await tx.lineupSlot.create({
          data: {
            lineupPlanId: plan.id,
            slotKey: slot.slotKey,
            ...data
          }
        });
      }
    }
  });
}

export async function archiveLineupPlan(userId: string, lineupPlanId: string) {
  const plan = await getLineupForMutation(lineupPlanId, userId);
  await prisma.lineupPlan.update({ where: { id: plan.id }, data: { status: "ARCHIVED" } });
}

export async function deleteLineupPlan(userId: string, lineupPlanId: string) {
  const plan = await getLineupForMutation(lineupPlanId, userId);
  const tacticCount = await prisma.tactic.count({ where: { lineupPlanId: plan.id } });
  if (tacticCount) throw new TacticDomainError("LINEUP_HAS_TACTICS", "Bağlı taktikalar var. Heyət planını arxivləşdirin.");
  await prisma.lineupPlan.delete({ where: { id: plan.id } });
}

export async function createTactic(userId: string, input: CreateTacticInput) {
  const plan = await prisma.lineupPlan.findUnique({
    where: { id: input.lineupPlanId },
    include: {
      slots: {
        include: { assignedClubMember: { include: { user: { select: { id: true, name: true, username: true, image: true } } } } },
        orderBy: { sortOrder: "asc" }
      }
    }
  });
  if (!plan || plan.status === "ARCHIVED") throw new TacticDomainError("LINEUP_NOT_FOUND", "Aktiv heyət planı tapılmadı.");
  await assertCanManageClub(userId, plan.clubId);

  const snapshot = buildSnapshot(plan);
  const startState = snapshot.slots.map((slot) => ({ slotKey: slot.slotKey, x: slot.x, y: slot.y }));
  const ballOwner = snapshot.slots.find((slot) => slot.isGoalkeeper) ?? snapshot.slots[0];
  const ballState = ballOwner
    ? { x: ballOwner.x, y: ballOwner.y, ownerSlotKey: ballOwner.slotKey, isFree: false }
    : { x: 50, y: 50, ownerSlotKey: null, isFree: true };

  return prisma.tactic.create({
    data: {
      clubId: plan.clubId,
      lineupPlanId: plan.id,
      name: input.name,
      description: input.description,
      category: input.category,
      visibility: input.visibility,
      durationMs: input.durationMs,
      status: "DRAFT",
      snapshotData: toJson(snapshot),
      previewData: toJson({ players: startState, ball: ballState }),
      createdById: userId,
      scenes: {
        create: {
          name: "Başlanğıc",
          sortOrder: 0,
          durationMs: input.durationMs,
          startState: toJson(startState),
          endState: toJson(startState),
          ballStartState: toJson(ballState),
          ballEndState: toJson(ballState)
        }
      }
    },
    select: { id: true }
  });
}

export async function updateTacticMetadata(userId: string, input: UpdateTacticInput) {
  const tactic = await getTacticForMutation(input.tacticId, userId);
  await prisma.tactic.update({
    where: { id: tactic.id },
    data: {
      name: input.name,
      description: input.description,
      category: input.category,
      visibility: input.visibility,
      durationMs: input.durationMs
    }
  });
}

export async function saveTacticEditorState(userId: string, input: SaveEditorInput) {
  const tactic = await getTacticForMutation(input.tacticId, userId);
  const durationMs = input.scenes.reduce((sum, scene) => sum + scene.durationMs, 0);
  const snapshot = parseSnapshot(tactic.snapshotData);
  const slotKeys = new Set(snapshot.slots.map((slot) => slot.slotKey));
  for (const scene of input.scenes) {
    const referenced = [
      ...scene.startState.map((item) => item.slotKey),
      ...scene.endState.map((item) => item.slotKey),
      ...scene.playerActions.map((item) => item.slotKey)
    ];
    if (referenced.some((slotKey) => !slotKeys.has(slotKey))) {
      throw new TacticDomainError("UNKNOWN_SLOT", "Səhnədə heyət snapshot-una aid olmayan slot var.");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.tacticScene.deleteMany({ where: { tacticId: tactic.id } });
    for (const [index, scene] of input.scenes.entries()) {
      await tx.tacticScene.create({
        data: {
          tacticId: tactic.id,
          name: scene.name,
          description: scene.description,
          sortOrder: index,
          durationMs: scene.durationMs,
          startState: toJson(scene.startState),
          endState: toJson(scene.endState),
          ballStartState: scene.ballStartState ? toJson(scene.ballStartState) : Prisma.JsonNull,
          ballEndState: scene.ballEndState ? toJson(scene.ballEndState) : Prisma.JsonNull,
          playerActions: {
            create: scene.playerActions.map((action) => ({
              slotKey: action.slotKey,
              type: action.type,
              targetSlotKey: action.targetSlotKey,
              startX: action.startX,
              startY: action.startY,
              endX: action.endX,
              endY: action.endY,
              startTimeMs: action.startTimeMs,
              durationMs: action.durationMs,
              easing: action.easing,
              label: action.label,
              note: action.note
            }))
          },
          ballActions: {
            create: scene.ballActions.map((action) => ({
              type: action.type,
              sourceSlotKey: action.sourceSlotKey,
              targetSlotKey: action.targetSlotKey,
              startX: action.startX,
              startY: action.startY,
              endX: action.endX,
              endY: action.endY,
              startTimeMs: action.startTimeMs,
              durationMs: action.durationMs,
              easing: action.easing
            }))
          },
          annotations: {
            create: scene.annotations.map((annotation) => ({
              type: annotation.type,
              x: annotation.x,
              y: annotation.y,
              width: annotation.width,
              height: annotation.height,
              rotation: annotation.rotation,
              label: annotation.label,
              description: annotation.description,
              startTimeMs: annotation.startTimeMs,
              durationMs: annotation.durationMs
            }))
          }
        }
      });
    }
    await tx.tactic.update({
      where: { id: tactic.id },
      data: {
        durationMs,
        status: tactic.status === "DRAFT" ? "ACTIVE" : tactic.status,
        previewData: toJson({
          players: input.scenes[0].startState,
          ball: input.scenes[0].ballStartState
        })
      }
    });
  });
}

export async function duplicateTactic(userId: string, tacticId: string) {
  const tactic = await prisma.tactic.findUnique({
    where: { id: tacticId },
    include: {
      scenes: {
        include: { playerActions: true, ballActions: true, annotations: true },
        orderBy: { sortOrder: "asc" }
      }
    }
  });
  if (!tactic) throw new TacticDomainError("TACTIC_NOT_FOUND", "Taktika tapılmadı.");
  await assertCanManageClub(userId, tactic.clubId);
  if (tactic.visibility === "PRIVATE" && tactic.createdById !== userId) {
    throw new TacticDomainError("PRIVATE_TACTIC", "Şəxsi taktikanı yalnız müəllifi idarə edə bilər.");
  }

  return prisma.$transaction((tx) => tx.tactic.create({
    data: {
      clubId: tactic.clubId,
      lineupPlanId: tactic.lineupPlanId,
      name: `${tactic.name} — Kopiya`,
      description: tactic.description,
      category: tactic.category,
      visibility: tactic.visibility,
      durationMs: tactic.durationMs,
      status: "DRAFT",
      snapshotData: toJson(tactic.snapshotData),
      previewData: tactic.previewData === null ? Prisma.JsonNull : toJson(tactic.previewData),
      createdById: userId,
      scenes: {
        create: tactic.scenes.map((scene) => ({
          name: scene.name,
          description: scene.description,
          sortOrder: scene.sortOrder,
          durationMs: scene.durationMs,
          startState: toJson(scene.startState),
          endState: toJson(scene.endState),
          ballStartState: scene.ballStartState === null ? Prisma.JsonNull : toJson(scene.ballStartState),
          ballEndState: scene.ballEndState === null ? Prisma.JsonNull : toJson(scene.ballEndState),
          playerActions: {
            create: scene.playerActions.map(({ id: _id, sceneId: _sceneId, createdAt: _createdAt, updatedAt: _updatedAt, metadata, ...action }) => ({
              ...action,
              metadata: metadata === null ? Prisma.JsonNull : toJson(metadata)
            }))
          },
          ballActions: {
            create: scene.ballActions.map(({ id: _id, sceneId: _sceneId, createdAt: _createdAt, updatedAt: _updatedAt, metadata, ...action }) => ({
              ...action,
              metadata: metadata === null ? Prisma.JsonNull : toJson(metadata)
            }))
          },
          annotations: {
            create: scene.annotations.map(({ id: _id, sceneId: _sceneId, createdAt: _createdAt, updatedAt: _updatedAt, metadata, ...annotation }) => ({
              ...annotation,
              metadata: metadata === null ? Prisma.JsonNull : toJson(metadata)
            }))
          }
        }))
      }
    },
    select: { id: true }
  }));
}

export async function archiveTactic(userId: string, tacticId: string) {
  const tactic = await getTacticForMutation(tacticId, userId, true);
  await prisma.tactic.update({ where: { id: tactic.id }, data: { status: tactic.status === "ARCHIVED" ? "DRAFT" : "ARCHIVED" } });
}

export async function deleteTactic(userId: string, tacticId: string) {
  const tactic = await getTacticForMutation(tacticId, userId, true);
  if (tactic.status !== "ARCHIVED") throw new TacticDomainError("ARCHIVE_REQUIRED", "Silməzdən əvvəl taktikanı arxivləşdirin.");
  await prisma.tactic.delete({ where: { id: tactic.id } });
}

export async function updateTacticVisibility(userId: string, input: z.infer<typeof updateTacticVisibilitySchema>) {
  const tactic = await getTacticForMutation(input.tacticId, userId);
  await prisma.tactic.update({ where: { id: tactic.id }, data: { visibility: input.visibility } });
}

export async function attachTacticToMatch(userId: string, input: z.infer<typeof attachTacticToMatchSchema>) {
  const tactic = await getTacticForMutation(input.tacticId, userId);
  const match = await prisma.match.findUnique({
    where: { id: input.matchId },
    select: { id: true, homeClubId: true, awayClubId: true, creatorClubId: true }
  });
  if (!match || ![match.homeClubId, match.awayClubId, match.creatorClubId].includes(tactic.clubId)) {
    throw new TacticDomainError("MATCH_CLUB_MISMATCH", "Taktika yalnız öz klubunun matçına bağlana bilər.");
  }
  return prisma.matchTactic.upsert({
    where: { matchId_tacticId: { matchId: match.id, tacticId: tactic.id } },
    create: { matchId: match.id, tacticId: tactic.id, clubId: tactic.clubId, attachedById: userId },
    update: {},
    select: { id: true }
  });
}

export async function detachTacticFromMatch(userId: string, matchId: string, tacticId: string) {
  const tactic = await getTacticForMutation(tacticId, userId);
  await prisma.matchTactic.deleteMany({ where: { matchId, tacticId: tactic.id, clubId: tactic.clubId } });
}

async function assertCanManageClub(userId: string, clubId: string) {
  await ensureClubActive(clubId);
  if (!(await canManageClubTactics(userId, clubId))) {
    throw new TacticDomainError("FORBIDDEN", "Heyət və taktikanı yalnız klub rəhbərliyi idarə edə bilər.");
  }
}

async function getLineupForMutation(lineupPlanId: string, userId: string) {
  const plan = await prisma.lineupPlan.findUnique({ where: { id: lineupPlanId } });
  if (!plan) throw new TacticDomainError("LINEUP_NOT_FOUND", "Heyət planı tapılmadı.");
  await assertCanManageClub(userId, plan.clubId);
  return plan;
}

async function getTacticForMutation(tacticId: string, userId: string, allowArchived = false) {
  const tactic = await prisma.tactic.findUnique({ where: { id: tacticId } });
  if (!tactic) throw new TacticDomainError("TACTIC_NOT_FOUND", "Taktika tapılmadı.");
  await assertCanManageClub(userId, tactic.clubId);
  if (tactic.visibility === "PRIVATE" && tactic.createdById !== userId) {
    throw new TacticDomainError("PRIVATE_TACTIC", "Şəxsi taktikanı yalnız müəllifi idarə edə bilər.");
  }
  if (!allowArchived && tactic.status === "ARCHIVED") {
    throw new TacticDomainError("TACTIC_ARCHIVED", "Arxiv taktikasını dəyişmək üçün əvvəlcə bərpa edin.");
  }
  return tactic;
}

function buildSnapshot(plan: {
  id: string;
  formationCode: string;
  playerCount: number;
  pitchType: TacticSnapshot["pitchType"];
  slots: Array<{
    slotKey: string; label: string; position: TacticSnapshot["slots"][number]["position"]; x: number; y: number;
    shirtNumber: number | null; isCaptain: boolean; isGoalkeeper: boolean; isSubstitute: boolean;
    assignedClubMember: { user: TacticSnapshot["slots"][number]["assignedUser"] } | null;
  }>;
}): TacticSnapshot {
  return {
    version: 1,
    lineupPlanId: plan.id,
    formationCode: plan.formationCode,
    playerCount: plan.playerCount,
    pitchType: plan.pitchType,
    slots: plan.slots.map((slot) => ({
      slotKey: slot.slotKey,
      label: slot.label,
      position: slot.position,
      x: slot.x,
      y: slot.y,
      shirtNumber: slot.shirtNumber,
      isCaptain: slot.isCaptain,
      isGoalkeeper: slot.isGoalkeeper,
      isSubstitute: slot.isSubstitute,
      assignedUser: slot.assignedClubMember?.user ?? null
    }))
  };
}

export function parseSnapshot(value: Prisma.JsonValue): TacticSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TacticDomainError("MALFORMED_TACTIC", "Taktika snapshot-u zədələnib.");
  }
  return value as unknown as TacticSnapshot;
}

function toJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function throwUnique(error: unknown, message: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new TacticDomainError("DUPLICATE", message);
  }
  throw error;
}
