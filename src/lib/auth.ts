import type { SessionUser } from "@/types/auth.types";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      username: true
    }
  });

  if (!user?.email) {
    return null;
  }

  return {
    id: user.id,
    name: user.name ?? "FanPitch Player",
    email: user.email,
    image: user.image,
    username: user.username
  };
}
