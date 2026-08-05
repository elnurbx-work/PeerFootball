import { isAppleMobilePlatform, type Platform } from "./device-detection";

export type PwaCtaMode = "loading" | "installed" | "native" | "ios-manual" | "none";

export function getPwaCtaMode({
  isReady,
  isInstalled,
  canInstall,
  platform
}: {
  isReady: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  platform: Platform;
}): PwaCtaMode {
  if (!isReady) return "loading";
  if (isInstalled) return "installed";
  if (isAppleMobilePlatform(platform)) return "ios-manual";
  if (canInstall) return "native";
  return "none";
}
