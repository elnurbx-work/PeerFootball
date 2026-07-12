import { z } from "zod";

export const FOOTBALL_POSITIONS = [
  "GK", "CB", "LB", "RB", "LWB", "RWB", "CDM", "CM",
  "CAM", "LM", "RM", "LW", "RW", "CF", "ST", "OTHER"
] as const;

export const footballPositionSchema = z.enum(FOOTBALL_POSITIONS);
