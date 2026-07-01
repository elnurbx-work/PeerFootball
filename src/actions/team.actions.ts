"use server";

import { teamSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types/api.types";

export async function createTeamAction(formData: FormData): Promise<ApiResponse> {
  const result = teamSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { ok: false, message: "Team details are invalid.", issues: result.error.flatten().fieldErrors };
  }

  return { ok: true, message: "Team validation passed.", data: result.data };
}
