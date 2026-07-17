"use server";

import { localizedFieldErrors } from "@/i18n/zod";

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
import { getServerTranslator } from "@/i18n/server";
import type { Translate } from "@/i18n/dictionary";

export type AuthActionState = ApiResponse<{
  email?: string;
}>;

function databaseUnavailableResponse(t: Translate): AuthActionState {
  return {
    ok: false,
    message: t("responses.auth.databaseUnavailable")
  };
}

export async function signInWithGoogleAction(_formData: FormData): Promise<void> {
  await signIn("google", { redirectTo: "/profile" });
}

export async function signInWithEmailAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const t = await getServerTranslator();
  const result = loginSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { ok: false, message: t("responses.auth.invalidCredentials"), issues: localizedFieldErrors(result.error, t) };
  }

  const email = normalizeEmail(result.data.email);
  let user: { emailVerified: Date | null; passwordHash: string | null } | null;

  try {
    user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true, passwordHash: true }
    });
  } catch {
    return databaseUnavailableResponse(t);
  }

  if (!user || !(await verifyPassword(result.data.password, user.passwordHash))) {
    return { ok: false, message: t("responses.auth.incorrectCredentials") };
  }

  if (!user.emailVerified) {
    return { ok: false, message: t("responses.auth.verifyBeforeSignIn"), issues: { email: [t("responses.auth.emailNotVerified")] } };
  }

  try {
    await signIn("credentials", {
      email,
      password: result.data.password,
      redirectTo: "/profile"
    });
    return { ok: true, message: t("responses.auth.signedIn") };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: t("responses.auth.signInFailed") };
    }

    throw error;
  }
}

export async function registerWithEmailAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const t = await getServerTranslator();
  const result = registerSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { ok: false, message: t("responses.auth.registrationInvalid"), issues: localizedFieldErrors(result.error, t) };
  }

  const email = normalizeEmail(result.data.email);
  let existingUser: { id: string; emailVerified: Date | null } | null;

  try {
    existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true }
    });
  } catch {
    return databaseUnavailableResponse(t);
  }

  if (existingUser?.emailVerified) {
    return {
      ok: false,
      message: t("responses.auth.accountExists"),
      issues: { email: [t("responses.auth.useDifferentEmail")] }
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
    return databaseUnavailableResponse(t);
  }

  let verification: { url: string };

  try {
    verification = await createEmailVerificationToken(email);
  } catch {
    return databaseUnavailableResponse(t);
  }

  try {
    await sendVerificationEmail(email, verification.url);
  } catch {
    return {
      ok: false,
      message: t("responses.auth.emailServiceUnavailable")
    };
  }

  return {
    ok: true,
    message: t("responses.auth.accountCreated"),
    data: { email }
  };
}

export async function resendVerificationEmailAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const t = await getServerTranslator();
  const result = resendVerificationSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { ok: false, message: t("responses.auth.validEmailRequired"), issues: localizedFieldErrors(result.error, t) };
  }

  const email = normalizeEmail(result.data.email);
  let user: { emailVerified: Date | null } | null;

  try {
    user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true }
    });
  } catch {
    return databaseUnavailableResponse(t);
  }

  if (!user) {
    return { ok: true, message: t("responses.auth.verificationIfExists"), data: { email } };
  }

  if (user.emailVerified) {
    return { ok: true, message: t("responses.auth.alreadyVerified"), data: { email } };
  }

  let verification: { url: string };

  try {
    verification = await createEmailVerificationToken(email);
  } catch {
    return databaseUnavailableResponse(t);
  }

  try {
    await sendVerificationEmail(email, verification.url);
  } catch {
    return {
      ok: false,
      message: t("responses.auth.emailServiceUnavailable")
    };
  }

  return {
    ok: true,
    message: t("responses.auth.verificationSent"),
    data: { email }
  };
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
