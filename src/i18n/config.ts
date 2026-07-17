import az from "@/locales/az.json";

export const locales = ["az", "en", "ru"] as const;
export type Locale = (typeof locales)[number];
type Join<K, P> = K extends string | number ? P extends string | number ? `${K}.${P}` : never : never;
type Paths<T> = T extends string ? never : { [K in keyof T]: T[K] extends string ? K : Join<K, Paths<T[K]>> }[keyof T];
export type MessageKey = Extract<Paths<typeof az>, string>;
export const defaultLocale: Locale = "az";
export const localeCookieName = "fanpitch.locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

export function toLocale(value: string | null | undefined): Locale {
  const normalized = value?.toLowerCase();
  return isLocale(normalized) ? normalized : defaultLocale;
}
