import type { SceneBallState, ScenePlayerState, TacticSceneDto } from "@/types/tactic.types";

export function clampCoordinate(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function easeProgress(progress: number, easing: string) {
  const value = Math.min(1, Math.max(0, progress));
  if (easing === "EASE_IN") return value * value;
  if (easing === "EASE_OUT") return 1 - (1 - value) ** 2;
  if (easing === "EASE_IN_OUT") return value < 0.5 ? 2 * value * value : 1 - ((-2 * value + 2) ** 2) / 2;
  return value;
}

export function interpolate(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

export function getTacticDuration(scenes: Pick<TacticSceneDto, "durationMs">[]) {
  return scenes.reduce((sum, scene) => sum + scene.durationMs, 0);
}

export function getSceneAtTime(scenes: TacticSceneDto[], timeMs: number) {
  let offsetMs = 0;
  for (const scene of scenes) {
    const endMs = offsetMs + scene.durationMs;
    if (timeMs < endMs || scene === scenes.at(-1)) {
      return { scene, offsetMs, localTimeMs: Math.max(0, Math.min(scene.durationMs, timeMs - offsetMs)) };
    }
    offsetMs = endMs;
  }
  return null;
}

export function calculatePlayerState(scene: TacticSceneDto, localTimeMs: number): ScenePlayerState[] {
  const state = new Map(scene.startState.map((item) => [item.slotKey, { ...item }]));
  for (const action of scene.playerActions) {
    if (!state.has(action.slotKey) || localTimeMs < action.startTimeMs) continue;
    const progress = action.durationMs === 0
      ? 1
      : easeProgress((localTimeMs - action.startTimeMs) / action.durationMs, action.easing);
    state.set(action.slotKey, {
      slotKey: action.slotKey,
      x: clampCoordinate(interpolate(action.startX, action.endX, progress)),
      y: clampCoordinate(interpolate(action.startY, action.endY, progress))
    });
  }
  return [...state.values()];
}

export function calculateBallState(scene: TacticSceneDto, localTimeMs: number, players: ScenePlayerState[]): SceneBallState | null {
  if (!scene.ballStartState) return null;
  let state = { ...scene.ballStartState };
  for (const action of scene.ballActions) {
    if (localTimeMs < action.startTimeMs) continue;
    const progress = action.durationMs === 0
      ? 1
      : easeProgress((localTimeMs - action.startTimeMs) / action.durationMs, action.easing);
    state = {
      x: clampCoordinate(interpolate(action.startX, action.endX, progress)),
      y: clampCoordinate(interpolate(action.startY, action.endY, progress)),
      ownerSlotKey: progress >= 1 ? action.targetSlotKey ?? null : null,
      isFree: progress < 1 || !action.targetSlotKey
    };
  }
  if (!state.isFree && state.ownerSlotKey) {
    const owner = players.find((player) => player.slotKey === state.ownerSlotKey);
    if (owner) state = { ...state, x: owner.x, y: owner.y };
  }
  return state;
}

export function carrySceneState(previous: TacticSceneDto, next: TacticSceneDto): TacticSceneDto {
  return {
    ...next,
    startState: previous.endState.map((item) => ({ ...item })),
    ballStartState: previous.ballEndState ? { ...previous.ballEndState } : null
  };
}

export function synchronizeSceneContinuity(scenes: TacticSceneDto[]) {
  return scenes.map((scene, index) => index === 0 ? scene : carrySceneState(scenes[index - 1], scene));
}
