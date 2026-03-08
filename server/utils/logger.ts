import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "password",
      "req.headers.authorization",
      "req.headers.cookie",
      "token",
      "sessionSecret",
      "EPOINT_PRIVATE_KEY",
      "EPOINT_PUBLIC_KEY",
      "EPOINT_MERCHANT_ID",
      "privateKey",
      "publicKey",
      "secret",
      "signature",
      "*.password",
      "*.token",
      "*.secret",
    ],
    censor: "[REDACTED]",
  },
  ...(isDevelopment
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});

export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
