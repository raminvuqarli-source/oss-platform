import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { createWriteStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "fs";
import { createGzip } from "zlib";
import * as path from "path";
import type PgBoss from "pg-boss";
import { logger } from "../utils/logger";
import { trackAlert } from "../services/monitoringService";

const execFileAsync = promisify(execFile);
const backupLogger = logger.child({ module: "backup-worker" });

const BACKUP_DIR = path.resolve(process.cwd(), "backups");
const MAX_BACKUPS = 7;
const BACKUP_QUEUE = "database-backup";

function ensureBackupDir(): void {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function getBackupFilename(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `backup_${ts}.sql.gz`;
}

async function pruneOldBackups(): Promise<void> {
  const files = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("backup_") && f.endsWith(".sql.gz"))
    .sort()
    .reverse();

  if (files.length > MAX_BACKUPS) {
    const toDelete = files.slice(MAX_BACKUPS);
    for (const file of toDelete) {
      const filePath = path.join(BACKUP_DIR, file);
      unlinkSync(filePath);
      backupLogger.info({ file }, "Pruned old backup");
    }
  }
}

export async function runBackup(): Promise<{ success: boolean; filename?: string; size?: number; error?: string }> {
  ensureBackupDir();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    const msg = "DATABASE_URL not set, cannot run backup";
    backupLogger.error(msg);
    trackAlert("system_error", msg);
    return { success: false, error: msg };
  }

  const filename = getBackupFilename();
  const filePath = path.join(BACKUP_DIR, filename);

  try {
    backupLogger.info({ filename }, "Starting database backup");

    const pgDumpPath = await findPgDump();

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const fail = (err: Error) => {
        if (!settled) {
          settled = true;
          reject(err);
        }
      };

      const pgDump = spawn(pgDumpPath, [
        "--no-owner",
        "--no-privileges",
        "--format=plain",
        databaseUrl,
      ], {
        env: { ...process.env },
        stdio: ["ignore", "pipe", "pipe"],
      });

      const gzip = createGzip();
      const output = createWriteStream(filePath);

      let stderr = "";
      pgDump.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      pgDump.on("error", (err) => fail(err));
      gzip.on("error", (err) => fail(new Error(`gzip error: ${err.message}`)));
      output.on("error", (err) => fail(new Error(`write error: ${err.message}`)));

      pgDump.stdout.pipe(gzip).pipe(output);

      let processExitCode: number | null = null;
      let outputFinished = false;

      const checkDone = () => {
        if (processExitCode !== null && outputFinished && !settled) {
          settled = true;
          if (processExitCode !== 0) {
            reject(new Error(`pg_dump exited with code ${processExitCode}: ${stderr}`));
          } else {
            resolve();
          }
        }
      };

      pgDump.on("close", (code: number) => {
        processExitCode = code;
        if (code !== 0) {
          fail(new Error(`pg_dump exited with code ${code}: ${stderr}`));
        } else {
          checkDone();
        }
      });

      output.on("finish", () => {
        outputFinished = true;
        checkDone();
      });
    });

    const stats = statSync(filePath);
    backupLogger.info({ filename, sizeBytes: stats.size }, "Database backup completed");

    await pruneOldBackups();

    return { success: true, filename, size: stats.size };
  } catch (err: any) {
    backupLogger.error({ err: err.message, filename }, "Database backup failed");
    trackAlert("system_error", `Database backup failed: ${err.message}`, { filename });

    if (existsSync(filePath)) {
      try { unlinkSync(filePath); } catch {}
    }

    return { success: false, error: err.message };
  }
}

async function findPgDump(): Promise<string> {
  try {
    const { stdout } = await execFileAsync("which", ["pg_dump"]);
    return stdout.trim();
  } catch {
    return "pg_dump";
  }
}

export function listBackups(): Array<{ filename: string; size: number; createdAt: string }> {
  ensureBackupDir();

  return readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("backup_") && f.endsWith(".sql.gz"))
    .sort()
    .reverse()
    .map((filename) => {
      const fp = path.join(BACKUP_DIR, filename);
      const stats = statSync(fp);
      return {
        filename,
        size: stats.size,
        createdAt: stats.mtime.toISOString(),
      };
    });
}

export async function registerBackupWorker(boss: PgBoss): Promise<void> {
  await boss.createQueue(BACKUP_QUEUE);

  await boss.work(BACKUP_QUEUE, async (job: any) => {
    backupLogger.info({ jobId: job.id }, "Processing database backup job");
    const result = await runBackup();
    if (!result.success) {
      throw new Error(result.error || "Backup failed");
    }
  });

  await boss.schedule(BACKUP_QUEUE, "0 3 * * *", {}, {
    tz: "Asia/Baku",
  });

  backupLogger.info("Database backup worker registered (daily at 03:00 Baku time)");
}
