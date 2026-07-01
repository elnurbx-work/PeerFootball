"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { profileSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types/api.types";

export async function updateProfileAction(_prevState: ApiResponse, formData: FormData): Promise<ApiResponse> {
  const result = profileSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return { ok: false, message: "Profile details are invalid.", issues: result.error.flatten().fieldErrors };
  }

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, message: "You need to sign in before editing your profile." };
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username: result.data.username },
    select: { id: true }
  });

  if (existingUsername && existingUsername.id !== userId) {
    return {
      ok: false,
      message: "That username is already taken.",
      issues: { username: ["Choose another username."] }
    };
  }

  const optional = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };

  const profile = await prisma.user.update({
    where: { id: userId },
    data: {
      name: result.data.name.trim(),
      username: result.data.username.trim(),
      bio: optional(result.data.bio),
      favoriteClub: optional(result.data.favoriteClub),
      preferredPosition: optional(result.data.preferredPosition),
      avoidedPosition: optional(result.data.avoidedPosition),
      location: optional(result.data.location)
    },
    select: { username: true }
  });

  revalidatePath("/profile");

  return { ok: true, message: "Profile saved.", data: profile };
}
