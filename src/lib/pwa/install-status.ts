type InstallStatusEnvironment = {
  matchesStandalone: boolean;
  navigatorStandalone?: boolean;
  referrer?: string;
};

export function isInstalledEnvironment({
  matchesStandalone,
  navigatorStandalone,
  referrer = ""
}: InstallStatusEnvironment) {
  return (
    matchesStandalone ||
    navigatorStandalone === true ||
    referrer.startsWith("android-app://")
  );
}

export function isPwaInstalled() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return isInstalledEnvironment({
    matchesStandalone: window.matchMedia("(display-mode: standalone)").matches,
    navigatorStandalone: navigatorWithStandalone.standalone,
    referrer: document.referrer
  });
}
