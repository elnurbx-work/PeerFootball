import { measureAsync } from "@/lib/performance";

const textEncoder = new TextEncoder();

export const adminSessionCookieName =
  process.env.NODE_ENV === "production" ? "__Secure-fanpitch-admin" : "fanpitch-admin";
export const adminPendingCookieName =
  process.env.NODE_ENV === "production" ? "__Secure-fanpitch-admin-pending" : "fanpitch-admin-pending";
export const adminSessionMaxAgeSeconds = 60 * 60 * 8;
export const adminPendingMaxAgeSeconds = 60 * 10;

type AdminSessionPayload = {
  email: string;
  expiresAt: number;
  purpose: "session" | "email-code";
};

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(normalized + padding);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function importSigningKey(secret: string, usage: KeyUsage) {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

async function createSignedToken(
  email: string,
  secret: string,
  purpose: AdminSessionPayload["purpose"],
  maxAgeSeconds: number
) {
  const payload: AdminSessionPayload = {
    email,
    expiresAt: Date.now() + maxAgeSeconds * 1000,
    purpose
  };
  const encodedPayload = toBase64Url(textEncoder.encode(JSON.stringify(payload)));
  const key = await importSigningKey(secret, "sign");
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(encodedPayload));
  return `${encodedPayload}.${toBase64Url(new Uint8Array(signature))}`;
}

async function verifySignedToken(
  token: string | undefined,
  expectedEmail: string | undefined,
  secret: string | undefined,
  purpose: AdminSessionPayload["purpose"]
) {
  return measureAsync("adminAuth.hmacVerify", async () => {
    if (!token || !expectedEmail || !secret || secret.length < 32) return false;

    try {
      const [encodedPayload, encodedSignature, extra] = token.split(".");
      if (!encodedPayload || !encodedSignature || extra) return false;

      const key = await importSigningKey(secret, "verify");
      const isValid = await crypto.subtle.verify(
        "HMAC",
        key,
        fromBase64Url(encodedSignature),
        textEncoder.encode(encodedPayload)
      );
      if (!isValid) return false;

      const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload))) as AdminSessionPayload;
      return (
        payload.email === expectedEmail.trim().toLowerCase() &&
        payload.purpose === purpose &&
        Number.isFinite(payload.expiresAt) &&
        payload.expiresAt > Date.now()
      );
    } catch {
      return false;
    }
  }, { route: "admin", purpose });
}

export function createAdminSessionToken(email: string, secret: string) {
  return createSignedToken(email, secret, "session", adminSessionMaxAgeSeconds);
}

export function createAdminPendingToken(email: string, secret: string) {
  return createSignedToken(email, secret, "email-code", adminPendingMaxAgeSeconds);
}

export function verifyAdminSessionToken(
  token: string | undefined,
  expectedEmail: string | undefined,
  secret: string | undefined
) {
  return verifySignedToken(token, expectedEmail, secret, "session");
}

export function verifyAdminPendingToken(
  token: string | undefined,
  expectedEmail: string | undefined,
  secret: string | undefined
) {
  return verifySignedToken(token, expectedEmail, secret, "email-code");
}
