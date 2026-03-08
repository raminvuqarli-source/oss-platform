import * as Sentry from "@sentry/node";
import { logger } from "./logger";

const sentryLog = logger.child({ module: "sentry" });

const isProduction = process.env.NODE_ENV === "production";
const dsn = process.env.SENTRY_DSN;

let initialized = false;

export function initSentry(): void {
  if (!isProduction) {
    sentryLog.info("Sentry disabled (non-production environment)");
    return;
  }

  if (!dsn) {
    sentryLog.warn("SENTRY_DSN not set — error monitoring disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    integrations: [
      Sentry.onUnhandledRejectionIntegration({ mode: "capture" as any }),
      Sentry.onUncaughtExceptionIntegration(),
    ],
  });

  initialized = true;
  sentryLog.info("Sentry initialized");
}

export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>,
): void {
  if (!initialized) return;

  if (context) {
    Sentry.withScope((scope) => {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

export function setupSentryRequestHandler(app: import("express").Express): void {
  if (!initialized) return;
  Sentry.setupExpressErrorHandler(app);
}

export async function flushSentry(timeout = 2000): Promise<void> {
  if (!initialized) return;
  await Sentry.flush(timeout);
}
