"use server";

import { localizedFieldErrors } from "@/i18n/zod";

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
import type { Translate } from "@/i18n/dictionary";
import { getServerTranslator } from "@/i18n/server";

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

type ProfileInput = z.infer<typeof profileSchema>;
type ProfileValidationResult =
  | { success: true; data: ProfileInput }
  | { success: false; response: ApiResponse<never> };
type ImageUploadResult =
  | { success: true; url: string | null }
  | { success: false; response: ApiResponse<never> };

function validateProfileImageFiles(
  profileImageFile: File | null,
  coverImageFile: File | null,
  t: Translate
): ApiResponse<never> | null {
  if (profileImageFile && !PROFILE_IMAGE_TYPES.has(profileImageFile.type)) {
    return {
      ok: false,
      message: t("responses.profile.invalid"),
      issues: { imageFile: [t("responses.profile.imageType")] }
    };
  }

  if (coverImageFile && !PROFILE_IMAGE_TYPES.has(coverImageFile.type)) {
    return {
      ok: false,
      message: t("responses.profile.invalid"),
      issues: { coverImageFile: [t("responses.profile.imageType")] }
    };
  }

  if (profileImageFile && profileImageFile.size > MAX_PROFILE_IMAGE_SIZE) {
    return {
      ok: false,
      message: t("responses.profile.invalid"),
      issues: { imageFile: [t("responses.profile.photoTooLarge")] }
    };
  }

  if (coverImageFile && coverImageFile.size > MAX_PROFILE_IMAGE_SIZE) {
    return {
      ok: false,
      message: t("responses.profile.invalid"),
      issues: { coverImageFile: [t("responses.profile.coverTooLarge")] }
    };
  }

  return null;
}

function validateProfileForm(formData: FormData, t: Translate): ProfileValidationResult {
  const result = profileSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return {
      success: false,
      response: { ok: false, message: t("responses.profile.invalid"), issues: localizedFieldErrors(result.error, t) }
    };
  }

  return { success: true, data: result.data };
}

async function getUsernameUniquenessError(
  username: string,
  userId: string,
  t: Translate
): Promise<ApiResponse<never> | null> {
  const existingUsername = await prisma.user.findUnique({
    where: { username },
    select: { id: true }
  });

  if (existingUsername && existingUsername.id !== userId) {
    return {
      ok: false,
      message: t("responses.profile.usernameTaken"),
      issues: { username: [t("responses.profile.chooseUsername")] }
    };
  }

  return null;
}

function getCloudinaryConfigurationError(
  profileImageFile: File | null,
  coverImageFile: File | null,
  t: Translate
): ApiResponse<never> | null {
  if ((!profileImageFile && !coverImageFile) || isCloudinaryConfigured()) return null;

  return {
    ok: false,
    message: t("responses.profile.uploadNotConfigured"),
    issues: {
      imageFile: profileImageFile ? [t("responses.profile.uploadUnavailable")] : undefined,
      coverImageFile: coverImageFile ? [t("responses.profile.uploadUnavailable")] : undefined
    }
  };
}

function createUploadErrorResponse(
  messageKey: Parameters<Translate>[0],
  fieldName: "imageFile" | "coverImageFile",
  t: Translate
): ApiResponse<never> {
  return {
    ok: false,
    message: t(messageKey),
    issues: { [fieldName]: [t("responses.profile.uploadFailed")] }
  };
}

async function uploadProfileImage(
  file: File | null,
  currentUrl: string | null,
  userId: string,
  t: Translate
): Promise<ImageUploadResult> {
  if (!file) return { success: true, url: currentUrl };

  const uploadedImageUrl = await uploadProfileImageFileToCloudinary(file, `${userId}/profile-photo`);
  if (!uploadedImageUrl) {
    return { success: false, response: createUploadErrorResponse("responses.profile.photoUploadFailed", "imageFile", t) };
  }

  return { success: true, url: uploadedImageUrl };
}

async function uploadCoverImage(
  file: File | null,
  currentUrl: string | null,
  userId: string,
  t: Translate
): Promise<ImageUploadResult> {
  if (!file) return { success: true, url: currentUrl };

  const uploadedCoverUrl = await uploadProfileImageFileToCloudinary(file, `${userId}/cover-photo`);
  if (!uploadedCoverUrl) {
    return { success: false, response: createUploadErrorResponse("responses.profile.coverUploadFailed", "coverImageFile", t) };
  }

  return { success: true, url: uploadedCoverUrl };
}

function revalidateUpdatedProfileRoutes(username: string | null) {
  revalidatePath("/profile");
  revalidatePath("/settings");
  if (username) revalidatePath(`/profile/${username}`);
}

export async function updateProfileAction(_prevState: ApiResponse, formData: FormData): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const profileImageFile = getImageFile(formData, "imageFile");
  const coverImageFile = getImageFile(formData, "coverImageFile");
  const fileValidationError = validateProfileImageFiles(profileImageFile, coverImageFile, t);
  if (fileValidationError) return fileValidationError;

  const validation = validateProfileForm(formData, t);
  if (!validation.success) return validation.response;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, message: t("responses.profile.signInEdit") };
  }

  const usernameError = await getUsernameUniquenessError(validation.data.username, userId, t);
  if (usernameError) return usernameError;

  const cloudinaryError = getCloudinaryConfigurationError(profileImageFile, coverImageFile, t);
  if (cloudinaryError) return cloudinaryError;

  const profileImage = await uploadProfileImage(profileImageFile, optional(validation.data.image), userId, t);
  if (!profileImage.success) return profileImage.response;

  const coverImage = await uploadCoverImage(coverImageFile, optional(validation.data.coverImage), userId, t);
  if (!coverImage.success) return coverImage.response;

  const profile = await prisma.user.update({
    where: { id: userId },
    data: {
      name: validation.data.name.trim(),
      username: validation.data.username.trim(),
      image: profileImage.url,
      coverImage: coverImage.url,
      bio: optional(validation.data.bio),
      favoriteClub: optional(validation.data.favoriteClub),
      preferredPosition: optional(validation.data.preferredPosition),
      avoidedPosition: optional(validation.data.avoidedPosition),
      location: optional(validation.data.location)
    },
    select: { username: true }
  });

  revalidateUpdatedProfileRoutes(profile.username);

  return { ok: true, message: t("responses.profile.saved"), data: profile };
}

export async function addFavoriteTeamAction(
  input: AddFavoriteTeamInput
): Promise<ApiResponse<UserFavoriteTeamSummary>> {
  const t = await getServerTranslator();
  const result = favoriteTeamInputSchema.safeParse(input);

  if (!result.success) {
    return { ok: false, message: t("responses.team.invalid"), issues: localizedFieldErrors(result.error, t) };
  }

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, message: t("responses.profile.signInFavorites") };
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
    return { ok: false, message: t("responses.profile.favoriteExists") };
  }

  const favoriteTeamsCount = await prisma.userFavoriteTeam.count({ where: { userId } });

  if (favoriteTeamsCount >= 5) {
    return { ok: false, message: t("responses.profile.favoriteLimit") };
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

  return { ok: true, message: t("responses.profile.favoriteAdded"), data: created };
}

export async function removeFavoriteTeamAction(
  favoriteTeamId: string
): Promise<ApiResponse<{ id: string }>> {
  const t = await getServerTranslator();
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, message: t("responses.profile.signInFavorites") };
  }

  const result = await prisma.userFavoriteTeam.deleteMany({
    where: {
      id: favoriteTeamId,
      userId
    }
  });

  if (result.count === 0) {
    return { ok: false, message: t("responses.profile.favoriteNotFound") };
  }

  await revalidateProfilePaths(userId);

  return { ok: true, message: t("responses.profile.favoriteRemoved"), data: { id: favoriteTeamId } };
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
