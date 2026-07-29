import { z } from "zod";
import { footballPositionSchema } from "@/lib/football-positions";
import { normalizeMatchVideoUrl } from "@/lib/videos/video-url";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal("").transform(() => undefined));

export const matchCategorySchema = z.enum(["FRIENDLY", "TRAINING", "OFFICIAL"]);
export const clubVsClubCategorySchema = z.enum(["FRIENDLY", "TRAINING"]);
export const matchFormatSchema = z.enum([
  "FIVE_V_FIVE",
  "SIX_V_SIX",
  "SEVEN_V_SEVEN",
  "EIGHT_V_EIGHT",
  "NINE_V_NINE",
  "ELEVEN_V_ELEVEN"
]);

export const createInternalMatchSchema = z.object({
  clubId: z.string().min(1), title: optionalText(120), venue: optionalText(160),
  startTime: z.coerce.date(), endTime: z.coerce.date().optional(),
  category: matchCategorySchema.default("TRAINING"),
  initialStatus: z.enum(["DRAFT", "SCHEDULED"]).default("SCHEDULED"),
  teamAName: z.string().trim().min(1).max(80).default("Team A"),
  teamBName: z.string().trim().min(1).max(80).default("Team B")
}).refine((value) => !value.endTime || value.endTime > value.startTime, { message: "validation.endAfterStart", path: ["endTime"] });

export const updateInternalMatchSidesSchema = z.object({
  matchId: z.string().min(1), teamAName: z.string().trim().min(1).max(80), teamBName: z.string().trim().min(1).max(80)
});

export const updateMatchPlayerPositionSchema = z.object({
  matchPlayerId: z.string().min(1),
  position: footballPositionSchema
});

export const createClubVsClubMatchProposalSchema = z.object({
  proposerClubId: z.string().min(1),
  opponentClubId: z.string().min(1),
  title: optionalText(120),
  venue: z.string().trim().min(2).max(160),
  note: optionalText(1000),
  startTime: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(10).max(300),
  format: matchFormatSchema,
  category: clubVsClubCategorySchema.default("FRIENDLY"),
  proposerIsHome: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean())
}).refine((value) => value.proposerClubId !== value.opponentClubId, {
  message: "validation.opponentDifferent",
  path: ["opponentClubId"]
}).refine((value) => value.startTime.getTime() > Date.now(), {
  message: "validation.futureDate",
  path: ["startTime"]
});

export const respondToMatchProposalSchema = z.object({
  matchId: z.string().min(1),
  response: z.enum(["ACCEPT", "REJECT"]),
  rejectionReason: optionalText(500)
});

export const cancelMatchSchema = z.object({
  matchId: z.string().min(1),
  reason: z.enum(["PLAYER_SHORTAGE", "VENUE_PROBLEM", "DATE_UNAVAILABLE", "WEATHER", "MUTUAL_AGREEMENT", "OTHER"]),
  note: optionalText(500)
});

export const addMatchPlayerSchema = z.object({
  matchId: z.string().min(1), matchSideId: z.string().min(1), userId: z.string().min(1).optional(),
  clubGuestId: z.string().min(1).optional(), guestName: optionalText(120),
  position: footballPositionSchema.optional().or(z.literal("").transform(() => undefined)),
  shirtNumber: z.coerce.number().int().min(1).max(99).optional(),
  lineupRole: z.enum(["STARTER", "SUBSTITUTE"]).default("SUBSTITUTE"),
  isCaptain: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()).default(false),
  isGoalkeeper: z.preprocess((value) => value === true || value === "true" || value === "on", z.boolean()).default(false)
}).refine((value) => [value.userId, value.clubGuestId, value.guestName].filter(Boolean).length === 1, {
  message: "validation.playerChoice", path: ["userId"]
});

export const updateMatchLineupSchema = z.object({
  matchPlayerId: z.string().min(1),
  lineupRole: z.enum(["STARTER", "SUBSTITUTE"]),
  position: footballPositionSchema.optional(),
  shirtNumber: z.coerce.number().int().min(1).max(99).optional(),
  isCaptain: z.boolean().default(false),
  isGoalkeeper: z.boolean().default(false)
});

export const respondToMatchAttendanceSchema = z.object({
  matchPlayerId: z.string().min(1),
  status: z.enum(["ACCEPTED", "DECLINED", "MAYBE"])
});

export const submitMatchResultSchema = z.object({
  matchId: z.string().min(1), homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99), resultNote: optionalText(500)
});
export const disputeMatchResultSchema = z.object({ matchId: z.string().min(1), disputeReason: z.string().trim().min(5).max(1000) });
export const reviewMatchResultSchema = z.object({
  matchId: z.string().min(1),
  response: z.enum(["CONFIRM", "DISPUTE"]),
  alternativeHomeScore: z.coerce.number().int().min(0).max(99).optional(),
  alternativeAwayScore: z.coerce.number().int().min(0).max(99).optional(),
  disputeReason: optionalText(1000)
}).superRefine((value, context) => {
  if (value.response === "DISPUTE" && (value.alternativeHomeScore === undefined || value.alternativeAwayScore === undefined)) {
    context.addIssue({ code: "custom", path: ["alternativeHomeScore"], message: "validation.alternativeScoreRequired" });
  }
});
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
    context.addIssue({ code: "custom", path: ["url"], message: "validation.supportedVideo" });
  }
}

export const addMatchVideoSchema = matchVideoFieldsSchema.superRefine(validateSupportedVideo);
export const updateMatchVideoSchema = matchVideoFieldsSchema.omit({ matchId: true }).extend({ matchVideoId: z.string().min(1) }).superRefine(validateSupportedVideo);

export const addMatchGoalSchema = z.object({
  matchId: z.string().min(1),
  matchSideId: z.string().min(1),
  matchPlayerId: z.string().min(1),
  minute: z.coerce.number().int().min(1).max(150).optional(),
  extraMinute: z.coerce.number().int().min(0).max(15).optional()
});

export const createMatchCommentSchema = z.object({
  matchId: z.string().min(1),
  parentId: z.string().min(1).optional(),
  content: z.string().trim().min(1).max(1000)
});
