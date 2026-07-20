const feedRoute = /^\/feed\/?$/;

export function isAdSenseRoute(pathname: string) {
  return feedRoute.test(pathname);
}
