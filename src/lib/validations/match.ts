import { z } from "zod";
import { footballPositionSchema } from "@/lib/football-positions";
import { normalizeMatchVideoUrl } from "@/lib/videos/video-url";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal("").transform(() => undefined));

export const matchCategorySchema = z.enum(["FRIENDLY", "TRAINING", "OFFICIAL"]);

export const createInternalMatchSchema = z.object({
  clubId: z.string().min(1), title: optionalText(120), venue: optionalText(160),
  startTime: z.coerce.date(), endTime: z.coerce.date().optional(),
  category: matchCategorySchema.default("TRAINING"),
  initialStatus: z.enum(["DRAFT", "SCHEDULED"]).default("SCHEDULED"),
  teamAName: z.string().trim().min(1).max(80).default("Team A"),
  teamBName: z.string().trim().min(1).max(80).default("Team B")
}).refine((value) => !value.endTime || value.endTime > value.startTime, { message: "End time must be after start time.", path: ["endTime"] });

export const updateInternalMatchSidesSchema = z.object({
  matchId: z.string().min(1), teamAName: z.string().trim().min(1).max(80), teamBName: z.string().trim().min(1).max(80)
});

export const createClubVsClubMatchProposalSchema = z.object({
  homeClubId: z.string().min(1), awayClubId: z.string().min(1), title: optionalText(120),
  venue: optionalText(160), startTime: z.coerce.date(), endTime: z.coerce.date().optional(),
  category: matchCategorySchema.default("FRIENDLY")
}).refine((value) => value.homeClubId !== value.awayClubId, { message: "Choose a different opponent club.", path: ["awayClubId"] })
  .refine((value) => !value.endTime || value.endTime > value.startTime, { message: "End time must be after start time.", path: ["endTime"] });

export const respondToMatchProposalSchema = z.object({ matchId: z.string().min(1), response: z.enum(["ACCEPT", "REJECT"]) });

export const addMatchPlayerSchema = z.object({
  matchId: z.string().min(1), matchSideId: z.string().min(1), userId: z.string().min(1).optional(),
  clubGuestId: z.string().min(1).optional(), guestName: optionalText(120),
  position: footballPositionSchema.optional().or(z.literal("").transform(() => undefined)),
  shirtNumber: z.coerce.number().int().min(1).max(99).optional()
}).refine((value) => [value.userId, value.clubGuestId, value.guestName].filter(Boolean).length === 1, {
  message: "Choose exactly one registered player or guest.", path: ["userId"]
});

export const submitMatchResultSchema = z.object({
  matchId: z.string().min(1), homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99), resultNote: optionalText(500)
});
export const disputeMatchResultSchema = z.object({ matchId: z.string().min(1), disputeReason: z.string().trim().min(5).max(1000) });
const matchVideoFieldsSchema = z.object({
  matchId: z.string().min(1),
  url: z.string().trim().url().max(1000),
  title: optionalText(120),
  description: optionalText(500),
  videoType: z.enum(["FULL_MATCH", "FIRST_HALF", "SECOND_HALF", "OTHER"]),
  matchStartSecond: z.coerce.number().int().min(0).default(0)
});

function validateSupportedVideo(value: { url: string }, context: z.RefinementCtx) {
  if (normalizeMatchVideoUrl(value.url).provider === "EXTERNAL") {
    context.addIssue({ code: "custom", path: ["url"], message: "Hazırda yalnız Google Drive və YouTube video linkləri dəstəklənir." });
  }
}

export const addMatchVideoSchema = matchVideoFieldsSchema.superRefine(validateSupportedVideo);
export const updateMatchVideoSchema = matchVideoFieldsSchema.omit({ matchId: true }).extend({ matchVideoId: z.string().min(1) }).superRefine(validateSupportedVideo);

export const addMatchGoalSchema = z.object({
  matchId: z.string().min(1),
  matchSideId: z.string().min(1),
  matchPlayerId: z.string().min(1).optional(),
  playerName: z.string().trim().min(1).max(120),
  minute: z.coerce.number().int().min(1).max(150).optional(),
  extraMinute: z.coerce.number().int().min(0).max(15).optional()
});

export const createMatchCommentSchema = z.object({
  matchId: z.string().min(1),
  parentId: z.string().min(1).optional(),
  content: z.string().trim().min(1).max(1000)
});
