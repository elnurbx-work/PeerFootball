import { z } from "zod";
import { footballPositionSchema } from "@/lib/football-positions";

export const clubRoleSchema = z.enum(["OWNER", "TD", "YTD", "PLAYER"]);
export const assignableClubRoleSchema = z.enum(["TD", "YTD", "PLAYER"]);
export const clubVisibilitySchema = z.enum(["OPEN", "REQUEST_ONLY", "INVITE_ONLY"]);
export const clubPermissionPolicySchema = z.enum(["OWNER_ONLY", "OWNER_TD", "OWNER_TD_YTD"]);
export const guestInvitePolicySchema = z.enum(["CLOSED", "ONLY_OWNER_TD_YTD", "PLAYERS_CAN_INVITE_FRIENDS"]);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

const optionalUrl = z
  .string()
  .trim()
  .url()
  .max(500)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const clubSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "validation.clubSlug");

export const createClubSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: clubSlugSchema.optional().or(z.literal("").transform(() => undefined)),
  description: optionalText(500),
  logoUrl: optionalUrl,
  coverUrl: optionalUrl,
  country: optionalText(80),
  city: optionalText(80)
});

export const updateClubSchema = createClubSchema.extend({
  visibility: clubVisibilitySchema
});

export const updateClubSettingsSchema = z.object({
  joinApprovalPolicy: clubPermissionPolicySchema,
  invitePermissionPolicy: clubPermissionPolicySchema,
  matchCreatePermissionPolicy: clubPermissionPolicySchema,
  guestInvitePolicy: guestInvitePolicySchema
});

export const inviteUserToClubSchema = z.object({
  clubId: z.string().min(1),
  userId: z.string().min(1),
  role: assignableClubRoleSchema.default("PLAYER")
});

export const changeClubMemberRoleSchema = z.object({
  memberId: z.string().min(1),
  role: assignableClubRoleSchema
});

export const createClubGuestSchema = z.object({
  clubId: z.string().min(1),
  fullName: z.string().trim().min(1).max(120),
  position: footballPositionSchema.optional().or(z.literal("").transform(() => undefined)),
  phone: optionalText(40),
  note: optionalText(300)
});

export const updateClubGuestSchema = createClubGuestSchema.omit({ clubId: true }).extend({
  guestId: z.string().min(1)
});

export const createClubMetricSchema = z.object({
  clubId: z.string().min(1),
  name: z.string().trim().min(1).max(50),
  description: optionalText(200),
  order: z.coerce.number().int().min(1).max(6).optional()
});

export const updateClubMetricSchema = createClubMetricSchema.omit({ clubId: true }).extend({
  metricId: z.string().min(1)
});

export const transferClubOwnershipSchema = z.object({
  clubId: z.string().min(1),
  newOwnerMemberId: z.string().min(1),
  oldOwnerNewRole: assignableClubRoleSchema.default("TD"),
  confirm: z.literal("TRANSFER")
});

export type CreateClubInput = z.infer<typeof createClubSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;
export type UpdateClubSettingsInput = z.infer<typeof updateClubSettingsSchema>;
