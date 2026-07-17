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
