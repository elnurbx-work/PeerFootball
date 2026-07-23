import Link from "next/link";
import { Inbox, Send, Users } from "lucide-react";
import { FriendsList } from "@/components/friends/FriendsList";
import { ProfileSummary } from "@/components/profile/profile-summary";
import { PaginatedPostList } from "@/components/posts/paginated-post-list";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getProfileSummaryByUserId } from "@/server/queries/profile.queries";
import {
  getFriendshipListsForUser
} from "@/server/queries/friendship.queries";
import { getProfilePostsPage } from "@/server/queries/post.queries";
import type { FriendshipWithUser } from "@/types/friendship.types";
import { redirect } from "next/navigation";
import { createTranslator, type Translate } from "@/i18n/dictionary";
import { logPerformance, measureAsync, performanceNow } from "@/lib/performance";
import { Suspense } from "react";
import { PostListSkeleton } from "@/components/skeletons";

export default async function ProfilePage() {
  const totalStartedAt = performanceNow();
  const currentUser = await measureAsync("profile.currentUser", getCurrentUser, {
    route: "/profile",
    isOwnProfile: true
  });

  if (!currentUser) {
    redirect("/auth/login");
  }
  const t = createTranslator(currentUser.locale);

  const [profile, friendshipLists] = await Promise.all([
    measureAsync("profile.user", () => getProfileSummaryByUserId(currentUser.id), {
      route: "/profile",
      isOwnProfile: true
    }),
    measureAsync("profile.access", () => getFriendshipListsForUser(currentUser.id), {
      route: "/profile",
      isOwnProfile: true
    })
  ]);

  if (!profile) {
    redirect("/auth/login");
  }
  const { friends, incoming: incomingRequests, outgoing: outgoingRequests } = friendshipLists;

  return (
    <section className="mx-auto grid max-w-5xl gap-5 px-4 py-10">
      <ProfileSummary
        user={profile}
      />
      <FriendRequestsPanel
        friendsCount={friends.length}
        incomingRequests={incomingRequests}
        outgoingRequests={outgoingRequests}
        t={t}
      />
      <div className="mx-auto grid w-full max-w-3xl gap-5">
        <Suspense fallback={<PostListSkeleton count={2} />}>
          <ProfilePosts
            currentUserId={currentUser.id}
            profileUserId={currentUser.id}
            startedAt={totalStartedAt}
            t={t}
          />
        </Suspense>
      </div>
    </section>
  );
}

async function ProfilePosts({
  currentUserId,
  profileUserId,
  startedAt,
  t
}: {
  currentUserId: string;
  profileUserId: string;
  startedAt: number;
  t: Translate;
}) {
  const page = await measureAsync(
    "profile.postsWithComments",
    () => getProfilePostsPage(profileUserId, currentUserId),
    { route: "/profile", isOwnProfile: true }
  );
  const rootCommentCount = page.items.reduce((count, item) => count + item.comments.length, 0);
  const replyCount = page.items.reduce(
    (count, item) => count + item.comments.reduce((sum, comment) => sum + comment.replies.length, 0),
    0
  );
  logPerformance("profile.totalData", performanceNow() - startedAt, "success", {
    route: "/profile",
    postCount: page.items.length,
    rootCommentCount,
    replyCount,
    isOwnProfile: true
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

function FriendRequestsPanel({
  friendsCount,
  incomingRequests,
  outgoingRequests
  , t
}: {
  friendsCount: number;
  incomingRequests: FriendshipWithUser[];
  outgoingRequests: FriendshipWithUser[];
  t: Translate;
}) {
  return (
    <section className="grid gap-5 rounded-md border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-primary" />
            {t("profile.pages.friendsTitle")}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("profile.pages.friendsDescription")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/friends?tab=friends">{t("profile.pages.friendCount", { count: friendsCount })}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/friends?tab=incoming">{t("profile.pages.openFriends")}</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="grid gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Inbox className="h-4 w-4 text-primary" />
            {t("profile.pages.incoming")}
          </div>
          <FriendsList
            items={incomingRequests}
            mode="incoming"
            emptyMessage={t("profile.pages.noIncoming")}
          />
        </section>

        <section className="grid gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Send className="h-4 w-4 text-primary" />
            {t("profile.pages.sent")}
          </div>
          <FriendsList
            items={outgoingRequests}
            mode="outgoing"
            emptyMessage={t("profile.pages.noSent")}
          />
        </section>
      </div>
    </section>
  );
}
