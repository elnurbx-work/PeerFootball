import Link from "next/link";
import { PenSquare } from "lucide-react";
import { PostCard } from "@/components/posts/post-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getFeedPosts, getPostComments } from "@/server/queries/post.queries";
import { redirect } from "next/navigation";
import { createTranslator } from "@/i18n/dictionary";

export default async function FeedPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/auth/login");
  }
  const t = createTranslator(currentUser.locale);

  const posts = await getFeedPosts(currentUser.id);
  const commentsByPostId = new Map(
    await Promise.all(
      posts.map(async (post) => [post.id, await getPostComments(post.id, currentUser.id)] as const)
    )
  );

  return (
    <section className="mx-auto grid max-w-3xl gap-5 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">{t("posts.pages.feed.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("posts.pages.feed.signedIn", { name: currentUser.name ?? t("profile.summary.playerFallback"), username: currentUser.username ?? t("profile.summary.profileFallback") })}
        </p>
      </div>
      {posts.length ? (
        posts.map((post) => (
          <PostCard key={post.id} post={post} comments={commentsByPostId.get(post.id) ?? []} />
        ))
      ) : (
        <EmptyState
          icon={PenSquare}
          title={t("posts.pages.feed.emptyTitle")}
          description={t("posts.pages.feed.emptyDescription")}
          action={
            <Button asChild>
              <Link href="/create">{t("posts.pages.feed.create")}</Link>
            </Button>
          }
        />
      )}
    </section>
  );
}
