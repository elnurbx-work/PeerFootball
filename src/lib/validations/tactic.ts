import { z } from "zod";
import { FORMATION_PRESETS, formationMatchesPlayerCount, PLAYER_COUNTS } from "@/lib/tactics/formations";

const optionalText = (max: number) => z.preprocess(
  (value) => value === null ? undefined : value,
  z.string().trim().max(max).optional()
).transform((value) => value || undefined);
const coordinate = z.coerce.number().min(0).max(100);
const pointSchema = z.object({ x: coordinate, y: coordinate });
const footballPositionSchema = z.enum(["GK", "CB", "LB", "RB", "LWB", "RWB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "CF", "ST", "OTHER"]);

export const lineupSlotSchema = z.object({
  id: z.string().optional(),
  slotKey: z.string().trim().min(1).max(50),
  label: z.string().trim().min(1).max(50),
  position: footballPositionSchema.optional(),
  x: coordinate,
  y: coordinate,
  assignedClubMemberId: z.string().min(1).nullable().optional(),
  shirtNumber: z.coerce.number().int().min(1).max(99).nullable().optional(),
  isCaptain: z.boolean().default(false),
  isGoalkeeper: z.boolean().default(false),
  isSubstitute: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0)
});

const lineupPlanFieldsSchema = z.object({
  clubId: z.string().min(1),
  name: z.string().trim().min(2).max(100),
  description: optionalText(500),
  playerCount: z.coerce.number().int().refine((value) => PLAYER_COUNTS.includes(value), "validation.playerCount"),
  formationCode: z.string().trim().min(3).max(30),
  pitchType: z.enum(["FULL", "HALF", "SMALL"]).default("FULL")
});

export const createLineupPlanSchema = lineupPlanFieldsSchema.refine((value) => formationMatchesPlayerCount(value.formationCode, value.playerCount), {
  path: ["formationCode"],
  message: "validation.formationCount"
});

export const updateLineupPlanSchema = lineupPlanFieldsSchema.omit({ clubId: true }).extend({
  lineupPlanId: z.string().min(1),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional()
}).refine((value) => formationMatchesPlayerCount(value.formationCode, value.playerCount), {
  path: ["formationCode"],
  message: "validation.formationCount"
});

export const assignLineupSlotSchema = z.object({
  lineupPlanId: z.string().min(1),
  slot: lineupSlotSchema
});

export const batchUpdateLineupSlotsSchema = z.object({
  lineupPlanId: z.string().min(1),
  slots: z.array(lineupSlotSchema).min(1).max(30)
}).superRefine((value, context) => {
  const assigned = value.slots.flatMap((slot) => slot.assignedClubMemberId ? [slot.assignedClubMemberId] : []);
  if (new Set(assigned).size !== assigned.length) {
    context.addIssue({ code: "custom", path: ["slots"], message: "validation.duplicatePlayer" });
  }
  if (value.slots.filter((slot) => slot.isCaptain).length > 1) {
    context.addIssue({ code: "custom", path: ["slots"], message: "validation.singleCaptain" });
  }
});

export const tacticVisibilitySchema = z.enum(["PRIVATE", "COACHING_STAFF", "TEAM_MEMBERS", "PUBLIC"]);
export const tacticCategorySchema = z.enum(["ATTACK", "DEFENCE", "TRANSITION", "PRESSING", "BUILD_UP", "SET_PIECE", "TRAINING", "CUSTOM"]);
export const tacticEasingSchema = z.enum(["LINEAR", "EASE_IN", "EASE_OUT", "EASE_IN_OUT"]);
export const tacticActionTypeSchema = z.enum(["MOVE", "RUN", "SPRINT", "DRIBBLE", "PASS", "CROSS", "SHOT", "PRESS", "HOLD_POSITION", "CUSTOM"]);

export const scenePlayerStateSchema = z.object({
  slotKey: z.string().min(1).max(50),
  x: coordinate,
  y: coordinate
});

export const sceneBallStateSchema = pointSchema.extend({
  ownerSlotKey: z.string().min(1).max(50).nullable().default(null),
  isFree: z.boolean().default(true)
}).refine((value) => value.isFree || Boolean(value.ownerSlotKey), {
  message: "validation.ballOwner",
  path: ["ownerSlotKey"]
});

export const tacticPlayerActionSchema = z.object({
  id: z.string().optional(),
  slotKey: z.string().min(1).max(50),
  type: tacticActionTypeSchema,
  targetSlotKey: z.string().min(1).max(50).nullable().optional(),
  startX: coordinate,
  startY: coordinate,
  endX: coordinate,
  endY: coordinate,
  startTimeMs: z.coerce.number().int().min(0),
  durationMs: z.coerce.number().int().min(0),
  easing: tacticEasingSchema.default("LINEAR"),
  label: optionalText(100),
  note: optionalText(500)
}).refine((value) => value.type === "HOLD_POSITION" || value.startX !== value.endX || value.startY !== value.endY, {
  message: "validation.actionTarget",
  path: ["endX"]
});

export const tacticBallActionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["MOVE", "PASS", "CROSS", "DRIBBLE", "SHOT", "FREE"]),
  sourceSlotKey: z.string().min(1).max(50).nullable().optional(),
  targetSlotKey: z.string().min(1).max(50).nullable().optional(),
  startX: coordinate,
  startY: coordinate,
  endX: coordinate,
  endY: coordinate,
  startTimeMs: z.coerce.number().int().min(0),
  durationMs: z.coerce.number().int().min(0),
  easing: tacticEasingSchema.default("LINEAR")
}).refine((value) => value.type === "DRIBBLE" || !value.sourceSlotKey || !value.targetSlotKey || value.sourceSlotKey !== value.targetSlotKey, {
  message: "validation.actionTarget",
  path: ["targetSlotKey"]
});

export const tacticAnnotationSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["ARROW", "TEXT", "ZONE", "CIRCLE"]),
  x: coordinate,
  y: coordinate,
  width: z.coerce.number().min(0).max(100).nullable().optional(),
  height: z.coerce.number().min(0).max(100).nullable().optional(),
  rotation: z.coerce.number().min(-360).max(360).default(0),
  label: optionalText(120),
  description: optionalText(500),
  startTimeMs: z.coerce.number().int().min(0).default(0),
  durationMs: z.coerce.number().int().min(0).nullable().optional()
});

const tacticSceneFieldsSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(100),
  description: optionalText(500),
  sortOrder: z.coerce.number().int().min(0),
  durationMs: z.coerce.number().int().min(500).max(60000),
  startState: z.array(scenePlayerStateSchema).max(30),
  endState: z.array(scenePlayerStateSchema).max(30),
  ballStartState: sceneBallStateSchema.nullable().optional(),
  ballEndState: sceneBallStateSchema.nullable().optional(),
  playerActions: z.array(tacticPlayerActionSchema).max(200).default([]),
  ballActions: z.array(tacticBallActionSchema).max(100).default([]),
  annotations: z.array(tacticAnnotationSchema).max(100).default([])
});

export const tacticSceneSchema = tacticSceneFieldsSchema.superRefine((scene, context) => {
  for (const [index, action] of [...scene.playerActions, ...scene.ballActions].entries()) {
    if (action.startTimeMs + action.durationMs > scene.durationMs) {
      context.addIssue({ code: "custom", path: ["actions", index], message: "validation.actionOutsideScene" });
    }
  }
  const bySlot = new Map<string, Array<{ start: number; end: number }>>();
  scene.playerActions.forEach((action, index) => {
    if (["PASS", "CROSS", "CUSTOM"].includes(action.type)) return;
    const ranges = bySlot.get(action.slotKey) ?? [];
    const range = { start: action.startTimeMs, end: action.startTimeMs + action.durationMs };
    if (ranges.some((item) => range.start < item.end && item.start < range.end)) {
      context.addIssue({ code: "custom", path: ["playerActions", index], message: "validation.conflictingAction" });
    }
    ranges.push(range);
    bySlot.set(action.slotKey, ranges);
  });
  scene.ballActions.forEach((action, index, actions) => {
    const end = action.startTimeMs + action.durationMs;
    if (actions.slice(0, index).some((item) => action.startTimeMs < item.startTimeMs + item.durationMs && item.startTimeMs < end)) {
      context.addIssue({ code: "custom", path: ["ballActions", index], message: "validation.ballConflict" });
    }
  });
});

export const createTacticSchema = z.object({
  lineupPlanId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  description: optionalText(1000),
  category: tacticCategorySchema,
  visibility: tacticVisibilitySchema.default("COACHING_STAFF"),
  durationMs: z.coerce.number().int().min(2000).max(60000).default(10000)
});

export const updateTacticMetadataSchema = createTacticSchema.omit({ lineupPlanId: true }).partial().extend({
  tacticId: z.string().min(1)
});

export const saveTacticEditorStateSchema = z.object({
  tacticId: z.string().min(1),
  scenes: z.array(tacticSceneSchema).min(1).max(30)
}).superRefine((value, context) => {
  const total = value.scenes.reduce((sum, scene) => sum + scene.durationMs, 0);
  if (total < 2000 || total > 60000) {
    context.addIssue({ code: "custom", path: ["scenes"], message: "validation.tacticDuration" });
  }
  for (let index = 1; index < value.scenes.length; index += 1) {
    if (JSON.stringify(value.scenes[index].startState) !== JSON.stringify(value.scenes[index - 1].endState)) {
      context.addIssue({ code: "custom", path: ["scenes", index, "startState"], message: "validation.sceneContinuity" });
    }
  }
});

export const tacticIdSchema = z.object({ tacticId: z.string().min(1) });
export const lineupPlanIdSchema = z.object({ lineupPlanId: z.string().min(1) });
export const updateTacticVisibilitySchema = tacticIdSchema.extend({ visibility: tacticVisibilitySchema });
export const attachTacticToMatchSchema = tacticIdSchema.extend({ matchId: z.string().min(1) });
export const reorderTacticScenesSchema = tacticIdSchema.extend({ sceneIds: z.array(z.string().min(1)).min(1).max(30) });
export const createTacticSceneSchema = tacticIdSchema.extend({ scene: tacticSceneFieldsSchema.omit({ id: true }) });
export const updateTacticSceneSchema = z.object({ sceneId: z.string().min(1), scene: tacticSceneSchema });
export const createPlayerActionSchema = z.object({ sceneId: z.string().min(1), action: tacticPlayerActionSchema });
export const updatePlayerActionSchema = z.object({ actionId: z.string().min(1), action: tacticPlayerActionSchema });
export const createBallActionSchema = z.object({ sceneId: z.string().min(1), action: tacticBallActionSchema });
export const createAnnotationSchema = z.object({ sceneId: z.string().min(1), annotation: tacticAnnotationSchema });

export function getFormationOptions(playerCount: number) {
  return FORMATION_PRESETS[playerCount] ?? [];
}
