import { ProfileSummary } from "@/components/profile/profile-summary";
import { PostCard } from "@/components/posts/post-card";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getProfileSummaryByUserId } from "@/server/queries/profile.queries";
import { getPostComments, getProfilePosts } from "@/server/queries/post.queries";
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

  const posts = await getProfilePosts(profile.id, currentUser.id);
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
