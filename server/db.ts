import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { logger } from "./utils/logger";

const dbLogger = logger.child({ module: "db" });

if (!process.env.DATABASE_URL) {
  dbLogger.fatal("DATABASE_URL is not set");
  process.exit(1);
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  dbLogger.error({ err: err.message }, "Unexpected pool error");
});

pool.on("connect", () => {
  dbLogger.info("New client connected to pool");
});

export const db = drizzle(pool, { schema });

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    dbLogger.info("Database connection verified");
    return true;
  } catch (err: any) {
    dbLogger.error({ err: err.message }, "Database connection failed");
    return false;
  }
}
