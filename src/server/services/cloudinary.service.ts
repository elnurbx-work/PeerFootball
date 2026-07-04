import "server-only";

import { createHash } from "crypto";

const FAVORITE_TEAMS_FOLDER = "peerfootball/favorite-teams";
const PROFILE_IMAGES_FOLDER = "peerfootball/profile-images";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export async function uploadRemoteImageToCloudinary(imageUrl: string, publicId: string) {
  return uploadImageToCloudinary(imageUrl, publicId, FAVORITE_TEAMS_FOLDER);
}

export async function uploadProfileImageFileToCloudinary(file: File, publicId: string) {
  return uploadImageToCloudinary(file, publicId, PROFILE_IMAGES_FOLDER);
}

async function uploadImageToCloudinary(file: string | File, publicId: string, folder: string) {
  if (!isCloudinaryConfigured()) {
    return null;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const safePublicId = publicId.replace(/[^a-zA-Z0-9/_-]/g, "-");
  const overwrite = "true";
  const signature = createHash("sha1")
    .update(`folder=${folder}&overwrite=${overwrite}&public_id=${safePublicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const formData = new FormData();
  formData.set("file", file);
  formData.set("api_key", apiKey);
  formData.set("timestamp", timestamp);
  formData.set("signature", signature);
  formData.set("folder", folder);
  formData.set("public_id", safePublicId);
  formData.set("overwrite", overwrite);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { secure_url?: string };
    return data.secure_url ?? null;
  } catch {
    return null;
  }
}
