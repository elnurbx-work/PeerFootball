import Link from "next/link";
import { PenSquare } from "lucide-react";
import { Suspense } from "react";
import { PaginatedPostList } from "@/components/posts/paginated-post-list";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getFeedPostsPage } from "@/server/queries/post.queries";
import { createTranslator } from "@/i18n/dictionary";
import { getRequestLocale } from "@/i18n/server";
import { logPerformance, measureAsync, performanceNow } from "@/lib/performance";
import { PostListSkeleton } from "@/components/skeletons";
import type { Translate } from "@/i18n/dictionary";

export default async function FeedPage() {
  const totalStartedAt = performanceNow();
  const currentUser = await measureAsync("feed.currentUser", getCurrentUser, { route: "/feed" });
  const t = createTranslator(currentUser?.locale ?? await getRequestLocale());

  return (
    <section className="mx-auto grid max-w-3xl gap-5 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">{t("posts.pages.feed.title")}</h1>
        {currentUser ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("posts.pages.feed.signedIn", { name: currentUser.name ?? t("profile.summary.playerFallback"), username: currentUser.username ?? t("profile.summary.profileFallback") })}
          </p>
        ) : null}
      </div>
      <Suspense fallback={<PostListSkeleton count={3} />}>
        <FeedContent
          currentUserId={currentUser?.id}
          isAuthenticated={Boolean(currentUser)}
          startedAt={totalStartedAt}
          t={t}
        />
      </Suspense>
    </section>
  );
}

async function FeedContent({
  currentUserId,
  isAuthenticated,
  startedAt,
  t
}: {
  currentUserId?: string;
  isAuthenticated: boolean;
  startedAt: number;
  t: Translate;
}) {
  const metadata = { route: "/feed", postCount: 0 };
  const page = await measureAsync("feed.posts", async () => {
    const result = await getFeedPostsPage(currentUserId);
    metadata.postCount = result.items.length;
    return result;
  }, metadata);
  const commentsStartedAt = performanceNow();
  const commentCount = page.items.reduce((count, item) => count + item.comments.length, 0);
  logPerformance("feed.comments", performanceNow() - commentsStartedAt, "success", {
    route: "/feed",
    postCount: page.items.length,
    commentCount
  });
  logPerformance("feed.totalData", performanceNow() - startedAt, "success", {
    route: "/feed",
    postCount: page.items.length,
    commentCount
  });

  if (!page.items.length) {
    return (
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
    );
  }

  return (
    <PaginatedPostList
      initialPage={page}
      isAuthenticated={isAuthenticated}
      mode="feed"
    />
  );
}
