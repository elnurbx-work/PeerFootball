import az from "@/locales/az.json";
import en from "@/locales/en.json";
import ru from "@/locales/ru.json";
import type { Locale, MessageKey } from "@/i18n/config";

const dictionaries = { az, en, ru };
export type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

export function createTranslator(locale: Locale): Translate {
  return (key, values) => {
    let message = getMessage(dictionaries[locale], key) ?? getMessage(az, key) ?? key;
    for (const [name, value] of Object.entries(values ?? {})) {
      message = message.replaceAll(`{${name}}`, String(value));
    }
    return message;
  };
}

function getMessage(dictionary: object, key: string) {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, dictionary);
  return typeof value === "string" ? value : undefined;
}
