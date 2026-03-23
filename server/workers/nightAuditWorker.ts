import PgBoss from "pg-boss";
import { logger } from "../utils/logger";
import { runNightAuditForHotel } from "../services/nightAuditEngine";
import { db } from "../db";
import { hotels } from "@shared/schema";

const workerLog = logger.child({ module: "night-audit-worker" });

export const NIGHT_AUDIT_QUEUE = "night-audit";
export const NIGHT_AUDIT_CRON = "night-audit-cron";

export interface NightAuditJobData {
  hotelId: string;
  tenantId: string;
  auditDate?: string;
}

let _boss: PgBoss | null = null;

export async function registerNightAuditWorker(boss: PgBoss): Promise<void> {
  _boss = boss;

  await boss.createQueue(NIGHT_AUDIT_QUEUE);
  await boss.createQueue(NIGHT_AUDIT_CRON);

  await boss.work<NightAuditJobData>(NIGHT_AUDIT_QUEUE, { teamSize: 2, teamConcurrency: 1 }, async (job) => {
    const { hotelId, tenantId, auditDate } = job.data;
    const parsedDate = auditDate ? new Date(auditDate) : undefined;
    workerLog.info({ hotelId, auditDate }, "Night audit job started");
    const result = await runNightAuditForHotel(hotelId, tenantId, parsedDate);
    workerLog.info({ result }, "Night audit job completed");
  });

  const BAKU_2AM_UTC = "0 22 * * *";

  await boss.schedule(NIGHT_AUDIT_CRON, BAKU_2AM_UTC, {});
  workerLog.info({ cron: BAKU_2AM_UTC }, "Night audit cron scheduled (2:00 AM Baku = 22:00 UTC)");

  await boss.work(NIGHT_AUDIT_CRON, async () => {
    workerLog.info("Night audit cron triggered — enqueuing jobs for all hotels");
    const allHotels = await db.select().from(hotels);
    for (const hotel of allHotels) {
      await enqueueNightAudit(boss, hotel.id, hotel.tenantId ?? hotel.id);
    }
  });

  workerLog.info("Night audit worker registered (daily at 02:00 Baku time)");
}

export async function enqueueNightAudit(
  boss: PgBoss,
  hotelId: string,
  tenantId: string,
  auditDate?: Date,
): Promise<string | null> {
  const payload: NightAuditJobData = {
    hotelId,
    tenantId,
    auditDate: auditDate?.toISOString(),
  };
  return boss.send(NIGHT_AUDIT_QUEUE, payload, {
    retryLimit: 2,
    retryDelay: 60,
    expireInSeconds: 3600,
  });
}
