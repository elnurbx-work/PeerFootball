import assert from "node:assert/strict";
import { canViewTacticVisibility } from "@/lib/tactics/access";
import { carrySceneState, clampCoordinate, easeProgress, getSceneAtTime, synchronizeSceneContinuity } from "@/lib/tactics/engine";
import { FORMATION_PRESETS, createFormationSlots, formationMatchesPlayerCount } from "@/lib/tactics/formations";
import { saveTacticEditorStateSchema, tacticSceneSchema } from "@/lib/validations/tactic";
import type { TacticSceneDto } from "@/types/tactic.types";

for (const [countText, formations] of Object.entries(FORMATION_PRESETS)) {
  const count = Number(countText);
  for (const formation of formations) {
    assert.equal(formationMatchesPlayerCount(formation, count), true);
    const slots = createFormationSlots(formation, count);
    assert.equal(slots.length, count);
    assert.equal(new Set(slots.map((slot) => slot.slotKey)).size, count);
    assert.ok(slots.every((slot) => slot.x >= 0 && slot.x <= 100 && slot.y >= 0 && slot.y <= 100));
  }
}
assert.equal(formationMatchesPlayerCount("4-3-3", 7), false);
assert.equal(clampCoordinate(-1), 0);
assert.equal(clampCoordinate(101), 100);
assert.equal(easeProgress(0.5, "LINEAR"), 0.5);

const state = [{ slotKey: "GK", x: 8, y: 50 }, { slotKey: "ST", x: 80, y: 50 }];
const baseScene: TacticSceneDto = {
  id: "scene-1",
  name: "Başlanğıc",
  description: null,
  sortOrder: 0,
  durationMs: 2000,
  startState: structuredClone(state),
  endState: [{ slotKey: "GK", x: 10, y: 50 }, { slotKey: "ST", x: 90, y: 50 }],
  ballStartState: { x: 8, y: 50, ownerSlotKey: "GK", isFree: false },
  ballEndState: { x: 90, y: 50, ownerSlotKey: "ST", isFree: false },
  playerActions: [],
  ballActions: [],
  annotations: []
};
const nextScene: TacticSceneDto = {
  ...structuredClone(baseScene),
  id: "scene-2",
  name: "Davam",
  sortOrder: 1,
  startState: structuredClone(state)
};
const carried = carrySceneState(baseScene, nextScene);
assert.deepEqual(carried.startState, baseScene.endState);
assert.notEqual(carried.startState, baseScene.endState);
assert.deepEqual(synchronizeSceneContinuity([baseScene, nextScene])[1].startState, baseScene.endState);
assert.equal(getSceneAtTime([baseScene, nextScene], 2500)?.scene.id, "scene-2");

const outsideAction = tacticSceneSchema.safeParse({
  ...baseScene,
  playerActions: [{
    slotKey: "ST", type: "RUN", startX: 80, startY: 50, endX: 90, endY: 50,
    startTimeMs: 1500, durationMs: 1000, easing: "LINEAR"
  }]
});
assert.equal(outsideAction.success, false);

const conflictingBall = tacticSceneSchema.safeParse({
  ...baseScene,
  ballActions: [
    { type: "PASS", sourceSlotKey: "GK", targetSlotKey: "ST", startX: 8, startY: 50, endX: 80, endY: 50, startTimeMs: 0, durationMs: 1000, easing: "LINEAR" },
    { type: "PASS", sourceSlotKey: "ST", targetSlotKey: "GK", startX: 80, startY: 50, endX: 8, endY: 50, startTimeMs: 500, durationMs: 1000, easing: "LINEAR" }
  ]
});
assert.equal(conflictingBall.success, false);

assert.equal(saveTacticEditorStateSchema.safeParse({ tacticId: "t1", scenes: [baseScene, carried] }).success, true);
assert.equal(saveTacticEditorStateSchema.safeParse({ tacticId: "t1", scenes: [baseScene, nextScene] }).success, false);

assert.equal(canViewTacticVisibility({ visibility: "PUBLIC", createdById: "a" }), true);
assert.equal(canViewTacticVisibility({ visibility: "PRIVATE", createdById: "a", userId: "b", clubRole: "OWNER" }), false);
assert.equal(canViewTacticVisibility({ visibility: "PRIVATE", createdById: "a", userId: "a" }), true);
assert.equal(canViewTacticVisibility({ visibility: "COACHING_STAFF", createdById: "a", userId: "b", clubRole: "PLAYER" }), false);
assert.equal(canViewTacticVisibility({ visibility: "COACHING_STAFF", createdById: "a", userId: "b", clubRole: "TD" }), true);
assert.equal(canViewTacticVisibility({ visibility: "TEAM_MEMBERS", createdById: "a", userId: "b", clubRole: "PLAYER" }), true);

const snapshot = structuredClone(state);
const tacticState = structuredClone(snapshot);
snapshot[0].x = 99;
assert.notEqual(tacticState[0].x, snapshot[0].x);

console.log("Lineup, tactic visibility, timeline, scene continuity, coordinate and action tests passed.");
