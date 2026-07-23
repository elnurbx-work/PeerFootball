import "server-only";

import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types/auth.types";
import type { FriendshipStatusResult } from "@/types/friendship.types";
import { toLocale } from "@/i18n/config";
import { measureAsync } from "@/lib/performance";
import { PAGINATION_LIMITS, toNumberedPage, type NumberedPage } from "@/lib/pagination";

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
      locale: true,
      isBanned: true
    }
  });

  if (!user?.email || user.isBanned) {
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

export async function searchPlayersForUser(currentUserId: string, rawQuery: string, page = 1): Promise<NumberedPage<PlayerSearchResult>> {
  const query = rawQuery.trim().replace(/\s+/g, " ");
  const pageSize = PAGINATION_LIMITS.search;
  const normalizedPage = Math.max(1, Math.trunc(page));

  if (query.length < 2) {
    return toNumberedPage([], normalizedPage, pageSize, 0);
  }

  const totalMetadata = { route: "/search", playerCount: 0, friendshipQueryCount: 0, searchTermLength: query.length };

  return measureAsync("search.total", async () => {
    const playersMetadata = { route: "/search", playerCount: 0, searchTermLength: query.length };
    const where = {
      id: { not: currentUserId },
      email: { not: null },
      NOT: [
        { blockedUsers: { some: { blockedId: currentUserId } } },
        { blockedByUsers: { some: { blockerId: currentUserId } } }
      ],
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { username: { contains: query, mode: "insensitive" as const } },
        { location: { contains: query, mode: "insensitive" as const } },
        { favoriteClub: { contains: query, mode: "insensitive" as const } },
        { preferredPosition: { contains: query, mode: "insensitive" as const } }
      ]
    };
    const [players, totalItems] = await measureAsync("search.players", () => Promise.all([
      prisma.user.findMany({
        where,
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
        orderBy: [{ name: "asc" }, { username: "asc" }, { id: "asc" }],
        skip: (normalizedPage - 1) * pageSize,
        take: pageSize
      }),
      prisma.user.count({ where })
    ]).then((result) => {
      playersMetadata.playerCount = result[0].length;
      return result;
    }), playersMetadata);

    totalMetadata.playerCount = players.length;
    totalMetadata.friendshipQueryCount = players.length ? 1 : 0;
    const friendshipsMetadata = {
      route: "/search",
      playerCount: players.length,
      friendshipQueryCount: players.length ? 1 : 0,
      searchTermLength: query.length
    };
    const playerIds = players.map((player) => player.id);
    const friendships = playerIds.length
      ? await measureAsync("search.friendships.total", () => prisma.friendship.findMany({
          where: {
            OR: [
              { requesterId: currentUserId, addresseeId: { in: playerIds } },
              { requesterId: { in: playerIds }, addresseeId: currentUserId }
            ]
          }
        }), friendshipsMetadata)
      : [];
    const friendshipByPlayerId = new Map(friendships.map((friendship) => [
      friendship.requesterId === currentUserId ? friendship.addresseeId : friendship.requesterId,
      friendship
    ]));
    const items = players.map((player): PlayerSearchResult => ({
      ...player,
      friendship: toFriendshipStatus(friendshipByPlayerId.get(player.id), currentUserId)
    }));
    return toNumberedPage(items, normalizedPage, pageSize, totalItems);
  }, totalMetadata);
}

function toFriendshipStatus(
  friendship: { id: string; requesterId: string; addresseeId: string; status: "PENDING" | "ACCEPTED" | "DECLINED" | "BLOCKED" } | undefined,
  currentUserId: string
): FriendshipStatusResult {
  if (!friendship || friendship.status === "DECLINED") return { state: "ADD_FRIEND" };
  if (friendship.status === "BLOCKED") return { state: "BLOCKED", friendshipId: friendship.id };
  if (friendship.status === "ACCEPTED") return { state: "FRIENDS", friendshipId: friendship.id };
  return friendship.addresseeId === currentUserId
    ? { state: "RESPOND", friendshipId: friendship.id, direction: "INCOMING" }
    : { state: "REQUEST_SENT", friendshipId: friendship.id, direction: "OUTGOING" };
}
