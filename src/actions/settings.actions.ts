"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTranslator } from "@/i18n/dictionary";
import { isLocale, localeCookieName, toLocale, type Locale } from "@/i18n/config";
import type { ApiResponse } from "@/types/api.types";

const dbLocale = { az: "AZ", en: "EN", ru: "RU" } as const;

export async function updateLocaleAction(locale: Locale): Promise<ApiResponse> {
  const user = await getCurrentUser();
  const currentLocale = user?.locale ?? toLocale((await cookies()).get(localeCookieName)?.value);
  const t = createTranslator(currentLocale);
  if (!user) return { ok: false, message: t("responses.signInRequired") };
  if (!isLocale(locale)) return { ok: false, message: t("responses.localeInvalid") };

  await prisma.user.update({ where: { id: user.id }, data: { locale: dbLocale[locale] } });
  (await cookies()).set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production"
  });
  revalidatePath("/", "layout");
  return { ok: true, message: createTranslator(locale)("responses.localeSaved") };
}

export async function updateProfileVisibilityAction(
  visibility: "PUBLIC" | "FRIENDS_ONLY"
): Promise<ApiResponse<{ visibility: "PUBLIC" | "FRIENDS_ONLY" }>> {
  const user = await getCurrentUser();
  const t = createTranslator(user?.locale ?? toLocale((await cookies()).get(localeCookieName)?.value));
  if (!user) return { ok: false, message: t("responses.signInRequired") };
  if (visibility !== "PUBLIC" && visibility !== "FRIENDS_ONLY") {
    return { ok: false, message: t("responses.profile.invalid") };
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { profileVisibility: visibility },
    select: { username: true }
  });

  revalidatePath("/profile");
  revalidatePath("/settings");
  if (updated.username) revalidatePath(`/profile/${updated.username}`);
  return {
    ok: true,
    message: t("settings.visibilitySaved"),
    data: { visibility }
  };
}
