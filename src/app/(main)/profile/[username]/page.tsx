import { notFound, redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { FriendButton } from "@/components/friends/FriendButton";
import { PaginatedPostList } from "@/components/posts/paginated-post-list";
import { ProfileSummary } from "@/components/profile/profile-summary";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getFriendshipStatusForUsers } from "@/server/queries/friendship.queries";
import { getProfilePostsPage } from "@/server/queries/post.queries";
import { getProfileSummaryBySlug } from "@/server/queries/profile.queries";
import { canViewProfile } from "@/server/services/privacy.service";
import { createTranslator, type Translate } from "@/i18n/dictionary";
import { logPerformance, measureAsync, performanceNow } from "@/lib/performance";
import { PostListSkeleton } from "@/components/skeletons";

type UserProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const totalStartedAt = performanceNow();
  const currentUser = await measureAsync("profile.currentUser", getCurrentUser, {
    route: "/profile/[username]",
    isOwnProfile: false
  });

  if (!currentUser) {
    redirect("/auth/login");
  }
  const t = createTranslator(currentUser.locale);

  const { username } = await params;
  const result = await measureAsync(
    "profile.user",
    () => getProfileSummaryBySlug(decodeURIComponent(username)),
    { route: "/profile/[username]", isOwnProfile: false }
  );

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

  const isOwnProfile = currentUser.id === profile.id;
  const accessStartedAt = performanceNow();
  const friendshipStatus =
    isOwnProfile ? undefined : await getFriendshipStatusForUsers(currentUser.id, profile.id);
  const canView = await canViewProfile(currentUser.id, profile.id);
  logPerformance("profile.access", performanceNow() - accessStartedAt, "success", {
    route: "/profile/[username]",
    isOwnProfile
  });

  if (!canView) {
    logPerformance("profile.totalData", performanceNow() - totalStartedAt, "success", {
      route: "/profile/[username]",
      postCount: 0,
      rootCommentCount: 0,
      replyCount: 0,
      isOwnProfile
    });
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
        <Suspense fallback={<PostListSkeleton count={2} />}>
          <UserProfilePosts
            currentUserId={currentUser.id}
            isOwnProfile={isOwnProfile}
            profileUserId={profile.id}
            startedAt={totalStartedAt}
            t={t}
          />
        </Suspense>
      </div>
    </section>
  );
}

async function UserProfilePosts({
  currentUserId,
  isOwnProfile,
  profileUserId,
  startedAt,
  t
}: {
  currentUserId: string;
  isOwnProfile: boolean;
  profileUserId: string;
  startedAt: number;
  t: Translate;
}) {
  const page = await measureAsync(
    "profile.postsWithComments",
    () => getProfilePostsPage(profileUserId, currentUserId),
    { route: "/profile/[username]", isOwnProfile }
  );
  const rootCommentCount = page.items.reduce((count, item) => count + item.comments.length, 0);
  const replyCount = page.items.reduce(
    (count, item) => count + item.comments.reduce((sum, comment) => sum + comment.replies.length, 0),
    0
  );
  logPerformance("profile.totalData", performanceNow() - startedAt, "success", {
    route: "/profile/[username]",
    postCount: page.items.length,
    rootCommentCount,
    replyCount,
    isOwnProfile
  });

  if (!page.items.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          {t("profile.pages.noPosts")}
        </CardContent>
      </Card>
    );
  }

  return (
    <PaginatedPostList
      initialPage={page}
      mode="profile"
      profileUserId={profileUserId}
    />
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
