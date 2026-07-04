"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { profileSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import {
  isCloudinaryConfigured,
  uploadProfileImageFileToCloudinary,
  uploadRemoteImageToCloudinary
} from "@/server/services/cloudinary.service";
import { lookupTeamById } from "@/server/services/thesportsdb.service";
import type { ApiResponse } from "@/types/api.types";
import type { AddFavoriteTeamInput, UserFavoriteTeamSummary } from "@/types/profile.types";

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
const PROFILE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const favoriteTeamInputSchema = z.object({
  externalId: z.string().max(80).optional().nullable(),
  name: z.string().min(1).max(120),
  country: z.string().max(80).optional().nullable(),
  league: z.string().max(120).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  badgeUrl: z.string().url().optional().nullable()
});

const favoriteTeamSelect = {
  id: true,
  externalId: true,
  name: true,
  country: true,
  league: true,
  logoUrl: true,
  badgeUrl: true
} as const;

export async function updateProfileAction(_prevState: ApiResponse, formData: FormData): Promise<ApiResponse> {
  const profileImageFile = getImageFile(formData, "imageFile");
  const coverImageFile = getImageFile(formData, "coverImageFile");

  if (profileImageFile && !PROFILE_IMAGE_TYPES.has(profileImageFile.type)) {
    return {
      ok: false,
      message: "Profile details are invalid.",
      issues: { imageFile: ["Choose a JPG, PNG, WebP, or GIF image."] }
    };
  }

  if (coverImageFile && !PROFILE_IMAGE_TYPES.has(coverImageFile.type)) {
    return {
      ok: false,
      message: "Profile details are invalid.",
      issues: { coverImageFile: ["Choose a JPG, PNG, WebP, or GIF image."] }
    };
  }

  if (profileImageFile && profileImageFile.size > MAX_PROFILE_IMAGE_SIZE) {
    return {
      ok: false,
      message: "Profile details are invalid.",
      issues: { imageFile: ["Profile photo must be 5 MB or smaller."] }
    };
  }

  if (coverImageFile && coverImageFile.size > MAX_PROFILE_IMAGE_SIZE) {
    return {
      ok: false,
      message: "Profile details are invalid.",
      issues: { coverImageFile: ["Cover photo must be 5 MB or smaller."] }
    };
  }

  const result = profileSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { ok: false, message: "Profile details are invalid.", issues: result.error.flatten().fieldErrors };
  }

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, message: "You need to sign in before editing your profile." };
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username: result.data.username },
    select: { id: true }
  });

  if (existingUsername && existingUsername.id !== userId) {
    return {
      ok: false,
      message: "That username is already taken.",
      issues: { username: ["Choose another username."] }
    };
  }

  const optional = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };

  let profileImageUrl = optional(result.data.image);
  let coverImageUrl = optional(result.data.coverImage);

  if (profileImageFile || coverImageFile) {
    if (!isCloudinaryConfigured()) {
      return {
        ok: false,
        message: "Image upload is not configured yet. Add Cloudinary settings and try again.",
        issues: {
          imageFile: profileImageFile ? ["Image upload is not configured."] : undefined,
          coverImageFile: coverImageFile ? ["Image upload is not configured."] : undefined
        }
      };
    }
  }

  if (profileImageFile) {
    const uploadedImageUrl = await uploadProfileImageFileToCloudinary(profileImageFile, `${userId}/profile-photo`);

    if (!uploadedImageUrl) {
      return {
        ok: false,
        message: "We could not upload that profile photo. Try another image.",
        issues: { imageFile: ["Upload failed."] }
      };
    }

    profileImageUrl = uploadedImageUrl;
  }

  if (coverImageFile) {
    const uploadedCoverUrl = await uploadProfileImageFileToCloudinary(coverImageFile, `${userId}/cover-photo`);

    if (!uploadedCoverUrl) {
      return {
        ok: false,
        message: "We could not upload that cover photo. Try another image.",
        issues: { coverImageFile: ["Upload failed."] }
      };
    }

    coverImageUrl = uploadedCoverUrl;
  }

  const profile = await prisma.user.update({
    where: { id: userId },
    data: {
      name: result.data.name.trim(),
      username: result.data.username.trim(),
      image: profileImageUrl,
      coverImage: coverImageUrl,
      bio: optional(result.data.bio),
      favoriteClub: optional(result.data.favoriteClub),
      preferredPosition: optional(result.data.preferredPosition),
      avoidedPosition: optional(result.data.avoidedPosition),
      location: optional(result.data.location),
      profileVisibility: result.data.profileVisibility
    },
    select: { username: true }
  });

  revalidatePath("/profile");
  revalidatePath("/settings");
  if (profile.username) {
    revalidatePath(`/profile/${profile.username}`);
  }

  return { ok: true, message: "Profile saved.", data: profile };
}

export async function addFavoriteTeamAction(
  input: AddFavoriteTeamInput
): Promise<ApiResponse<UserFavoriteTeamSummary>> {
  const result = favoriteTeamInputSchema.safeParse(input);

  if (!result.success) {
    return { ok: false, message: "Team details are invalid.", issues: result.error.flatten().fieldErrors };
  }

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, message: "You need to sign in before editing favorite teams." };
  }

  const data = {
    externalId: optional(result.data.externalId),
    name: result.data.name.trim(),
    country: optional(result.data.country),
    league: optional(result.data.league),
    logoUrl: optional(result.data.logoUrl),
    badgeUrl: optional(result.data.badgeUrl)
  };

  const duplicate = await prisma.userFavoriteTeam.findFirst({
    where: {
      userId,
      OR: [
        ...(data.externalId ? [{ externalId: data.externalId }] : []),
        { name: data.name, source: "thesportsdb" }
      ]
    },
    select: { id: true }
  });

  if (duplicate) {
    return { ok: false, message: "That team is already in your favorites." };
  }

  const favoriteTeamsCount = await prisma.userFavoriteTeam.count({ where: { userId } });

  if (favoriteTeamsCount >= 5) {
    return { ok: false, message: "You can save up to 5 favorite teams." };
  }

  let freshTeam: AddFavoriteTeamInput | null = null;

  if (data.externalId) {
    try {
      freshTeam = await lookupTeamById(data.externalId);
    } catch {
      freshTeam = null;
    }
  }

  const team = {
    externalId: optional(freshTeam?.externalId) ?? data.externalId,
    name: optional(freshTeam?.name) ?? data.name,
    country: optional(freshTeam?.country) ?? data.country,
    league: optional(freshTeam?.league) ?? data.league,
    logoUrl: optional(freshTeam?.logoUrl) ?? data.logoUrl,
    badgeUrl: optional(freshTeam?.badgeUrl) ?? data.badgeUrl
  };
  const imageUrl = team.badgeUrl ?? team.logoUrl;
  const cloudinaryUrl =
    imageUrl && isCloudinaryConfigured()
      ? await uploadRemoteImageToCloudinary(imageUrl, `${userId}/${team.externalId ?? slugify(team.name)}`)
      : null;
  const finalLogoUrl = cloudinaryUrl ?? imageUrl;

  const created = await prisma.userFavoriteTeam.create({
    data: {
      userId,
      externalId: team.externalId,
      name: team.name,
      country: team.country,
      league: team.league,
      logoUrl: finalLogoUrl,
      badgeUrl: team.badgeUrl,
      source: "thesportsdb"
    },
    select: favoriteTeamSelect
  });

  await revalidateProfilePaths(userId);

  return { ok: true, message: "Favorite team added.", data: created };
}

export async function removeFavoriteTeamAction(
  favoriteTeamId: string
): Promise<ApiResponse<{ id: string }>> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, message: "You need to sign in before editing favorite teams." };
  }

  const result = await prisma.userFavoriteTeam.deleteMany({
    where: {
      id: favoriteTeamId,
      userId
    }
  });

  if (result.count === 0) {
    return { ok: false, message: "Favorite team was not found." };
  }

  await revalidateProfilePaths(userId);

  return { ok: true, message: "Favorite team removed.", data: { id: favoriteTeamId } };
}

async function revalidateProfilePaths(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  });

  revalidatePath("/profile");
  revalidatePath("/settings");

  if (user?.username) {
    revalidatePath(`/profile/${user.username}`);
  }
}

function optional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getImageFile(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
