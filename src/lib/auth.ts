import { cache } from "react";
import type { SessionUser } from "@/types/auth.types";
import { auth } from "@/auth";
import { getSessionUserById } from "@/server/queries/user.queries";

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return null;
    }

    return getSessionUserById(userId);
  } catch {
    return null;
  }
});
