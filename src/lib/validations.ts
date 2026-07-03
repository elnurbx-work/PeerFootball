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
  bio: z.string().max(240).optional(),
  favoriteClub: z.string().max(80).optional(),
  preferredPosition: z.string().max(40).optional(),
  avoidedPosition: z.string().max(40).optional(),
  location: z.string().max(80).optional()
});

export const postSchema = z.object({
  content: z.string().min(1).max(1000),
  mediaUrl: optionalUrl,
  mediaType: z.enum(["IMAGE", "VIDEO"]).optional()
});

export const teamSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(1).max(300),
  logoUrl: optionalUrl
});

export const matchSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  location: z.string().min(2).max(120),
  matchDate: z.coerce.date(),
  maxPlayers: z.coerce.number().int().min(2).max(40),
  teamId: z.string().optional()
});
