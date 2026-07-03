"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { loginSchema, registerSchema, resendVerificationSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import {
  createEmailVerificationToken,
  hashPassword,
  normalizeEmail,
  sendVerificationEmail,
  verifyPassword
} from "@/server/services/auth.service";
import type { ApiResponse } from "@/types/api.types";

export type AuthActionState = ApiResponse<{
  email?: string;
}>;

function databaseUnavailableResponse(): AuthActionState {
  return {
    ok: false,
    message: "Database connection is unavailable. Please try again in a moment."
  };
}

export async function signInWithGoogleAction(_formData: FormData): Promise<void> {
  await signIn("google", { redirectTo: "/profile" });
}

export async function signInWithEmailAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { ok: false, message: "Email or password is invalid.", issues: result.error.flatten().fieldErrors };
  }

  const email = normalizeEmail(result.data.email);
  let user: { emailVerified: Date | null; passwordHash: string | null } | null;

  try {
    user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true, passwordHash: true }
    });
  } catch {
    return databaseUnavailableResponse();
  }

  if (!user || !(await verifyPassword(result.data.password, user.passwordHash))) {
    return { ok: false, message: "Email or password is incorrect." };
  }

  if (!user.emailVerified) {
    return { ok: false, message: "Please verify your email before signing in.", issues: { email: ["Email is not verified."] } };
  }

  try {
    await signIn("credentials", {
      email,
      password: result.data.password,
      redirectTo: "/profile"
    });
    return { ok: true, message: "Signed in." };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Could not sign in with those details." };
    }

    throw error;
  }
}

export async function registerWithEmailAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const result = registerSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { ok: false, message: "Registration details are invalid.", issues: result.error.flatten().fieldErrors };
  }

  const email = normalizeEmail(result.data.email);
  let existingUser: { id: string; emailVerified: Date | null } | null;

  try {
    existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true }
    });
  } catch {
    return databaseUnavailableResponse();
  }

  if (existingUser?.emailVerified) {
    return {
      ok: false,
      message: "An account with this email already exists.",
      issues: { email: ["Use a different email or sign in."] }
    };
  }

  const passwordHash = await hashPassword(result.data.password);

  try {
    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: result.data.name.trim(),
          passwordHash
        }
      });
    } else {
      await prisma.user.create({
        data: {
          name: result.data.name.trim(),
          email,
          passwordHash
        }
      });
    }
  } catch {
    return databaseUnavailableResponse();
  }

  let verification: { url: string };

  try {
    verification = await createEmailVerificationToken(email);
  } catch {
    return databaseUnavailableResponse();
  }

  try {
    await sendVerificationEmail(email, verification.url);
  } catch {
    return {
      ok: false,
      message: "Email verification service is not configured yet. Add mail settings and try again."
    };
  }

  return {
    ok: true,
    message: "Account created. Check your email to verify it before signing in.",
    data: { email }
  };
}

export async function resendVerificationEmailAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const result = resendVerificationSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { ok: false, message: "Enter a valid email address.", issues: result.error.flatten().fieldErrors };
  }

  const email = normalizeEmail(result.data.email);
  let user: { emailVerified: Date | null } | null;

  try {
    user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true }
    });
  } catch {
    return databaseUnavailableResponse();
  }

  if (!user) {
    return { ok: true, message: "If an account exists, a verification email has been sent.", data: { email } };
  }

  if (user.emailVerified) {
    return { ok: true, message: "This email is already verified. You can sign in now.", data: { email } };
  }

  let verification: { url: string };

  try {
    verification = await createEmailVerificationToken(email);
  } catch {
    return databaseUnavailableResponse();
  }

  try {
    await sendVerificationEmail(email, verification.url);
  } catch {
    return {
      ok: false,
      message: "Email verification service is not configured yet. Add mail settings and try again."
    };
  }

  return {
    ok: true,
    message: "Verification email sent.",
    data: { email }
  };
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
