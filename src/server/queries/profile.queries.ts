import "server-only";

import { prisma } from "@/lib/prisma";

const profileSummarySelect = {
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
} as const;

type ProfileSummaryRecord = Awaited<ReturnType<typeof findProfileSummaryByUserId>>;

function toProfileSummary(profile: NonNullable<ProfileSummaryRecord>) {
  if (!profile.email) {
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

async function findProfileSummaryByUserId(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: profileSummarySelect
  });
}

async function findProfileSummaryByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: profileSummarySelect
  });
}

export async function getProfileSummaryByUserId(userId: string) {
  const profile = await findProfileSummaryByUserId(userId);

  if (!profile) {
    return null;
  }

  return toProfileSummary(profile);
}

export async function getProfileSummaryByUsername(username: string) {
  const profile = await findProfileSummaryByUsername(username);

  if (!profile) {
    return null;
  }

  return toProfileSummary(profile);
}

export async function getProfileSummaryBySlug(slug: string) {
  const profileByUsername = await findProfileSummaryByUsername(slug);

  if (profileByUsername) {
    return {
      profile: toProfileSummary(profileByUsername),
      canonicalUsername: profileByUsername.username
    };
  }

  const profileById = await findProfileSummaryByUserId(slug);

  if (!profileById) {
    return null;
  }

  return {
    profile: toProfileSummary(profileById),
    canonicalUsername: profileById.username
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
