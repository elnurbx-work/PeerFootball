import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { FriendButton } from "@/components/friends/FriendButton";
import { PostCard } from "@/components/posts/post-card";
import { ProfileSummary } from "@/components/profile/profile-summary";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getFriendshipStatusForUsers } from "@/server/queries/friendship.queries";
import { getProfilePostsWithComments } from "@/server/queries/post.queries";
import { getProfileSummaryBySlug } from "@/server/queries/profile.queries";
import { canViewProfile } from "@/server/services/privacy.service";
import { createTranslator, type Translate } from "@/i18n/dictionary";

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
  const t = createTranslator(currentUser.locale);

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
  const canView = await canViewProfile(currentUser.id, profile.id);

  if (!canView) {
    return (
      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-10">
        <PrivateProfileNotice
          action={
            friendshipStatus ? (
              <FriendButton
                targetUserId={profile.id}
                initialState={friendshipStatus.state}
                friendshipId={friendshipStatus.friendshipId}
              />
            ) : undefined
          }
          image={profile.image}
          name={profile.name}
          username={profile.username}
          t={t}
        />
      </section>
    );
  }

  const { posts, commentsByPostId } = await getProfilePostsWithComments(profile.id, currentUser.id);

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
      <div className="mx-auto grid w-full max-w-3xl gap-5">
        {posts.length ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} comments={commentsByPostId.get(post.id) ?? []} />
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {t("profile.pages.noPosts")}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

function PrivateProfileNotice({
  action,
  image,
  name,
  username
  , t
}: {
  action?: ReactNode;
  image: string | null;
  name: string | null;
  username: string | null;
  t: Translate;
}) {
  const displayName = name ?? t("profile.summary.playerFallback");

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : displayName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <h1 className="truncate text-xl font-bold">{displayName}</h1>
            </div>
            <p className="truncate text-sm text-muted-foreground">@{username ?? t("profile.summary.profileFallback")}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("profile.pages.privateDescription")}
            </p>
          </div>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
