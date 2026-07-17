"use server";

import { localizedFieldErrors } from "@/i18n/zod";

import { teamSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types/api.types";
import { getServerTranslator } from "@/i18n/server";

export async function createTeamAction(formData: FormData): Promise<ApiResponse> {
  const t = await getServerTranslator();
  const result = teamSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { ok: false, message: t("responses.team.invalid"), issues: localizedFieldErrors(result.error, t) };
  }

  return { ok: true, message: t("responses.team.valid"), data: result.data };
}
