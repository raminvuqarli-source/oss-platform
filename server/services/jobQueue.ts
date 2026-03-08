import PgBoss from "pg-boss";
import { logger } from "../utils/logger";

const jqLogger = logger.child({ module: "pg-boss" });

let boss: PgBoss | null = null;

export async function getJobQueue(): Promise<PgBoss> {
  if (boss) return boss;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for job queue");
  }

  boss = new PgBoss({
    connectionString,
    retryLimit: 3,
    retryDelay: 30,
    expireInSeconds: 300,
    retentionDays: 7,
  });

  boss.on("error", (error) => {
    jqLogger.error({ err: error.message }, "Job queue error");
  });

  await boss.start();
  jqLogger.info("Job queue started");

  return boss;
}

export function getJobQueueStatus(): { started: boolean; stopped: boolean } {
  return {
    started: boss !== null,
    stopped: boss === null,
  };
}

export async function stopJobQueue(): Promise<void> {
  if (boss) {
    await boss.stop({ graceful: true, timeout: 10000 });
    jqLogger.info("Job queue stopped");
    boss = null;
  }
}
