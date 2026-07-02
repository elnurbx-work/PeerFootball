import type { PostVisibility, ProfileVisibility } from "@prisma/client";

export type { PostVisibility, ProfileVisibility };

export type EncryptedPayload = {
  ciphertext: string;
  iv: string;
  algorithm: "AES-GCM" | string;
  keyVersion: number;
};

export type ProfilePrivacyDecision = {
  canView: boolean;
  visibility: ProfileVisibility;
  minimalPublicMetadataOnly: boolean;
};

export type PostPrivacyDecision = {
  canView: boolean;
  visibility: PostVisibility;
};
