import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Sentry DSNs are public; expose the same value to the browser bundle.
    NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate"
          },
          {
            key: "Service-Worker-Allowed",
            value: "/"
          }
        ]
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json"
          }
        ]
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0, must-revalidate"
          }
        ]
      },
      {
        source: "/auth/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0, must-revalidate"
          }
        ]
      }
    ];
  }
};

export default withSentryConfig(nextConfig, {
  silent: true,
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: true
  }
});
