type FeedAdPlacementOptions = {
  enabled: boolean;
  postCount: number;
  interval: number;
  maximumAds: number;
};

/** Returns zero-based post indexes after which an ad should be rendered. */
export function getFeedAdPostIndexes({
  enabled,
  postCount,
  interval,
  maximumAds
}: FeedAdPlacementOptions) {
  if (!enabled || postCount < interval || interval < 1 || maximumAds < 1) {
    return [];
  }

  const adCount = Math.min(Math.floor(postCount / interval), maximumAds);
  return Array.from({ length: adCount }, (_, index) => (index + 1) * interval - 1);
}
