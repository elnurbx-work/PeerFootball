const editorialRoute = /^\/guides\/[^/]+\/?$/;

export function isAdSenseRoute(pathname: string) {
  return editorialRoute.test(pathname);
}
