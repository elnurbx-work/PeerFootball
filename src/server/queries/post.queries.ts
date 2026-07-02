import "server-only";

import { prisma } from "@/lib/prisma";

export async function getPostVisibilityById(postId: string) {
  return prisma.post.findUnique({
    where: { id: postId },
    select: {
      authorId: true,
      visibility: true
    }
  });
}
