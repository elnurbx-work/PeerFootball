import { PostComposer } from "@/components/posts/post-composer";
import { PostCard } from "@/components/posts/post-card";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

const samplePosts = [
  {
    id: "post-1",
    authorName: "Maya Santos",
    username: "mayawing",
    content: "Need two players for a 7-a-side match on Friday. Prefer one defender and one winger.",
    createdAt: "20 min ago",
    likes: 14,
    comments: 3
  },
  {
    id: "post-2",
    authorName: "Omar Aliyev",
    username: "omarpress",
    content: "Our team is looking for friendly matches next week. Midweek evenings work best.",
    createdAt: "1 hr ago",
    likes: 21,
    comments: 6
  }
];

export default async function FeedPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }

  return (
    <section className="mx-auto grid max-w-3xl gap-5 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">Feed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {currentUser.name} @{currentUser.username ?? "profile"}
        </p>
      </div>
      <PostComposer />
      {samplePosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </section>
  );
}
