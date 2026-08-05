export type Platform =
  | "android"
  | "ios"
  | "ipados"
  | "windows"
  | "macos"
  | "linux"
  | "unknown";

export type Browser =
  | "chrome"
  | "edge"
  | "samsung"
  | "safari"
  | "firefox"
  | "opera"
  | "unknown";

export type DeviceInfo = {
  platform: Platform;
  browser: Browser;
};

export type NavigatorLike = Pick<Navigator, "userAgent" | "platform" | "maxTouchPoints">;

export function detectDevice(navigatorLike?: NavigatorLike): DeviceInfo {
  const source = navigatorLike ?? (typeof navigator === "undefined" ? undefined : navigator);

  if (!source) {
    return { platform: "unknown", browser: "unknown" };
  }

  return {
    platform: detectPlatform(source),
    browser: detectBrowser(source.userAgent)
  };
}

export function detectPlatform(source: NavigatorLike): Platform {
  const userAgent = source.userAgent.toLowerCase();
  const platform = source.platform.toLowerCase();
  const isIPadOS = platform === "macintel" && source.maxTouchPoints > 1;

  if (isIPadOS || /ipad/.test(userAgent)) return "ipados";
  if (/iphone|ipod/.test(userAgent)) return "ios";
  if (/android/.test(userAgent)) return "android";
  if (/win/.test(platform) || /windows/.test(userAgent)) return "windows";
  if (/mac/.test(platform) || /macintosh|mac os x/.test(userAgent)) return "macos";
  if (/linux/.test(platform) || /linux/.test(userAgent)) return "linux";
  return "unknown";
}

export function detectBrowser(userAgent: string): Browser {
  const value = userAgent.toLowerCase();

  if (/samsungbrowser/.test(value)) return "samsung";
  if (/edg(?:e|a|ios)?\//.test(value)) return "edge";
  if (/opr\//.test(value) || /opera/.test(value)) return "opera";
  if (/crios\//.test(value) || /chrome\//.test(value) || /chromium\//.test(value)) return "chrome";
  if (/fxios\//.test(value) || /firefox\//.test(value)) return "firefox";
  if (/safari\//.test(value) && !/android/.test(value)) return "safari";
  return "unknown";
}

export function isAppleMobilePlatform(platform: Platform) {
  return platform === "ios" || platform === "ipados";
}
