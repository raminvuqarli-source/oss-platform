import { storage } from "../storage";
import { logger } from "../utils/logger";
import {
  sendPaymentFailedEmail,
  sendSubscriptionRenewalEmail,
  sendInvoiceEmail,
} from "../email";
import { env } from "../config/env";
import { db } from "../db";
import { eq, and, gte, sql } from "drizzle-orm";
import { subscriptions } from "@shared/schema";

const emailLogger = logger.child({ module: "billing-email" });

const sentEmails = new Map<string, number>();
const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;

function isDuplicate(key: string): boolean {
  const lastSent = sentEmails.get(key);
  if (lastSent && Date.now() - lastSent < DEDUP_WINDOW_MS) {
    emailLogger.info({ key }, "Skipping duplicate billing email");
    return true;
  }
  sentEmails.set(key, Date.now());
  if (sentEmails.size > 10000) {
    const cutoff = Date.now() - DEDUP_WINDOW_MS;
    for (const [k, v] of sentEmails.entries()) {
      if (v < cutoff) sentEmails.delete(k);
    }
  }
  return false;
}

function getAppUrl(): string {
  return process.env.APP_BASE_URL || process.env.BASE_URL || env.BASE_URL;
}

async function resolveOwnerEmail(ownerId: string, tenantId?: string | null): Promise<{ email: string; name: string } | null> {
  try {
    const owner = await storage.getOwner(ownerId);
    if (owner?.email) {
      return { email: owner.email, name: owner.name || "Owner" };
    }
    const tid = tenantId || ownerId;
    const users = await storage.getUsersByOwner(ownerId, tid);
    const ownerAdmin = users.find(u => u.role === "owner_admin");
    if (ownerAdmin?.email) {
      return { email: ownerAdmin.email, name: ownerAdmin.fullName || "Owner" };
    }
    return null;
  } catch (err: any) {
    emailLogger.error({ err: err.message, ownerId, tenantId }, "Failed to resolve owner email");
    return null;
  }
}

export async function sendPaymentSuccessNotification(params: {
  ownerId: string;
  tenantId?: string | null;
  invoiceId: string;
  invoiceNumber?: string;
  amount: number;
  currency: string;
  planType: string;
  periodStart: Date;
  periodEnd: Date;
}): Promise<void> {
  const dedupKey = `payment_success:${params.invoiceId}`;
  if (isDuplicate(dedupKey)) return;

  try {
    const ownerInfo = await resolveOwnerEmail(params.ownerId, params.tenantId);
    if (!ownerInfo) {
      emailLogger.warn({ ownerId: params.ownerId }, "No email found for payment success notification");
      return;
    }

    const appUrl = getAppUrl();
    const invoiceNumber = params.invoiceNumber || `INV-${params.invoiceId.slice(0, 8).toUpperCase()}`;
    const amountStr = (params.amount / 100).toFixed(2);
    const periodStartStr = params.periodStart.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const periodEndStr = params.periodEnd.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const result = await sendInvoiceEmail({
      to: ownerInfo.email,
      ownerName: ownerInfo.name,
      invoiceNumber,
      amount: amountStr,
      currency: params.currency || "AZN",
      periodStart: periodStartStr,
      periodEnd: periodEndStr,
      invoiceUrl: `${appUrl}/settings?section=billing`,
      pdfUrl: `${appUrl}/api/invoices/${params.invoiceId}/pdf`,
    });

    emailLogger.info({
      ownerId: params.ownerId,
      invoiceId: params.invoiceId,
      success: result.success,
      error: result.error,
    }, "Payment success email sent");
  } catch (err: any) {
    emailLogger.error({ err: err.message, ownerId: params.ownerId }, "Payment success email error");
  }
}

export async function sendPaymentFailedNotification(params: {
  ownerId: string;
  tenantId?: string | null;
  orderId?: string;
  amount: number;
  currency: string;
  attemptCount: number;
  paymentUrl?: string;
}): Promise<void> {
  const dedupKey = `payment_failed:${params.ownerId}:${params.orderId || params.attemptCount}`;
  if (isDuplicate(dedupKey)) return;

  try {
    const ownerInfo = await resolveOwnerEmail(params.ownerId, params.tenantId);
    if (!ownerInfo) {
      emailLogger.warn({ ownerId: params.ownerId }, "No email found for payment failed notification");
      return;
    }

    const appUrl = getAppUrl();
    const amountStr = (params.amount / 100).toFixed(2);

    const result = await sendPaymentFailedEmail({
      to: ownerInfo.email,
      ownerName: ownerInfo.name,
      amount: amountStr,
      currency: params.currency || "AZN",
      invoiceUrl: params.paymentUrl || `${appUrl}/settings?section=billing`,
      attemptCount: params.attemptCount,
    });

    emailLogger.info({
      ownerId: params.ownerId,
      attemptCount: params.attemptCount,
      orderId: params.orderId,
      success: result.success,
      error: result.error,
    }, "Payment failed email sent");
  } catch (err: any) {
    emailLogger.error({ err: err.message, ownerId: params.ownerId }, "Payment failed email error");
  }
}

export async function sendTrialEndingNotification(params: {
  ownerId: string;
  tenantId?: string | null;
  trialEndDate: Date;
  planType?: string;
}): Promise<void> {
  const dateKey = params.trialEndDate.toISOString().slice(0, 10);
  const dedupKey = `trial_ending:${params.ownerId}:${dateKey}`;
  if (isDuplicate(dedupKey)) return;

  try {
    const ownerInfo = await resolveOwnerEmail(params.ownerId, params.tenantId);
    if (!ownerInfo) {
      emailLogger.warn({ ownerId: params.ownerId }, "No email found for trial ending notification");
      return;
    }

    const trialEndStr = params.trialEndDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const daysLeft = Math.max(0, Math.ceil((params.trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    const result = await sendSubscriptionRenewalEmail({
      to: ownerInfo.email,
      ownerName: ownerInfo.name,
      planName: `${params.planType || "Trial"} (Free Trial — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left)`,
      renewalDate: trialEndStr,
      amount: "0.00",
      currency: "AZN",
    });

    emailLogger.info({
      ownerId: params.ownerId,
      trialEndDate: trialEndStr,
      daysLeft,
      success: result.success,
      error: result.error,
    }, "Trial ending email sent");
  } catch (err: any) {
    emailLogger.error({ err: err.message, ownerId: params.ownerId }, "Trial ending email error");
  }
}

export async function sendSubscriptionSuspendedNotification(params: {
  ownerId: string;
  tenantId?: string | null;
  planType?: string;
  subscriptionId?: string;
}): Promise<void> {
  const dedupKey = `suspended:${params.ownerId}:${params.subscriptionId || "sub"}`;
  if (isDuplicate(dedupKey)) return;

  try {
    const ownerInfo = await resolveOwnerEmail(params.ownerId, params.tenantId);
    if (!ownerInfo) {
      emailLogger.warn({ ownerId: params.ownerId }, "No email found for suspension notification");
      return;
    }

    const appUrl = getAppUrl();

    const result = await sendPaymentFailedEmail({
      to: ownerInfo.email,
      ownerName: ownerInfo.name,
      amount: "N/A",
      currency: "AZN",
      invoiceUrl: `${appUrl}/settings?section=billing`,
      attemptCount: 4,
    });

    emailLogger.info({
      ownerId: params.ownerId,
      subscriptionId: params.subscriptionId,
      success: result.success,
      error: result.error,
    }, "Subscription suspended email sent");
  } catch (err: any) {
    emailLogger.error({ err: err.message, ownerId: params.ownerId }, "Suspension email error");
  }
}

export async function sendRefundApprovedNotification(params: {
  ownerId: string;
  tenantId?: string | null;
  refundId: string;
  amount: number;
  currency: string;
}): Promise<void> {
  const dedupKey = `refund_approved:${params.refundId}`;
  if (isDuplicate(dedupKey)) return;

  try {
    const ownerInfo = await resolveOwnerEmail(params.ownerId, params.tenantId);
    if (!ownerInfo) {
      emailLogger.warn({ ownerId: params.ownerId }, "No email found for refund approved notification");
      return;
    }

    const appUrl = getAppUrl();
    const amountStr = (params.amount / 100).toFixed(2);

    const result = await sendInvoiceEmail({
      to: ownerInfo.email,
      ownerName: ownerInfo.name,
      invoiceNumber: `REFUND-${params.refundId.slice(0, 8).toUpperCase()}`,
      amount: amountStr,
      currency: params.currency || "AZN",
      periodStart: "Refund Approved",
      periodEnd: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      invoiceUrl: `${appUrl}/settings?section=billing`,
    });

    emailLogger.info({
      ownerId: params.ownerId,
      refundId: params.refundId,
      amount: amountStr,
      success: result.success,
      error: result.error,
    }, "Refund approved email sent");
  } catch (err: any) {
    emailLogger.error({ err: err.message, ownerId: params.ownerId }, "Refund approved email error");
  }
}

const WARNING_DAYS = 5;

export async function checkTrialEndingSubscriptions(): Promise<void> {
  return checkEndingSubscriptions();
}

export async function checkEndingSubscriptions(): Promise<void> {
  emailLogger.info(`Checking for subscriptions ending within ${WARNING_DAYS} days`);

  const now = new Date();
  const warningDate = new Date(now.getTime() + WARNING_DAYS * 24 * 60 * 60 * 1000);
  const appUrl = getAppUrl();

  // ---- Trials ending within 5 days ----
  try {
    const trialSubs = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, "trial"),
          eq(subscriptions.isActive, true),
          gte(subscriptions.currentPeriodEnd, now),
          sql`${subscriptions.currentPeriodEnd} <= ${warningDate}`
        )
      );

    emailLogger.info({ count: trialSubs.length }, `Trial subscriptions ending within ${WARNING_DAYS} days`);

    for (const sub of trialSubs) {
      try {
        const trialEnd = sub.trialEndsAt || sub.currentPeriodEnd;
        if (!trialEnd) continue;

        const daysLeft = Math.max(1, Math.ceil((new Date(trialEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        // Send email
        await sendTrialEndingNotification({
          ownerId: sub.ownerId,
          tenantId: sub.tenantId,
          trialEndDate: new Date(trialEnd),
          planType: sub.planType || "Trial",
        });

        // Create in-app notification for the owner_admin
        try {
          const allUsers = await storage.getUsersByOwner(sub.ownerId, sub.tenantId || sub.ownerId);
          const ownerUser = allUsers.find((u: any) => u.role === "owner_admin");
          if (ownerUser) {
            const dedupKey = `trial_warning_notif:${sub.ownerId}:${new Date(trialEnd).toISOString().slice(0, 10)}`;
            if (!isDuplicate(dedupKey)) {
              await storage.createNotification({
                userId: ownerUser.id,
                title: `⚠️ Trial ending in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
                message: `Your free trial expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. After expiry your account will be permanently deleted. Upgrade now to keep your data.`,
                type: "payment",
                actionUrl: `${appUrl}/owner/billing`,
                tenantId: sub.tenantId || null,
              } as any);
              emailLogger.info({ userId: ownerUser.id, daysLeft }, "Trial warning in-app notification created");
            }
          }
        } catch (notifErr: any) {
          emailLogger.warn({ err: notifErr.message }, "Failed to create trial warning in-app notification");
        }
      } catch (err: any) {
        emailLogger.error({ err: err.message, subId: sub.id }, "Failed to send trial ending notification");
      }
    }
  } catch (err: any) {
    emailLogger.error({ err: err.message }, "Trial ending check failed");
  }

  // ---- Paid subscriptions renewing within 5 days ----
  try {
    const paidSubs = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          sql`${subscriptions.status} NOT IN ('trial', 'expired', 'suspended')`,
          eq(subscriptions.isActive, true),
          sql`${subscriptions.currentPeriodEnd} IS NOT NULL`,
          gte(subscriptions.currentPeriodEnd, now),
          sql`${subscriptions.currentPeriodEnd} <= ${warningDate}`
        )
      );

    emailLogger.info({ count: paidSubs.length }, `Paid subscriptions renewing within ${WARNING_DAYS} days`);

    for (const sub of paidSubs) {
      try {
        const periodEnd = (sub as any).currentPeriodEnd;
        if (!periodEnd) continue;

        const daysLeft = Math.max(1, Math.ceil((new Date(periodEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        const endStr = new Date(periodEnd).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

        // Send renewal reminder email
        const dedupKey = `renewal_reminder:${sub.ownerId}:${new Date(periodEnd).toISOString().slice(0, 10)}`;
        if (!isDuplicate(dedupKey)) {
          const ownerInfo = await resolveOwnerEmail(sub.ownerId, sub.tenantId);
          if (ownerInfo) {
            const planCode = (sub as any).planCode || "CORE_STARTER";
            const { PLAN_CODE_FEATURES } = await import("@shared/planFeatures");
            const planConfig = PLAN_CODE_FEATURES[planCode as keyof typeof PLAN_CODE_FEATURES];
            const planName = planConfig?.displayName || sub.planType || "Subscription";
            const amountStr = planConfig ? planConfig.priceMonthlyAZN.toFixed(2) : "0.00";

            await sendSubscriptionRenewalEmail({
              to: ownerInfo.email,
              ownerName: ownerInfo.name,
              planName,
              renewalDate: endStr,
              amount: amountStr,
              currency: "AZN",
            });
            emailLogger.info({ ownerId: sub.ownerId, daysLeft }, "Paid renewal reminder email sent");
          }

          // Create in-app notification
          try {
            const allUsers = await storage.getUsersByOwner(sub.ownerId, sub.tenantId || sub.ownerId);
            const ownerUser = allUsers.find((u: any) => u.role === "owner_admin");
            if (ownerUser) {
              await storage.createNotification({
                userId: ownerUser.id,
                title: `🔔 Subscription renews in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
                message: `Your subscription will automatically renew on ${endStr}. Ensure your payment details are up to date.`,
                type: "payment",
                actionUrl: `${appUrl}/owner/billing`,
                tenantId: sub.tenantId || null,
              } as any);
              emailLogger.info({ userId: ownerUser.id, daysLeft }, "Renewal reminder in-app notification created");
            }
          } catch (notifErr: any) {
            emailLogger.warn({ err: notifErr.message }, "Failed to create renewal reminder in-app notification");
          }
        }
      } catch (err: any) {
        emailLogger.error({ err: err.message, subId: sub.id }, "Failed to send renewal reminder");
      }
    }
  } catch (err: any) {
    emailLogger.error({ err: err.message }, "Paid renewal reminder check failed");
  }
}
