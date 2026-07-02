import "server-only";

import { prisma } from "@/lib/prisma";

export async function getMatchById(matchId: string) {
  return prisma.match.findUnique({
    where: { id: matchId }
  });
}
