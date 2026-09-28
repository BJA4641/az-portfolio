// Server/edge-side error monitoring. Same DSN as the client config -
// Sentry DSNs aren't secret (they end up in the browser bundle regardless),
// so one env var covers both. No DSN set -> Sentry stays fully disabled.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({ dsn, tracesSampleRate: 0.1, enabled: Boolean(dsn) });
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({ dsn, tracesSampleRate: 0.1, enabled: Boolean(dsn) });
  }
}

export const onRequestError = Sentry.captureRequestError;
