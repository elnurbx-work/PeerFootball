import "server-only";

import { PrismaAdapter } from "@auth/prisma-adapter";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { prisma } from "@/lib/prisma";

export function createAuthPrismaAdapter() {
  return PrismaAdapter(prisma);
}

const scrypt = promisify(scryptCallback);
const passwordKeyLength = 64;
const verificationTokenMaxAgeMs = 1000 * 60 * 60 * 24;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, passwordKeyLength)) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string | null | undefined) {
  if (!passwordHash) {
    return false;
  }

  const [algorithm, salt, storedKey] = passwordHash.split(":");

  if (algorithm !== "scrypt" || !salt || !storedKey) {
    return false;
  }

  const storedBuffer = Buffer.from(storedKey, "hex");
  const derivedBuffer = (await scrypt(password, salt, storedBuffer.length)) as Buffer;

  return storedBuffer.length === derivedBuffer.length && timingSafeEqual(storedBuffer, derivedBuffer);
}

function getAppUrl() {
  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export async function createEmailVerificationToken(email: string) {
  const identifier = normalizeEmail(email);
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + verificationTokenMaxAgeMs);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires
    }
  });

  return {
    token,
    expires,
    url: `${getAppUrl()}/auth/verify?email=${encodeURIComponent(identifier)}&token=${encodeURIComponent(token)}`
  };
}

export async function sendVerificationEmail(email: string, verificationUrl: string) {
  const from = process.env.EMAIL_FROM;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!from || !resendApiKey) {
    throw new Error("Email delivery is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Verify your FanPitch email",
      html: `<p>Welcome to FanPitch.</p><p><a href="${verificationUrl}">Verify your email</a></p><p>This link expires in 24 hours.</p>`,
      text: `Welcome to FanPitch. Verify your email: ${verificationUrl}`
    })
  });

  if (!response.ok) {
    throw new Error("Verification email could not be sent.");
  }
}

export async function verifyEmailToken(email: string, token: string) {
  const identifier = normalizeEmail(email);
  const verificationToken = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier,
        token
      }
    }
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { email: identifier },
    select: { id: true }
  });

  if (!user) {
    return false;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() }
    }),
    prisma.verificationToken.deleteMany({ where: { identifier } })
  ]);

  return true;
}

async function buildUniqueUsername(user: { id: string; email?: string | null; name?: string | null }) {
  const source = user.email?.split("@")[0] || user.name || "fanpitch";
  const base = source
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
  const fallback = base.length >= 3 ? base : `player${user.id.slice(0, 6)}`;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const suffix = attempt === 0 ? "" : `_${Math.random().toString(36).slice(2, 6)}`;
    const username = `${fallback}${suffix}`.slice(0, 32);
    const existing = await prisma.user.findUnique({ where: { username } });

    if (!existing || existing.id === user.id) {
      return username;
    }
  }

  return `player_${user.id.slice(0, 10)}`;
}

export async function ensureUsername(user: { id?: string; email?: string | null; name?: string | null }) {
  if (!user.id) {
    return;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, username: true }
  });

  if (!dbUser || dbUser.username) {
    return;
  }

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { username: await buildUniqueUsername(dbUser) }
  });
}
