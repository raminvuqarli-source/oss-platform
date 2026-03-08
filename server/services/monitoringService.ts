import { logger } from "../utils/logger";

const monitorLogger = logger.child({ module: "monitoring" });

type AlertCategory =
  | "webhook_failure"
  | "payment_retry_failure"
  | "renewal_worker_error"
  | "email_delivery_failure"
  | "system_error";

interface AlertRecord {
  category: AlertCategory;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

interface AlertStats {
  total: number;
  byCategory: Record<AlertCategory, number>;
  recent: AlertRecord[];
}

const ALERT_HISTORY_MAX = 200;
const DEDUP_WINDOW_MS = 5 * 60 * 1000;
const ADMIN_EMAIL = "Ramin.v@orange-studio.az";

const alertHistory: AlertRecord[] = [];
const dedupMap = new Map<string, number>();

let emailSender: ((params: { to: string; subject: string; html: string; text: string; emailType: string }) => Promise<any>) | null = null;

async function getEmailSender() {
  if (!emailSender) {
    try {
      const emailModule = await import("../email");
      if (typeof (emailModule as any).sendAlertEmail === "function") {
        emailSender = (emailModule as any).sendAlertEmail;
      }
    } catch {
      emailSender = null;
    }
  }
  return emailSender;
}

function dedupKey(category: string, message: string): string {
  return `${category}:${message.slice(0, 100)}`;
}

function shouldSendAlert(key: string): boolean {
  const lastSent = dedupMap.get(key);
  if (lastSent && Date.now() - lastSent < DEDUP_WINDOW_MS) {
    return false;
  }
  dedupMap.set(key, Date.now());
  return true;
}

export function trackAlert(category: AlertCategory, message: string, metadata?: Record<string, unknown>): void {
  const record: AlertRecord = {
    category,
    message,
    metadata,
    timestamp: new Date(),
  };

  alertHistory.push(record);
  if (alertHistory.length > ALERT_HISTORY_MAX) {
    alertHistory.splice(0, alertHistory.length - ALERT_HISTORY_MAX);
  }

  monitorLogger.warn({ category, message, metadata }, "Alert tracked");

  const key = dedupKey(category, message);
  if (shouldSendAlert(key)) {
    sendAdminAlert(category, message, metadata).catch((err) => {
      monitorLogger.error({ err: err.message }, "Failed to send admin alert email");
    });
  }
}

async function sendAdminAlert(category: AlertCategory, message: string, metadata?: Record<string, unknown>): Promise<void> {
  try {
    const { getResendClient } = await import("../email");
    const { client, fromEmail } = await (getResendClient as any)();

    const subject = `[O.S.S Alert] ${categoryLabel(category)}`;
    const timestamp = new Date().toISOString();

    const metadataHtml = metadata
      ? `<pre style="background:#f5f5f5;padding:12px;border-radius:4px;font-size:13px;overflow-x:auto;">${JSON.stringify(metadata, null, 2)}</pre>`
      : "";

    const html = `
<!DOCTYPE html>
<html>
<head><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;margin:0;padding:20px;background:#f9f9f9;} .card{background:#fff;border-radius:8px;padding:24px;max-width:600px;margin:0 auto;box-shadow:0 1px 3px rgba(0,0,0,0.1);} h2{color:#d32f2f;margin-top:0;} .label{font-weight:600;color:#555;} .value{margin-bottom:16px;}</style></head>
<body>
<div class="card">
  <h2>${categoryLabel(category)}</h2>
  <p class="label">Category</p>
  <p class="value">${category}</p>
  <p class="label">Message</p>
  <p class="value">${message}</p>
  <p class="label">Timestamp</p>
  <p class="value">${timestamp}</p>
  ${metadataHtml ? `<p class="label">Details</p>${metadataHtml}` : ""}
</div>
</body>
</html>`;

    const text = `[O.S.S Alert] ${categoryLabel(category)}\n\nCategory: ${category}\nMessage: ${message}\nTimestamp: ${timestamp}\n${metadata ? `\nDetails: ${JSON.stringify(metadata)}` : ""}`;

    await client.emails.send({
      from: fromEmail,
      to: ADMIN_EMAIL,
      subject,
      html,
      text,
    });

    monitorLogger.info({ category, to: ADMIN_EMAIL }, "Admin alert email sent");
  } catch (err: any) {
    monitorLogger.error({ err: err.message, category }, "Admin alert email delivery failed");
  }
}

function categoryLabel(category: AlertCategory): string {
  switch (category) {
    case "webhook_failure": return "Webhook Failure";
    case "payment_retry_failure": return "Payment Retry Failure";
    case "renewal_worker_error": return "Renewal Worker Error";
    case "email_delivery_failure": return "Email Delivery Failure";
    case "system_error": return "System Error";
    default: return "Unknown Alert";
  }
}

export function getAlertStats(): AlertStats {
  const byCategory: Record<string, number> = {};
  for (const record of alertHistory) {
    byCategory[record.category] = (byCategory[record.category] || 0) + 1;
  }

  return {
    total: alertHistory.length,
    byCategory: byCategory as Record<AlertCategory, number>,
    recent: alertHistory.slice(-20).reverse(),
  };
}

export function getRecentAlerts(limit = 20): AlertRecord[] {
  return alertHistory.slice(-limit).reverse();
}

export function clearDedupCache(): void {
  const now = Date.now();
  for (const [key, timestamp] of dedupMap.entries()) {
    if (now - timestamp > DEDUP_WINDOW_MS * 2) {
      dedupMap.delete(key);
    }
  }
}

setInterval(clearDedupCache, DEDUP_WINDOW_MS);
