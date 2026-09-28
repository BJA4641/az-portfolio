// Client-side error monitoring. Optional - the app works identically with
// no DSN set, Sentry just never initializes. Get a free DSN at sentry.io
// and set NEXT_PUBLIC_SENTRY_DSN to turn this on.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)
});
