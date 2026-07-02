import "server-only";

import { prisma } from "@/lib/prisma";

export async function getProfileSummaryByUserId(userId: string) {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      username: true,
      bio: true,
      favoriteClub: true,
      preferredPosition: true,
      avoidedPosition: true,
      location: true,
      sentFriendRequests: {
        where: {
          status: "ACCEPTED"
        },
        select: {
          id: true
        }
      },
      receivedFriendRequests: {
        where: {
          status: "ACCEPTED"
        },
        select: {
          id: true
        }
      },
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true
        }
      },
      playerStats: {
        select: {
          matchesPlayed: true,
          goals: true,
          assists: true,
          preferredFoot: true
        }
      }
    }
  });

  if (!profile?.email) {
    return null;
  }

  return {
    id: profile.id,
    name: profile.name,
    username: profile.username,
    favoriteClub: profile.favoriteClub,
    preferredPosition: profile.preferredPosition,
    avoidedPosition: profile.avoidedPosition,
    location: profile.location,
    bio: profile.bio,
    social: {
      posts: profile._count.posts,
      followers: profile._count.followers,
      following: profile._count.following,
      friends: profile.sentFriendRequests.length + profile.receivedFriendRequests.length
    },
    stats: profile.playerStats
  };
}

export async function getEditableProfileByUserId(userId: string) {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      username: true,
      bio: true,
      favoriteClub: true,
      preferredPosition: true,
      avoidedPosition: true,
      location: true,
      playerStats: {
        select: {
          matchesPlayed: true,
          goals: true,
          assists: true,
          preferredFoot: true
        }
      }
    }
  });

  if (!profile?.email) {
    return null;
  }

  return {
    ...profile,
    name: profile.name ?? "",
    email: profile.email,
    username: profile.username ?? "",
    stats: profile.playerStats
  };
}
