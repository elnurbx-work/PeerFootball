import { notFound, redirect } from "next/navigation";
import { FriendButton } from "@/components/friends/FriendButton";
import { ProfileSummary } from "@/components/profile/profile-summary";
import { getCurrentUser } from "@/lib/auth";
import { getFriendshipStatusForUsers } from "@/server/queries/friendship.queries";
import { getProfileSummaryByUserId } from "@/server/queries/profile.queries";

type UserProfilePageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const { userId } = await params;

  const profile = await getProfileSummaryByUserId(userId);

  if (!profile) {
    notFound();
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
