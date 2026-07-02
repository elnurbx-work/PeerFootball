import "server-only";

import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export function createAuthPrismaAdapter() {
  return PrismaAdapter(prisma);
}

async function buildUniqueUsername(user: { id: string; email?: string | null; name?: string | null }) {
  const source = user.email?.split("@")[0] || user.name || "fanpitch";
  const base = source
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
  const fallback = base.length >= 3 ? base : `player${user.id.slice(0, 6)}`;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const suffix = attempt === 0 ? "" : `_${Math.random().toString(36).slice(2, 6)}`;
    const username = `${fallback}${suffix}`.slice(0, 32);
    const existing = await prisma.user.findUnique({ where: { username } });

    if (!existing || existing.id === user.id) {
      return username;
    }
  }

  return `player_${user.id.slice(0, 10)}`;
}

export async function ensureUsername(user: { id?: string; email?: string | null; name?: string | null }) {
  if (!user.id) {
    return;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, username: true }
  });

  if (!dbUser || dbUser.username) {
    return;
  }

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { username: await buildUniqueUsername(dbUser) }
  });
}
