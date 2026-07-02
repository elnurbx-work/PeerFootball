import { ProfileSummary } from "@/components/profile/profile-summary";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const profile = await prisma.user.findUnique({
    where: { id: currentUser.id },
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
      followers: {
        select: {
          followerId: true
        }
      },
      following: {
        select: {
          followingId: true
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
    redirect("/auth/login");
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-5 px-4 py-10">
      <ProfileSummary
        user={{
          ...profile,
          social: {
            posts: profile._count.posts,
            followers: profile._count.followers,
            following: profile._count.following,
            friends: getMutualFollowCount(profile.followers, profile.following)
          },
          stats: profile.playerStats
        }}
      />
    </section>
  );
}

function getMutualFollowCount(
  followers: Array<{ followerId: string }>,
  following: Array<{ followingId: string }>
) {
  const followerIds = new Set(followers.map((follow) => follow.followerId));

  return following.filter((follow) => followerIds.has(follow.followingId)).length;
}
