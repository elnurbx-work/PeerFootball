import "server-only";

import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/server/services/auth.service";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/admin-session";
import { measureAsync } from "@/lib/performance";

function secureStringEqual(supplied: string, expected: string) {
  const suppliedDigest = createHash("sha256").update(supplied).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(suppliedDigest, expectedDigest);
}

function adminCodeIdentifier(email: string) {
  return `admin-login:${normalizeEmail(email)}`;
}

function hashAdminCode(code: string, secret: string) {
  return createHmac("sha256", secret).update(`fanpitch-admin-email-code:${code}`).digest("hex");
}

export function verifyAdminCredentials(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.AUTH_SECRET;

  if (!expectedEmail || !expectedPassword || !sessionSecret || sessionSecret.length < 32) {
    return { ok: false as const, configurationError: true as const };
  }

  const valid =
    normalizeEmail(email) === normalizeEmail(expectedEmail) &&
    secureStringEqual(password, expectedPassword);

  return valid
    ? { ok: true as const, email: normalizeEmail(expectedEmail), sessionSecret }
    : { ok: false as const, configurationError: false as const };
}

export async function sendAdminLoginCode(email: string, secret: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!resendApiKey || !from) throw new Error("Admin email delivery is not configured.");

  const code = randomInt(100_000, 1_000_000).toString();
  const identifier = adminCodeIdentifier(email);
  const token = hashAdminCode(code, secret);
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({ data: { identifier, token, expires } });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "FanPitch admin giriş kodu",
      html: `<p>FanPitch admin giriş kodunuz:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>Kod 10 dəqiqə ərzində etibarlıdır. Bu girişi siz başlatmamısınızsa, mesajı nəzərə almayın.</p>`,
      text: `FanPitch admin giriş kodunuz: ${code}. Kod 10 dəqiqə ərzində etibarlıdır.`
    })
  });

  if (!response.ok) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    throw new Error("Admin login email could not be sent.");
  }
}

export async function verifyAdminLoginCode(email: string, code: string, secret: string) {
  if (!/^\d{6}$/.test(code)) return false;
  const identifier = adminCodeIdentifier(email);
  const token = hashAdminCode(code, secret);
  const verification = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token } }
  });

  if (!verification || verification.expires < new Date()) return false;
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  return true;
}

export async function isAdminAuthenticated() {
  const token = (await cookies()).get(adminSessionCookieName)?.value;
  return verifyAdminSessionToken(token, process.env.ADMIN_EMAIL, process.env.AUTH_SECRET);
}

export async function requireAdmin() {
  const authenticated = await measureAsync("adminAuth.requireAdmin", isAdminAuthenticated, {
    route: "admin"
  });
  if (!authenticated) redirect("/admin/login");
}
