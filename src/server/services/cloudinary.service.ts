import "server-only";

import { createHash } from "crypto";
import type { MediaType } from "@/types/post.types";

const FAVORITE_TEAMS_FOLDER = "peerfootball/favorite-teams";
const PROFILE_IMAGES_FOLDER = "peerfootball/profile-images";
const CLUB_IMAGES_FOLDER = "peerfootball/clubs";
export const POST_MEDIA_FOLDER = "peerfootball/posts";

type CloudinaryResourceType = "image" | "video";

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  resource_type?: CloudinaryResourceType;
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  bytes?: number;
  error?: {
    message?: string;
  };
};

type CloudinaryDestroyResponse = {
  result?: "ok" | "not found" | string;
  error?: {
    message?: string;
  };
};

export type UploadedPostMedia = {
  type: MediaType;
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  size?: number;
};

export type CloudinaryAsset = {
  publicId: string;
  type: MediaType | CloudinaryResourceType;
};

export type CloudinaryDeleteResult = {
  ok: boolean;
  publicId: string;
  message?: string;
};

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export async function uploadRemoteImageToCloudinary(imageUrl: string, publicId: string) {
  try {
    const result = await uploadCloudinaryAsset({
      file: imageUrl,
      folder: FAVORITE_TEAMS_FOLDER,
      publicId,
      resourceType: "image",
      overwrite: true,
      failIfMissingConfig: false
    });

    return result?.url ?? null;
  } catch {
    return null;
  }
}

export async function uploadProfileImageFileToCloudinary(file: File, publicId: string) {
  try {
    const result = await uploadCloudinaryAsset({
      file,
      folder: PROFILE_IMAGES_FOLDER,
      publicId,
      resourceType: "image",
      overwrite: true,
      failIfMissingConfig: false
    });

    return result?.url ?? null;
  } catch {
    return null;
  }
}

export async function uploadClubImageFileToCloudinary(file: File, publicId: string) {
  try {
    const result = await uploadCloudinaryAsset({
      file,
      folder: CLUB_IMAGES_FOLDER,
      publicId,
      resourceType: "image",
      overwrite: true,
      failIfMissingConfig: false
    });

    return result ? { url: result.url, publicId: result.publicId } : null;
  } catch {
    return null;
  }
}

export async function uploadPostMedia(file: File, folder = POST_MEDIA_FOLDER): Promise<UploadedPostMedia> {
  const resourceType = file.type.startsWith("video/") ? "video" : "image";
  const result = await uploadCloudinaryAsset({
    file,
    folder,
    resourceType,
    overwrite: false,
    failIfMissingConfig: true
  });

  if (!result) {
    throw new Error("Media upload failed. Please try again.");
  }

  return {
    ...result,
    type: resourceType === "video" ? "VIDEO" : "IMAGE"
  };
}

export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: MediaType | CloudinaryResourceType
): Promise<CloudinaryDeleteResult> {
  if (!isCloudinaryConfigured()) {
    return {
      ok: false,
      publicId,
      message: "Cloudinary is not configured."
    };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      ok: false,
      publicId,
      message: "Cloudinary is not configured."
    };
  }

  const normalizedResourceType = normalizeResourceType(resourceType);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const invalidate = "true";
  const signature = signCloudinaryParams({ invalidate, public_id: publicId, timestamp }, apiSecret);
  const formData = new FormData();

  formData.set("public_id", publicId);
  formData.set("api_key", apiKey);
  formData.set("timestamp", timestamp);
  formData.set("signature", signature);
  formData.set("invalidate", invalidate);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${normalizedResourceType}/destroy`,
      {
        method: "POST",
        body: formData
      }
    );

    const data = (await response.json().catch(() => ({}))) as CloudinaryDestroyResponse;

    if (response.ok && (data.result === "ok" || data.result === "not found")) {
      return {
        ok: true,
        publicId
      };
    }

    return {
      ok: false,
      publicId,
      message: data.error?.message ?? data.result ?? "Cloudinary delete failed."
    };
  } catch {
    return {
      ok: false,
      publicId,
      message: "Cloudinary delete failed."
    };
  }
}

export async function deleteManyCloudinaryAssets(mediaItems: CloudinaryAsset[]) {
  const results = await Promise.all(mediaItems.map((item) => deleteCloudinaryAsset(item.publicId, item.type)));

  return {
    ok: results.every((result) => result.ok),
    results,
    failed: results.filter((result) => !result.ok)
  };
}

function normalizeResourceType(resourceType: MediaType | CloudinaryResourceType): CloudinaryResourceType {
  if (resourceType === "VIDEO" || resourceType === "video") {
    return "video";
  }

  return "image";
}

async function uploadCloudinaryAsset({
  failIfMissingConfig,
  file,
  folder,
  overwrite,
  publicId,
  resourceType
}: {
  failIfMissingConfig: boolean;
  file: string | File;
  folder: string;
  overwrite: boolean;
  publicId?: string;
  resourceType: CloudinaryResourceType;
}): Promise<Omit<UploadedPostMedia, "type"> | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    if (failIfMissingConfig) {
      throw new Error("Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
    }

    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const safePublicId = publicId?.replace(/[^a-zA-Z0-9/_-]/g, "-");
  const paramsToSign: Record<string, string> = {
    folder,
    overwrite: String(overwrite),
    timestamp
  };

  if (safePublicId) {
    paramsToSign.public_id = safePublicId;
  }

  const signature = signCloudinaryParams(paramsToSign, apiSecret);
  const formData = new FormData();

  formData.set("file", file);
  formData.set("api_key", apiKey);
  formData.set("timestamp", timestamp);
  formData.set("signature", signature);
  formData.set("folder", folder);
  formData.set("overwrite", String(overwrite));

  if (safePublicId) {
    formData.set("public_id", safePublicId);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData
  });

  const data = (await response.json().catch(() => ({}))) as CloudinaryUploadResponse;

  if (!response.ok || !data.secure_url || !data.public_id) {
    throw new Error(data.error?.message ?? "Cloudinary upload failed.");
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    duration: data.duration,
    format: data.format,
    size: data.bytes
  };
}

function signCloudinaryParams(params: Record<string, string>, apiSecret: string) {
  const signatureBase = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${signatureBase}${apiSecret}`).digest("hex");
}
