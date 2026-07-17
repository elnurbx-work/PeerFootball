import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128)
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2).max(80)
});

export const resendVerificationSchema = z.object({
  email: z.string().email().max(255)
});

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  image: optionalUrl,
  coverImage: optionalUrl,
  bio: z.string().max(240).optional(),
  favoriteClub: z.string().max(80).optional(),
  preferredPosition: z.string().max(40).optional(),
  avoidedPosition: z.string().max(40).optional(),
  location: z.string().max(80).optional(),
  profileVisibility: z.enum(["PUBLIC", "FRIENDS_ONLY"])
});

export const teamSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(1).max(300),
  logoUrl: optionalUrl
});

export {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_MEDIA_TYPES,
  ALLOWED_VIDEO_TYPES,
  COMMENT_CONTENT_MAX_LENGTH,
  MAX_IMAGE_SIZE_BYTES,
  MAX_POST_MEDIA_COUNT,
  MAX_VIDEO_SIZE_BYTES,
  POST_CONTENT_MAX_LENGTH,
  REPOST_NOTE_MAX_LENGTH,
  createCommentSchema,
  createPostSchema,
  createRepostSchema,
  getPostMediaValidationError,
  postMediaFileSchema
} from "./validations/post";

export {
  MESSAGE_CONTENT_MAX_LENGTH,
  deleteMessageSchema,
  sendMessageSchema
} from "./validations/message";

export {
  assignableClubRoleSchema,
  changeClubMemberRoleSchema,
  clubPermissionPolicySchema,
  clubRoleSchema,
  clubSlugSchema,
  clubVisibilitySchema,
  createClubGuestSchema,
  createClubMetricSchema,
  createClubSchema,
  guestInvitePolicySchema,
  inviteUserToClubSchema,
  transferClubOwnershipSchema,
  updateClubGuestSchema,
  updateClubMetricSchema,
  updateClubSchema,
  updateClubSettingsSchema
} from "./validations/club";

export {
  addMatchPlayerSchema,
  addMatchGoalSchema,
  addMatchVideoSchema,
  createClubVsClubMatchProposalSchema,
  createInternalMatchSchema,
  createMatchCommentSchema,
  disputeMatchResultSchema,
  respondToMatchProposalSchema,
  submitMatchResultSchema,
  updateInternalMatchSidesSchema,
  updateMatchPlayerPositionSchema,
  updateMatchVideoSchema
} from "./validations/match";
