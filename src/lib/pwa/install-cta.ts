import { isAppleMobilePlatform, type Platform } from "./device-detection";

export type PwaCtaMode = "loading" | "installed" | "native" | "ios-manual" | "none";

export function getPwaCtaMode({
  isReady,
  isInstalled,
  isInstallable,
  platform
}: {
  isReady: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  platform: Platform;
}): PwaCtaMode {
  if (!isReady) return "loading";
  if (isInstalled) return "installed";
  if (isAppleMobilePlatform(platform)) return "ios-manual";
  if (isInstallable) return "native";
  return "none";
}
