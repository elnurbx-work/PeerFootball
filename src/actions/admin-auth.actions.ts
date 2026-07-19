"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  adminSessionCookieName,
  adminPendingCookieName,
  adminPendingMaxAgeSeconds,
  adminSessionMaxAgeSeconds,
  createAdminPendingToken,
  createAdminSessionToken
} from "@/lib/admin-session";
import { verifyAdminPendingToken } from "@/lib/admin-session";
import {
  sendAdminLoginCode,
  verifyAdminCredentials,
  verifyAdminLoginCode
} from "@/server/services/admin-auth.service";

export type AdminLoginState = {
  ok: boolean;
  message: string;
  step: "credentials" | "code";
};

export async function adminLoginAction(
  _previousState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, message: "Email və parol tələb olunur.", step: "credentials" };
  }

  const result = verifyAdminCredentials(email, password);
  if (!result.ok) {
    return {
      ok: false,
      message: result.configurationError
        ? "Admin təhlükəsizlik dəyişənləri konfiqurasiya edilməyib."
        : "Email və ya parol yanlışdır.",
      step: "credentials"
    };
  }

  try {
    await sendAdminLoginCode(result.email, result.sessionSecret);
  } catch {
    return { ok: false, message: "Giriş kodu email-ə göndərilə bilmədi.", step: "credentials" };
  }

  const pendingToken = await createAdminPendingToken(result.email, result.sessionSecret);
  (await cookies()).set(adminPendingCookieName, pendingToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: adminPendingMaxAgeSeconds
  });

  return { ok: true, message: "6 rəqəmli giriş kodu email ünvanına göndərildi.", step: "code" };
}

export async function adminVerifyCodeAction(
  _previousState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  const email = process.env.ADMIN_EMAIL;
  const secret = process.env.AUTH_SECRET;
  const cookieStore = await cookies();
  const pendingToken = cookieStore.get(adminPendingCookieName)?.value;
  const pending = await verifyAdminPendingToken(pendingToken, email, secret);

  if (!pending || !email || !secret) {
    return { ok: false, message: "Giriş sorğusunun vaxtı bitib. Yenidən daxil olun.", step: "credentials" };
  }

  if (!(await verifyAdminLoginCode(email, code, secret))) {
    return { ok: false, message: "Kod yanlışdır və ya vaxtı bitib.", step: "code" };
  }

  const token = await createAdminSessionToken(email.trim().toLowerCase(), secret);
  cookieStore.set(adminPendingCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 0
  });
  (await cookies()).set(adminSessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: adminSessionMaxAgeSeconds
  });

  redirect("/admin");
}

export async function adminLogoutAction() {
  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 0
  });
  cookieStore.set(adminPendingCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 0
  });
  redirect("/admin/login");
}
