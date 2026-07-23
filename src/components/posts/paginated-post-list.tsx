"use client";

import { Fragment, useState, useTransition } from "react";
import {
  loadFeedPostsAction,
  loadProfilePostsAction
} from "@/actions/pagination.actions";
import { InFeedAdCard } from "@/components/ads/in-feed-ad-card";
import { LoadMoreButton } from "@/components/pagination/load-more-button";
import { PaginationStatus } from "@/components/pagination/pagination-status";
import { PostCard } from "@/components/posts/post-card";
import { adsenseConfig } from "@/config/adsense";
import { getFeedAdPostIndexes } from "@/lib/ads/feed-placement";
import type { CursorPage } from "@/lib/pagination";
import type { PostPageItem } from "@/types/post.types";

type PaginatedPostListProps = {
  initialPage: CursorPage<PostPageItem>;
  isAuthenticated?: boolean;
  mode: "feed" | "profile";
  profileUserId?: string;
};

export function PaginatedPostList({
  initialPage,
  isAuthenticated = true,
  mode,
  profileUserId
}: PaginatedPostListProps) {
  const [items, setItems] = useState(initialPage.items);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const adPostIndexes = new Set(
    mode === "feed"
      ? getFeedAdPostIndexes({
          enabled: adsenseConfig.enabled,
          postCount: items.length,
          interval: adsenseConfig.feedInterval,
          maximumAds: adsenseConfig.maximumFeedAds
        })
      : []
  );

  function loadMore() {
    if (!nextCursor || pending) return;
    setError(null);

    startTransition(async () => {
      const result = mode === "profile" && profileUserId
        ? await loadProfilePostsAction(profileUserId, nextCursor)
        : await loadFeedPostsAction(nextCursor);

      if (!result.ok || !result.data) {
        setError(result.message);
        return;
      }

      setItems((current) => {
        const knownIds = new Set(current.map((item) => item.id));
        return [...current, ...result.data!.items.filter((item) => !knownIds.has(item.id))];
      });
      setNextCursor(result.data.nextCursor);
      setHasMore(result.data.hasMore);
    });
  }

  return (
    <div className="grid gap-5">
      {items.map((item, index) => (
        <Fragment key={item.id}>
          <PostCard
            post={item.post}
            comments={item.comments}
            isAuthenticated={isAuthenticated}
          />
          {adPostIndexes.has(index) ? <InFeedAdCard /> : null}
        </Fragment>
      ))}
      <PaginationStatus itemCount={items.length} hasMore={hasMore} />
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <LoadMoreButton hasMore={hasMore} pending={pending} onClick={loadMore} />
    </div>
  );
}
