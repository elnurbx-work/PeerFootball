import { notFound, redirect } from "next/navigation";
import { FriendButton } from "@/components/friends/FriendButton";
import { ProfileSummary } from "@/components/profile/profile-summary";
import { getCurrentUser } from "@/lib/auth";
import { getFriendshipStatusForUsers } from "@/server/queries/friendship.queries";
import { getProfileSummaryBySlug } from "@/server/queries/profile.queries";

type UserProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const { username } = await params;
  const result = await getProfileSummaryBySlug(decodeURIComponent(username));

  if (!result?.profile) {
    notFound();
  }

  const { profile, canonicalUsername } = result;

  if (!canonicalUsername) {
    notFound();
  }

  if (username !== canonicalUsername) {
    redirect(`/profile/${canonicalUsername}`);
  }

  const friendshipStatus =
    currentUser.id === profile.id ? undefined : await getFriendshipStatusForUsers(currentUser.id, profile.id);

  return (
    <section className="mx-auto grid max-w-5xl gap-5 px-4 py-10">
      <ProfileSummary
        action={
          friendshipStatus ? (
            <FriendButton
              targetUserId={profile.id}
              initialState={friendshipStatus.state}
              friendshipId={friendshipStatus.friendshipId}
            />
          ) : undefined
        }
        user={profile}
      />
    </section>
  );
}
