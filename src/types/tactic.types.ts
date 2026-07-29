import type {
  FootballPosition,
  LineupPitchType,
  LineupPlanStatus,
  TacticActionType,
  TacticAnnotationType,
  TacticBallActionType,
  TacticCategory,
  TacticEasing,
  TacticStatus,
  TacticVisibility
} from "@prisma/client";

export type NormalizedPoint = { x: number; y: number };
export type ScenePlayerState = NormalizedPoint & { slotKey: string };
export type SceneBallState = NormalizedPoint & { ownerSlotKey: string | null; isFree: boolean };

export type LineupSlotDto = {
  id: string;
  slotKey: string;
  label: string;
  position: FootballPosition | null;
  x: number;
  y: number;
  assignedClubMemberId: string | null;
  shirtNumber: number | null;
  isCaptain: boolean;
  isGoalkeeper: boolean;
  isSubstitute: boolean;
  sortOrder: number;
  assignedClubMember: {
    id: string;
    userId: string;
    user: { id: string; name: string | null; username: string | null; image: string | null };
  } | null;
};

export type LineupPlanListItemDto = {
  id: string;
  clubId: string;
  name: string;
  description: string | null;
  playerCount: number;
  formationCode: string;
  pitchType: LineupPitchType;
  status: LineupPlanStatus;
  updatedAt: string;
  slotCount: number;
  tacticCount: number;
};

export type LineupPlanDetailDto = Omit<LineupPlanListItemDto, "slotCount" | "tacticCount"> & {
  club: { id: string; name: string; slug: string; logoUrl: string | null };
  createdBy: { id: string; name: string | null; username: string | null };
  slots: LineupSlotDto[];
  tactics: TacticListItemDto[];
  createdAt: string;
  canEdit: boolean;
};

export type TacticSnapshot = {
  version: 1;
  lineupPlanId: string;
  formationCode: string;
  playerCount: number;
  pitchType: LineupPitchType;
  slots: Array<{
    slotKey: string;
    label: string;
    position: FootballPosition | null;
    x: number;
    y: number;
    shirtNumber: number | null;
    isCaptain: boolean;
    isGoalkeeper: boolean;
    isSubstitute: boolean;
    assignedUser: { id: string; name: string | null; username: string | null; image: string | null } | null;
  }>;
};

export type TacticPlayerActionDto = {
  id: string;
  slotKey: string;
  type: TacticActionType;
  targetSlotKey: string | null;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startTimeMs: number;
  durationMs: number;
  easing: TacticEasing;
  label: string | null;
  note: string | null;
};

export type TacticBallActionDto = {
  id: string;
  type: TacticBallActionType;
  sourceSlotKey: string | null;
  targetSlotKey: string | null;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startTimeMs: number;
  durationMs: number;
  easing: TacticEasing;
};

export type TacticAnnotationDto = {
  id: string;
  type: TacticAnnotationType;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  rotation: number;
  label: string | null;
  description: string | null;
  startTimeMs: number;
  durationMs: number | null;
};

export type TacticSceneDto = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  durationMs: number;
  startState: ScenePlayerState[];
  endState: ScenePlayerState[];
  ballStartState: SceneBallState | null;
  ballEndState: SceneBallState | null;
  playerActions: TacticPlayerActionDto[];
  ballActions: TacticBallActionDto[];
  annotations: TacticAnnotationDto[];
};

export type TacticListItemDto = {
  id: string;
  clubId: string;
  lineupPlanId: string;
  name: string;
  description: string | null;
  category: TacticCategory;
  visibility: TacticVisibility;
  durationMs: number;
  status: TacticStatus;
  lineupPlan: { id: string; name: string; formationCode: string };
  createdBy: { id: string; name: string | null; username: string | null };
  sceneCount: number;
  previewData: unknown;
  updatedAt: string;
};

export type TacticDetailDto = Omit<TacticListItemDto, "sceneCount"> & {
  club: { id: string; name: string; slug: string; logoUrl: string | null };
  snapshotData: TacticSnapshot;
  scenes: TacticSceneDto[];
  matches: Array<{ id: string; matchId: string; match: { id: string; title: string | null; startTime: string } }>;
  createdAt: string;
  canEdit: boolean;
};
