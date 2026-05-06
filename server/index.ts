import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import { registerRoutes } from "./routes/index";
import { serveStatic } from "./static";
import { createServer } from "http";
import { db, pool, checkDatabaseConnection } from "./db";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getJobQueue, stopJobQueue } from "./services/jobQueue";
import { registerBookingSyncWorker } from "./workers/bookingSyncWorker";
import { registerOtaSyncWorker } from "./workers/otaSyncWorker";
import { registerSubscriptionRenewalWorker } from "./workers/subscriptionRenewalWorker";
import { registerPaymentRetryWorker } from "./workers/paymentRetryWorker";
import { logger } from "./utils/logger";
import { initSentry, setupSentryRequestHandler, flushSentry } from "./utils/sentry";

const startupLog = logger.child({ module: "startup" });
const shutdownLog = logger.child({ module: "shutdown" });

initSentry();

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(pinoHttp({
  logger,
  genReqId: () => randomUUID(),
  autoLogging: {
    ignore: (req) => {
      const url = (req as any).url || "";
      return !url.startsWith("/api");
    },
  },
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
}));

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
}));

app.use(
  express.json({
    limit: "5mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "5mb" }));

app.use((err: any, req: any, res: any, next: any) => {
  if (err.type === "entity.too.large") {
    logger.warn({ method: req.method, url: req.url, contentLength: req.headers['content-length'] }, "Request body too large");
    return res.status(413).json({ message: "Request body too large" });
  }
  if (err.status === 400 && err.type === "entity.parse.failed") {
    logger.warn({ method: req.method, url: req.url }, "JSON parse failed");
    return res.status(400).json({ message: "Invalid JSON" });
  }
  next(err);
});

async function runMigrations(): Promise<void> {
  startupLog.info("Running pending database migrations...");
  try {
    await migrate(db, { migrationsFolder: "./migrations" });
    startupLog.info("Database migrations completed");
  } catch (err: any) {
    startupLog.fatal({ err: err.message }, "Database migration failed");
    process.exit(1);
  }
}

async function runSafetyPatches(): Promise<void> {
  startupLog.info("Running safety schema patches...");
  const client = await pool.connect();
  try {
    // Patch bookings table: add any missing columns
    await client.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method text`);

    // Patch hotels table: add any missing columns
    await client.query(`ALTER TABLE hotels ADD COLUMN IF NOT EXISTS is_channex_enabled boolean NOT NULL DEFAULT false`);
    await client.query(`ALTER TABLE hotels ADD COLUMN IF NOT EXISTS channex_property_uuid text`);
    await client.query(`ALTER TABLE hotels ADD COLUMN IF NOT EXISTS channex_addon_price integer`);
    await client.query(`ALTER TABLE hotels ADD COLUMN IF NOT EXISTS channex_room_count integer`);
    await client.query(`ALTER TABLE hotels ADD COLUMN IF NOT EXISTS total_monthly_subscription_fee decimal(10,2)`);
    await client.query(`ALTER TABLE hotels ADD COLUMN IF NOT EXISTS is_whatsapp_enabled boolean NOT NULL DEFAULT false`);
    await client.query(`ALTER TABLE hotels ADD COLUMN IF NOT EXISTS whatsapp_balance integer NOT NULL DEFAULT 0`);

    // Patch owners table: add tenant_type
    await client.query(`ALTER TABLE owners ADD COLUMN IF NOT EXISTS tenant_type text NOT NULL DEFAULT 'hotel'`);

    // Patch users table: add any missing columns
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code varchar`);

    // Create billing_logs table if missing
    await client.query(`
      CREATE TABLE IF NOT EXISTS billing_logs (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id varchar,
        hotel_id varchar,
        owner_id varchar,
        event_type varchar NOT NULL,
        description text,
        amount_usd integer NOT NULL DEFAULT 0,
        messages_added integer NOT NULL DEFAULT 0,
        package_name varchar,
        status varchar NOT NULL DEFAULT 'completed',
        created_at timestamp DEFAULT now()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_billing_logs_hotel_id ON billing_logs (hotel_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_billing_logs_tenant_id ON billing_logs (tenant_id)`);

    // Create restaurant_tables table if missing
    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurant_tables (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id varchar NOT NULL,
        table_number varchar NOT NULL,
        capacity integer,
        created_at timestamp DEFAULT now()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_restaurant_tables_property_id ON restaurant_tables (property_id)`);

    // Create restaurant cleaning / staff tables if missing
    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurant_cleaning_tasks (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id varchar NOT NULL,
        property_id varchar NOT NULL,
        description text NOT NULL,
        location varchar,
        assigned_to_id varchar,
        created_by_id varchar,
        status varchar NOT NULL DEFAULT 'pending',
        completed_at timestamp,
        photo_url text,
        created_at timestamp DEFAULT now()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurant_staff_profiles (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        property_id varchar NOT NULL,
        salary_amount varchar DEFAULT '0',
        tax_rate varchar DEFAULT '0',
        tables_assigned text,
        notes text,
        updated_at timestamp DEFAULT now()
      )
    `);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurant_staff_profiles_user_property ON restaurant_staff_profiles (user_id, property_id)`);

    // Create deleted_trial_accounts table if missing
    await client.query(`
      CREATE TABLE IF NOT EXISTS deleted_trial_accounts (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        email text NOT NULL,
        username text NOT NULL,
        full_name text,
        deleted_at timestamp DEFAULT now(),
        reason text
      )
    `);

    // Fix standalone restaurant owners whose tenant_type incorrectly defaults to "hotel"
    // Approach 1: owner whose ALL properties are of type "restaurant"
    await client.query(`
      UPDATE owners
      SET tenant_type = 'restaurant_only'
      WHERE tenant_type = 'hotel'
        AND id IN (
          SELECT DISTINCT p.owner_id
          FROM properties p
          WHERE p.owner_id IS NOT NULL
          GROUP BY p.owner_id
          HAVING COUNT(*) = COUNT(CASE WHEN p.type = 'restaurant' THEN 1 END)
        )
    `);
    // Approach 2 (belt & suspenders): owner whose subscription plan_code starts with 'REST_'
    await client.query(`
      UPDATE owners
      SET tenant_type = 'restaurant_only'
      WHERE tenant_type = 'hotel'
        AND id IN (
          SELECT DISTINCT owner_id FROM subscriptions
          WHERE plan_code LIKE 'REST_%' AND owner_id IS NOT NULL
        )
    `);

    startupLog.info("Safety schema patches completed");
  } catch (err: any) {
    startupLog.error({ err: err.message }, "Safety patch error (non-fatal)");
  } finally {
    client.release();
  }
}

let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  shutdownLog.info({ signal }, "Graceful shutdown initiated");

  shutdownLog.info("Closing HTTP server (no new connections)...");
  await new Promise<void>((resolve) => {
    httpServer.close((err) => {
      if (err) {
        shutdownLog.error({ err: err.message }, "Error closing HTTP server");
      } else {
        shutdownLog.info("HTTP server closed — all in-flight requests finished");
      }
      resolve();
    });
  });

  shutdownLog.info("Stopping job queue...");
  try {
    await stopJobQueue();
    shutdownLog.info("Job queue stopped");
  } catch (err: any) {
    shutdownLog.error({ err: err.message }, "Error stopping job queue");
  }

  shutdownLog.info("Closing database pool...");
  try {
    await pool.end();
    shutdownLog.info("Database pool closed");
  } catch (err: any) {
    shutdownLog.error({ err: err.message }, "Error closing database pool");
  }

  shutdownLog.info("Flushing Sentry events...");
  await flushSentry();

  shutdownLog.info("Shutdown complete");
  process.exit(0);
}

(async () => {
  startupLog.info("========================================");
  startupLog.info("O.S.S Smart Hotel System starting...");
  startupLog.info({ nodeEnv: process.env.NODE_ENV || "development", time: new Date().toISOString() }, "Environment info");
  startupLog.info("========================================");

  if (!process.env.DATABASE_URL) {
    startupLog.fatal("DATABASE_URL is not set");
    process.exit(1);
  }
  startupLog.info("DATABASE_URL: OK");

  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && !process.env.SESSION_SECRET) {
    startupLog.fatal("SESSION_SECRET is required in production");
    process.exit(1);
  }
  startupLog.info({ status: process.env.SESSION_SECRET ? "loaded from env" : "not set (dev fallback)" }, "SESSION_SECRET check");

  const recommended = [
    "EPOINT_MERCHANT_ID", "EPOINT_PRIVATE_KEY", "EPOINT_PUBLIC_KEY",
    "RESEND_API_KEY", "EMAIL_FROM", "APP_BASE_URL",
    "ONESIGNAL_REST_API_KEY", "VITE_ONESIGNAL_APP_ID",
  ];
  const presentRecommended = recommended.filter(k => !!process.env[k]);
  const missingRecommended = recommended.filter(k => !process.env[k]);
  if (presentRecommended.length > 0) {
    startupLog.info({ vars: presentRecommended }, "Service env vars present");
  }
  if (missingRecommended.length > 0) {
    startupLog.warn({ vars: missingRecommended }, "Service env vars not set (related features will be disabled)");
  }

  const dbOk = await checkDatabaseConnection();
  if (!dbOk) {
    startupLog.fatal("Cannot connect to database. Exiting.");
    process.exit(1);
  }

  await runMigrations();
  await runSafetyPatches();

  await registerRoutes(httpServer, app);
  startupLog.info("All routes registered");

  setupSentryRequestHandler(app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error({ err, status }, "Unhandled server error");

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (isProduction) {
    serveStatic(app);
    startupLog.info("Static files configured for production");
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
    startupLog.info("Vite dev server configured");
  }

  const boss = await getJobQueue();
  await registerBookingSyncWorker(boss);
  await registerOtaSyncWorker(boss);
  await registerPaymentRetryWorker(boss);
  await registerSubscriptionRenewalWorker(boss);
  const { registerBackupWorker } = await import("./workers/backupWorker");
  await registerBackupWorker(boss);
  const { registerNightAuditWorker } = await import("./workers/nightAuditWorker");
  await registerNightAuditWorker(boss);
  startupLog.info("Job queue and workers initialized");

  const PORT = 5000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);
    startupLog.info({ port: PORT }, "Server listening");
    startupLog.info("========================================");
    startupLog.info("Server ready and accepting connections");
    startupLog.info("========================================");
  });

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
})();
