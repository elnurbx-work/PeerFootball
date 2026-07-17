import type { Locale } from "@/i18n/config";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  username?: string | null;
  locale: Locale;
};
