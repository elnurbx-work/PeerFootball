import type { FootballPosition, LineupPitchType } from "@prisma/client";

export type FormationSlotPreset = {
  slotKey: string;
  label: string;
  position: FootballPosition;
  x: number;
  y: number;
  sortOrder: number;
  isGoalkeeper: boolean;
};

export const FORMATION_PRESETS: Record<number, readonly string[]> = {
  5: ["1-2-1", "1-1-2", "2-1-1"],
  6: ["2-2-1", "1-3-1", "2-1-2"],
  7: ["2-3-1", "3-2-1", "2-2-2"],
  8: ["3-3-1", "2-3-2", "3-2-2"],
  9: ["3-3-2", "3-2-3", "4-3-1"],
  10: ["3-4-2", "4-3-2", "4-4-1"],
  11: ["4-3-3", "4-2-3-1", "4-4-2", "3-5-2", "3-4-3", "5-3-2"]
};

export const PLAYER_COUNTS = Object.keys(FORMATION_PRESETS).map(Number);
export const PITCH_TYPES: LineupPitchType[] = ["FULL", "HALF", "SMALL"];

export function formationMatchesPlayerCount(formationCode: string, playerCount: number) {
  const lineCounts = parseFormation(formationCode);
  return lineCounts !== null && 1 + lineCounts.reduce((sum, value) => sum + value, 0) === playerCount;
}

export function createFormationSlots(formationCode: string, playerCount: number): FormationSlotPreset[] {
  if (!formationMatchesPlayerCount(formationCode, playerCount)) {
    throw new Error("Formation does not match player count.");
  }
  const lineCounts = parseFormation(formationCode)!;
  const slots: FormationSlotPreset[] = [{
    slotKey: "GK",
    label: "GK",
    position: "GK",
    x: 8,
    y: 50,
    sortOrder: 0,
    isGoalkeeper: true
  }];
  const xStep = 82 / (lineCounts.length + 1);
  let order = 1;

  lineCounts.forEach((count, lineIndex) => {
    const x = 8 + xStep * (lineIndex + 1);
    for (let index = 0; index < count; index += 1) {
      const y = 100 * (index + 1) / (count + 1);
      const position = getLinePosition(lineIndex, lineCounts.length, index, count);
      const prefix = lineIndex === lineCounts.length - 1 ? "FWD" : lineIndex === 0 ? "DEF" : `MID_${lineIndex}`;
      slots.push({
        slotKey: `${prefix}_${index + 1}`,
        label: position,
        position,
        x: round(x),
        y: round(y),
        sortOrder: order,
        isGoalkeeper: false
      });
      order += 1;
    }
  });
  return slots;
}

function parseFormation(value: string) {
  const parts = value.split("-").map(Number);
  return parts.length && parts.every((part) => Number.isInteger(part) && part > 0) ? parts : null;
}

function getLinePosition(lineIndex: number, lineCount: number, itemIndex: number, itemCount: number): FootballPosition {
  if (lineIndex === 0) {
    if (itemCount >= 3 && itemIndex === 0) return "LB";
    if (itemCount >= 3 && itemIndex === itemCount - 1) return "RB";
    return "CB";
  }
  if (lineIndex === lineCount - 1) {
    if (itemCount >= 3 && itemIndex === 0) return "LW";
    if (itemCount >= 3 && itemIndex === itemCount - 1) return "RW";
    return "ST";
  }
  if (itemCount >= 3 && itemIndex === 0) return "LM";
  if (itemCount >= 3 && itemIndex === itemCount - 1) return "RM";
  return "CM";
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
