import "server-only";

import { prisma } from "@/lib/prisma";

export async function getTeamById(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId }
  });
}
