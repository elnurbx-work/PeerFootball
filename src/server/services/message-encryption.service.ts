import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import type { EncryptedMessagePayload } from "@/types/message.types";

const MESSAGE_ALGORITHM = "aes-256-gcm";
const MESSAGE_KEY_VERSION = 1;
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;
const KEY_LENGTH_BYTES = 32;

export function encryptMessage(plainText: string): EncryptedMessagePayload {
  const key = getMessageEncryptionKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(MESSAGE_ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES
  });

  const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    algorithm: MESSAGE_ALGORITHM,
    keyVersion: MESSAGE_KEY_VERSION
  };
}

export function decryptMessage(payload: EncryptedMessagePayload): string {
  if (payload.algorithm !== MESSAGE_ALGORITHM || payload.keyVersion !== MESSAGE_KEY_VERSION) {
    throw new Error("Unsupported message encryption payload.");
  }

  const key = getMessageEncryptionKey();
  const decipher = createDecipheriv(MESSAGE_ALGORITHM, key, Buffer.from(payload.iv, "base64"), {
    authTagLength: AUTH_TAG_LENGTH_BYTES
  });

  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final()
  ]).toString("utf8");
}

function getMessageEncryptionKey() {
  const configuredKey = process.env.MESSAGE_ENCRYPTION_KEY;

  if (!configuredKey) {
    throw new Error("MESSAGE_ENCRYPTION_KEY is not configured.");
  }

  const trimmedKey = configuredKey.trim();
  const candidates = [
    Buffer.from(trimmedKey, "base64"),
    /^[a-fA-F0-9]{64}$/.test(trimmedKey) ? Buffer.from(trimmedKey, "hex") : null,
    Buffer.from(trimmedKey, "utf8")
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.length === KEY_LENGTH_BYTES) {
      return candidate;
    }
  }

  throw new Error("MESSAGE_ENCRYPTION_KEY must decode to exactly 32 bytes. Prefer a base64 encoded 32-byte key.");
}
