import type { ZodError } from "zod";
import type { MessageKey } from "@/i18n/config";
import type { Translate } from "@/i18n/dictionary";

export function localizedFieldErrors(
  error: ZodError,
  t: Translate
): Record<string, string[] | undefined> {
  return error.flatten((issue) => {
    if (issue.message.startsWith("validation.")) {
      return t(issue.message as MessageKey);
    }

    return t("responses.validation.invalidField");
  }).fieldErrors;
}
