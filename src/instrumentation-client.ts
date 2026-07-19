import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
  sendDefaultPii: false
});

// Required by the Next.js SDK; no performance events are sent without a trace sample rate.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
