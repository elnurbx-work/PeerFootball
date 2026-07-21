import "server-only";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { createTranslator } from "@/i18n/dictionary";
import { localeCookieName, toLocale } from "@/i18n/config";

export async function getRequestLocale() {
  const routeLocale = (await headers()).get("x-fanpitch-route-locale");
  return toLocale(routeLocale ?? (await cookies()).get(localeCookieName)?.value);
}

export async function getServerTranslator() {
  return createTranslator(await getRequestLocale());
}
