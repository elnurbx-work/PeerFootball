import "server-only";

import { prisma } from "@/lib/prisma";
import { getFriendshipStatusForUsers } from "@/server/queries/friendship.queries";
import type { SessionUser } from "@/types/auth.types";
import type { FriendshipStatusResult } from "@/types/friendship.types";
import { toLocale } from "@/i18n/config";

export type PlayerSearchResult = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  bio: string | null;
  favoriteClub: string | null;
  preferredPosition: string | null;
  location: string | null;
  friendship: FriendshipStatusResult;
};

export async function getSessionUserById(userId: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      username: true,
      locale: true
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
    username: user.username,
    locale: toLocale(user.locale)
  };
}

export async function userExistsById(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  return Boolean(user);
}

export async function searchPlayersForUser(currentUserId: string, rawQuery: string): Promise<PlayerSearchResult[]> {
  const query = rawQuery.trim().replace(/\s+/g, " ");

  if (query.length < 2) {
    return [];
  }

  const players = await prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      email: { not: null },
      NOT: [
        {
          blockedUsers: {
            some: {
              blockedId: currentUserId
            }
          }
        },
        {
          blockedByUsers: {
            some: {
              blockerId: currentUserId
            }
          }
        }
      ],
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
        { favoriteClub: { contains: query, mode: "insensitive" } },
        { preferredPosition: { contains: query, mode: "insensitive" } }
      ]
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      favoriteClub: true,
      preferredPosition: true,
      location: true
    },
    orderBy: [{ name: "asc" }, { username: "asc" }],
    take: 12
  });

  return Promise.all(
    players.map(async (player) => ({
      ...player,
      friendship: await getFriendshipStatusForUsers(currentUserId, player.id)
    }))
  );
}
