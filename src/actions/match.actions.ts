"use server";

import { matchSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types/api.types";

export async function createMatchAction(formData: FormData): Promise<ApiResponse> {
  const result = matchSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { ok: false, message: "Match details are invalid.", issues: result.error.flatten().fieldErrors };
  }

  return { ok: true, message: "Match validation passed.", data: result.data };
}
