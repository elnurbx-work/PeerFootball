const DEFAULT_FEED_INTERVAL = 2;
const DEFAULT_MAXIMUM_FEED_ADS = 5;

export type AdSenseEnvironment = {
  enabled?: string;
  clientId?: string;
  feedSlot?: string;
  feedLayoutKey?: string;
  feedInterval?: string;
  maximumFeedAds?: string;
};

function normalizeOptionalValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function parseInteger(
  value: string | undefined,
  fallback: number,
  isValid: (value: number) => boolean
) {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && isValid(parsed) ? parsed : fallback;
}

export function createAdSenseConfig(environment: AdSenseEnvironment) {
  const clientId = normalizeOptionalValue(environment.clientId);
  const feedSlot = normalizeOptionalValue(environment.feedSlot);
  const feedLayoutKey = normalizeOptionalValue(environment.feedLayoutKey);
  const requestedEnabled = environment.enabled === "true";
  const hasValidClientId = clientId ? /^ca-pub-\d+$/.test(clientId) : false;
  const hasValidFeedSlot = feedSlot ? /^\d+$/.test(feedSlot) : false;
  const diagnostics: string[] = [];

  if (!requestedEnabled) {
    diagnostics.push("Disabled: NEXT_PUBLIC_ADSENSE_ENABLED is not true");
  }
  if (!clientId) {
    diagnostics.push("Missing NEXT_PUBLIC_ADSENSE_CLIENT_ID");
  } else if (!hasValidClientId) {
    diagnostics.push("Invalid NEXT_PUBLIC_ADSENSE_CLIENT_ID (expected ca-pub- followed by digits)");
  }
  if (!feedSlot) {
    diagnostics.push("Missing NEXT_PUBLIC_ADSENSE_FEED_SLOT");
  } else if (!hasValidFeedSlot) {
    diagnostics.push("Invalid NEXT_PUBLIC_ADSENSE_FEED_SLOT (expected digits only)");
  }
  if (!feedLayoutKey) {
    diagnostics.push("Missing NEXT_PUBLIC_ADSENSE_FEED_LAYOUT_KEY");
  }

  const feedInterval = parseInteger(
    environment.feedInterval,
    DEFAULT_FEED_INTERVAL,
    (value) => value >= 1
  );
  const maximumFeedAds = parseInteger(
    environment.maximumFeedAds,
    DEFAULT_MAXIMUM_FEED_ADS,
    (value) => value >= 0
  );

  if (environment.feedInterval?.trim() && feedInterval !== Number(environment.feedInterval)) {
    diagnostics.push(
      `Invalid NEXT_PUBLIC_ADSENSE_FEED_INTERVAL (using ${DEFAULT_FEED_INTERVAL})`
    );
  }
  if (
    environment.maximumFeedAds?.trim() &&
    maximumFeedAds !== Number(environment.maximumFeedAds)
  ) {
    diagnostics.push(
      `Invalid NEXT_PUBLIC_ADSENSE_MAX_FEED_ADS (using ${DEFAULT_MAXIMUM_FEED_ADS})`
    );
  }

  return Object.freeze({
    enabled: requestedEnabled && hasValidClientId && hasValidFeedSlot && Boolean(feedLayoutKey),
    requestedEnabled,
    clientId,
    feedSlot,
    feedLayoutKey,
    feedInterval,
    maximumFeedAds,
    diagnostics: Object.freeze(diagnostics)
  });
}

// Keep these as direct property reads: Next.js replaces NEXT_PUBLIC_* values at build time.
export const adsenseConfig = createAdSenseConfig({
  enabled: process.env.NEXT_PUBLIC_ADSENSE_ENABLED,
  clientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
  feedSlot: process.env.NEXT_PUBLIC_ADSENSE_FEED_SLOT,
  feedLayoutKey: process.env.NEXT_PUBLIC_ADSENSE_FEED_LAYOUT_KEY,
  feedInterval: process.env.NEXT_PUBLIC_ADSENSE_FEED_INTERVAL,
  maximumFeedAds: process.env.NEXT_PUBLIC_ADSENSE_MAX_FEED_ADS
});

export type AdSenseConfig = typeof adsenseConfig;
