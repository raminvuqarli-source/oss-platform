import PgBoss from "pg-boss";
import { db, pool } from "../db";
import { externalBookings } from "@shared/schema";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { captureException } from "../utils/sentry";

const syncLogger = logger.child({ module: "booking-sync" });

interface ICalEvent {
  uid: string;
  summary: string;
  dtstart: string;
  dtend: string;
}

function parseICalDate(value: string): string {
  const clean = value.replace(/[^0-9T]/g, "");
  if (clean.length >= 8) {
    const y = clean.substring(0, 4);
    const m = clean.substring(4, 6);
    const d = clean.substring(6, 8);
    return `${y}-${m}-${d}`;
  }
  return value;
}

function parseICalEvents(icalText: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const blocks = icalText.split("BEGIN:VEVENT");

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split("END:VEVENT")[0];
    const lines = block.split(/\r?\n/);

    let uid = "";
    let summary = "";
    let dtstart = "";
    let dtend = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("UID:")) {
        uid = trimmed.substring(4).trim();
      } else if (trimmed.startsWith("SUMMARY:")) {
        summary = trimmed.substring(8).trim();
      } else if (trimmed.startsWith("DTSTART")) {
        const colonIdx = trimmed.indexOf(":");
        if (colonIdx !== -1) {
          dtstart = parseICalDate(trimmed.substring(colonIdx + 1).trim());
        }
      } else if (trimmed.startsWith("DTEND")) {
        const colonIdx = trimmed.indexOf(":");
        if (colonIdx !== -1) {
          dtend = parseICalDate(trimmed.substring(colonIdx + 1).trim());
        }
      }
    }

    if (uid && dtstart) {
      events.push({ uid, summary: summary || "Guest", dtstart, dtend: dtend || dtstart });
    }
  }

  return events;
}

function validateICalUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are allowed");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]" ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Access to local addresses is not allowed");
  }

  if (hostname.startsWith("[")) {
    const ipv6 = hostname.slice(1, -1).toLowerCase();
    if (
      ipv6.startsWith("fc") ||
      ipv6.startsWith("fd") ||
      ipv6.startsWith("fe80") ||
      ipv6 === "::1" ||
      ipv6 === "::" ||
      ipv6.startsWith("::ffff:")
    ) {
      throw new Error("Access to private/reserved IPv6 ranges is not allowed");
    }
  }

  const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipMatch) {
    const [, a, b] = ipMatch.map(Number);
    if (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0
    ) {
      throw new Error("Access to private/reserved IP ranges is not allowed");
    }
  }
}

export interface BookingSyncJobData {
  hotelId: string;
  tenantId: string;
  icalUrl: string;
}

export const BOOKING_SYNC_QUEUE = "booking-sync";

export async function processBookingSyncJob(
  job: PgBoss.Job<BookingSyncJobData>
): Promise<void> {
  const { hotelId, tenantId, icalUrl } = job.data;
  const jobId = job.id;
  const jobLog = syncLogger.child({ jobId, hotelId, tenantId });

  jobLog.info("Job started");

  validateICalUrl(icalUrl);

  const response = await fetch(icalUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch iCal: ${response.status} ${response.statusText}`);
  }

  const icalText = await response.text();
  jobLog.info({ bytes: icalText.length }, "Downloaded iCal data");

  const events = parseICalEvents(icalText);
  jobLog.info({ eventCount: events.length }, "Parsed iCal events");

  const client = await pool.connect();
  let imported = 0;

  try {
    await client.query("BEGIN");

    for (const event of events) {
      const existing = await storage.getExternalBookingByExternalId(event.uid, hotelId);
      if (existing) {
        continue;
      }

      try {
        await client.query(
          `INSERT INTO external_bookings (id, hotel_id, tenant_id, source, external_id, guest_name, checkin_date, checkout_date, room_name, price, status, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
           ON CONFLICT (external_id, hotel_id) DO NOTHING`,
          [hotelId, tenantId, "booking", event.uid, event.summary, event.dtstart, event.dtend, "Standard", 0, "confirmed"]
        );
        imported++;
      } catch (insertErr: any) {
        if (insertErr.code === "23505") {
          jobLog.debug({ externalId: event.uid }, "Skipping duplicate booking");
          continue;
        }
        throw insertErr;
      }
    }

    await client.query("COMMIT");
  } catch (txErr) {
    await client.query("ROLLBACK");
    throw txErr;
  } finally {
    client.release();
  }

  jobLog.info({ imported, total: events.length }, "Job completed");
}

export async function registerBookingSyncWorker(boss: PgBoss): Promise<void> {
  await boss.work<BookingSyncJobData>(
    BOOKING_SYNC_QUEUE,
    { teamSize: 1 } as any,
    async (job: any) => {
      const jobLog = syncLogger.child({ jobId: job.id, hotelId: job.data.hotelId });
      try {
        await processBookingSyncJob(job);
      } catch (error: any) {
        jobLog.error({ err: error.message }, "Job failed");
        captureException(error, {
          jobId: job.id,
          hotelId: job.data.hotelId,
          tenantId: job.data.tenantId,
          queue: BOOKING_SYNC_QUEUE,
        });
        throw error;
      }
    }
  );

  syncLogger.info({ queue: BOOKING_SYNC_QUEUE }, "Worker registered");
}
