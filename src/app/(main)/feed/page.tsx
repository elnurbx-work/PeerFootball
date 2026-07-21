import Link from "next/link";
import { PenSquare } from "lucide-react";
import { PostCard } from "@/components/posts/post-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getCommentsForPosts, getFeedPosts } from "@/server/queries/post.queries";
import { createTranslator } from "@/i18n/dictionary";
import { getRequestLocale } from "@/i18n/server";
import { Fragment } from "react";
import { InFeedAdCard } from "@/components/ads/in-feed-ad-card";
import { adsenseConfig } from "@/config/adsense";
import { getFeedAdPostIndexes } from "@/lib/ads/feed-placement";

export default async function FeedPage() {
  const currentUser = await getCurrentUser();
  const t = createTranslator(currentUser?.locale ?? await getRequestLocale());

  const posts = await getFeedPosts(currentUser?.id);
  const commentsByPostId = await getCommentsForPosts(posts, currentUser?.id);
  const adPostIndexes = new Set(
    getFeedAdPostIndexes({
      enabled: adsenseConfig.enabled,
      postCount: posts.length,
      interval: adsenseConfig.feedInterval,
      maximumAds: adsenseConfig.maximumFeedAds
    })
  );

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
      {posts.length ? (
        posts.map((post, postIndex) => (
          <Fragment key={post.id}>
            <PostCard
              post={post}
              comments={commentsByPostId.get(post.id) ?? []}
              isAuthenticated={Boolean(currentUser)}
            />
            {adPostIndexes.has(postIndex) ? (
              <InFeedAdCard key={`adsense-feed-after-${post.id}`} />
            ) : null}
          </Fragment>
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
