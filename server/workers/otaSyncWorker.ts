import PgBoss from "pg-boss";
import { logger } from "../utils/logger";
import { pushAvailability, pushRates, pullReservations, type OtaSyncAction } from "../services/otaSyncService";
import { captureException } from "../utils/sentry";

const otaWorkerLogger = logger.child({ module: "ota-sync-worker" });

export interface OtaSyncJobData {
  propertyId: string;
  tenantId: string | null;
  action: OtaSyncAction;
  trigger: string;
}

export const OTA_SYNC_QUEUE = "ota-sync";

export async function processOtaSyncJob(
  job: PgBoss.Job<OtaSyncJobData>
): Promise<void> {
  const { propertyId, tenantId, action, trigger } = job.data;
  const jobLog = otaWorkerLogger.child({ jobId: job.id, propertyId, action, trigger });

  jobLog.info("OTA sync job started");

  let results;
  switch (action) {
    case "push_availability":
      results = await pushAvailability(propertyId, tenantId);
      break;
    case "push_rates":
      results = await pushRates(propertyId, tenantId);
      break;
    case "pull_reservations":
      results = await pullReservations(propertyId, tenantId);
      break;
    default:
      throw new Error(`Unknown OTA sync action: ${action}`);
  }

  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    jobLog.warn({ failed }, "Some OTA sync operations failed");
  }

  jobLog.info({ resultCount: results.length, failedCount: failed.length }, "OTA sync job completed");
}

export async function registerOtaSyncWorker(boss: PgBoss): Promise<void> {
  await boss.work<OtaSyncJobData>(
    OTA_SYNC_QUEUE,
    { teamSize: 2 } as any,
    async (job: any) => {
      const jobLog = otaWorkerLogger.child({ jobId: job.id, propertyId: job.data.propertyId });
      try {
        await processOtaSyncJob(job);
      } catch (error: any) {
        jobLog.error({ err: error.message }, "OTA sync job failed");
        captureException(error, {
          jobId: job.id,
          propertyId: job.data.propertyId,
          action: job.data.action,
          queue: OTA_SYNC_QUEUE,
        });
        throw error;
      }
    }
  );

  otaWorkerLogger.info({ queue: OTA_SYNC_QUEUE }, "OTA sync worker registered");
}

export async function enqueueOtaSync(
  boss: PgBoss,
  propertyId: string,
  tenantId: string | null,
  action: OtaSyncAction,
  trigger: string
): Promise<string | null> {
  const jobId = await boss.send(OTA_SYNC_QUEUE, {
    propertyId,
    tenantId,
    action,
    trigger,
  }, {
    singletonKey: `${propertyId}_${action}`,
    singletonSeconds: 30,
  });

  otaWorkerLogger.info({ jobId, propertyId, action, trigger }, "OTA sync job enqueued");
  return jobId;
}
