import Link from "next/link";
import { Inbox, Send, Users } from "lucide-react";
import { FriendsList } from "@/components/friends/FriendsList";
import { ProfileSummary } from "@/components/profile/profile-summary";
import { PostCard } from "@/components/posts/post-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getProfileSummaryByUserId } from "@/server/queries/profile.queries";
import {
  getFriendsForUser,
  getIncomingFriendRequestsForUser,
  getOutgoingFriendRequestsForUser
} from "@/server/queries/friendship.queries";
import { getPostComments, getProfilePosts } from "@/server/queries/post.queries";
import type { FriendshipWithUser } from "@/types/friendship.types";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const profile = await getProfileSummaryByUserId(currentUser.id);

  if (!profile) {
    redirect("/auth/login");
  }

  const [posts, friends, incomingRequests, outgoingRequests] = await Promise.all([
    getProfilePosts(profile.id, currentUser.id),
    getFriendsForUser(currentUser.id),
    getIncomingFriendRequestsForUser(currentUser.id),
    getOutgoingFriendRequestsForUser(currentUser.id)
  ]);
  const commentsByPostId = new Map(
    await Promise.all(
      posts.map(async (post) => [post.id, await getPostComments(post.id, currentUser.id)] as const)
    )
  );

  return (
    <section className="mx-auto grid max-w-5xl gap-5 px-4 py-10">
      <ProfileSummary
        user={profile}
      />
      <FriendRequestsPanel
        friendsCount={friends.length}
        incomingRequests={incomingRequests}
        outgoingRequests={outgoingRequests}
      />
      <div className="mx-auto grid w-full max-w-3xl gap-5">
        {posts.length ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} comments={commentsByPostId.get(post.id) ?? []} />
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No posts yet.
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

function FriendRequestsPanel({
  friendsCount,
  incomingRequests,
  outgoingRequests
}: {
  friendsCount: number;
  incomingRequests: FriendshipWithUser[];
  outgoingRequests: FriendshipWithUser[];
}) {
  return (
    <section className="grid gap-5 rounded-md border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-primary" />
            Friends and requests
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage friend requests from your profile on mobile.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/friends?tab=friends">{friendsCount} friends</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/friends?tab=incoming">Open friends</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="grid gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Inbox className="h-4 w-4 text-primary" />
            Incoming requests
          </div>
          <FriendsList
            items={incomingRequests}
            mode="incoming"
            emptyMessage="No incoming friend requests."
          />
        </section>

        <section className="grid gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Send className="h-4 w-4 text-primary" />
            Sent requests
          </div>
          <FriendsList
            items={outgoingRequests}
            mode="outgoing"
            emptyMessage="No sent friend requests."
          />
        </section>
      </div>
    </section>
  );
}
