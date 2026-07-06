import { PostComposer } from "@/components/posts/post-composer";
import { PostCard } from "@/components/posts/post-card";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getFeedPosts, getPostComments } from "@/server/queries/post.queries";
import { redirect } from "next/navigation";

export default async function FeedPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  const posts = await getFeedPosts(currentUser.id);
  const commentsByPostId = new Map(
    await Promise.all(
      posts.map(async (post) => [post.id, await getPostComments(post.id, currentUser.id)] as const)
    )
  );

  return (
    <section className="mx-auto grid max-w-3xl gap-5 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">Home</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {currentUser.name} @{currentUser.username ?? "profile"}
        </p>
      </div>
      <PostComposer />
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
    </section>
  );
}
