"use server";

import { postSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types/api.types";

export async function createPostAction(formData: FormData): Promise<ApiResponse> {
  const result = postSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { ok: false, message: "Post details are invalid.", issues: result.error.flatten().fieldErrors };
  }

  return { ok: true, message: "Post validation passed.", data: result.data };
}
