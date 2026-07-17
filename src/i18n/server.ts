import "server-only";
import { cookies } from "next/headers";
import { createTranslator } from "@/i18n/dictionary";
import { localeCookieName, toLocale } from "@/i18n/config";

export async function getRequestLocale() {
  return toLocale((await cookies()).get(localeCookieName)?.value);
}

export async function getServerTranslator() {
  return createTranslator(await getRequestLocale());
}
