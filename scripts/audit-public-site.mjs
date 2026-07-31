const baseUrl = (process.argv[2] || process.env.SITE_AUDIT_URL || "http://localhost:3000").replace(/\/$/, "");
const routes = [
  "/", "/about", "/how-it-works", "/players", "/teams", "/matches", "/pitches",
  "/guides", "/contact", "/help", "/community-guidelines", "/safety", "/privacy",
  "/terms", "/cookie-policy", "/robots.txt", "/sitemap.xml", "/ads.txt"
];

let failures = 0;
for (const route of routes) {
  try {
    const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
    const body = await response.text();
    const isDocument = !route.endsWith(".txt") && !route.endsWith(".xml");
    const checks = isDocument ? {
      title: /<title>[^<]{3,}<\/title>/i.test(body),
      description: /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,}/i.test(body)
        || /<meta[^>]+content=["'][^"']{20,}["'][^>]+name=["']description["']/i.test(body),
      h1: /<h1[\s>]/i.test(body),
      canonical: /<link[^>]+rel=["']canonical["']/i.test(body),
      brand: body.includes("PeerFootball") && !body.includes("FanPitch")
    } : {};
    const failedChecks = Object.entries(checks).filter(([, value]) => !value).map(([name]) => name);
    const okay = response.status === 200 && failedChecks.length === 0;
    if (!okay) failures += 1;
    console.info(`${okay ? "PASS" : "FAIL"} ${route} ${response.status}${failedChecks.length ? ` missing:${failedChecks.join(",")}` : ""}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${route}`, error instanceof Error ? error.message : error);
  }
}
if (failures) {
  console.error(`${failures} route audit failure(s).`);
  process.exitCode = 1;
} else {
  console.info("All public route checks passed.");
}
