import PgBoss from "pg-boss";
import { storage } from "../storage";
import { env } from "../config/env";
import { type PlanCode, PLAN_TYPE_TO_CODE } from "@shared/schema";
import { PLAN_CODE_FEATURES } from "@shared/planFeatures";
import crypto from "crypto";
import { logger } from "../utils/logger";
import { enqueuePaymentRetry, type PaymentRetryJobData } from "./paymentRetryWorker";
import {
  checkTrialEndingSubscriptions,
  sendSubscriptionSuspendedNotification,
} from "../services/billingEmailService";

const renewalLogger = logger.child({ module: "subscription-renewal" });

export const RENEWAL_QUEUE = "subscription-renewal";
export const RENEWAL_CHECK_QUEUE = "subscription-renewal-check";

const EPOINT_API_URL = "https://epoint.az/api/1/request";
const MAX_FAILED_ATTEMPTS = 4;
const GRACE_PERIOD_DAYS = 3;

let _boss: PgBoss | null = null;

function signData(privateKey: string, jsonData: Record<string, any>): { data: string; signature: string } {
  const dataBase64 = Buffer.from(JSON.stringify(jsonData)).toString("base64");
  const rawSig = crypto.createHash("sha1").update(`${privateKey}${dataBase64}${privateKey}`).digest();
  const signatureBase64 = rawSig.toString("base64");
  return { data: dataBase64, signature: signatureBase64 };
}

async function processRenewal(sub: any): Promise<void> {
  const subId = sub.id;
  const ownerId = sub.ownerId;

  if (sub.status === "trial") {
    const trialEnd = sub.trialEndsAt || sub.currentPeriodEnd;
    if (trialEnd && new Date(trialEnd) <= new Date()) {
      renewalLogger.info({ subId, ownerId }, "Trial ended — expiring (no auto-renewal for trials)");
      await storage.updateSubscription(subId, {
        status: "expired",
        isActive: false,
      });
    }
    return;
  }

  const planCode = (sub.planCode || "CORE_STARTER") as PlanCode;
  const planConfig = PLAN_CODE_FEATURES[planCode];

  if (!planConfig) {
    renewalLogger.error({ subId, planCode }, "Unknown plan code — skipping renewal");
    return;
  }

  const periodEnd = sub.currentPeriodEnd || sub.endDate;
  const periodEndDate = periodEnd ? new Date(periodEnd) : null;
  const now = new Date();

  if (sub.cancelAtPeriodEnd || !sub.autoRenew) {
    if (periodEndDate && now >= periodEndDate) {
      renewalLogger.info({ subId, ownerId, cancelAtPeriodEnd: sub.cancelAtPeriodEnd, autoRenew: sub.autoRenew }, "Period ended and cancellation requested — expiring");
      await storage.updateSubscription(subId, {
        status: "expired",
        isActive: false,
      });
    }
    return;
  }

  if (sub.status === "past_due") {
    if (sub.failedPaymentAttempts >= MAX_FAILED_ATTEMPTS) {
      const gracePeriodEnd = periodEndDate
        ? new Date(periodEndDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)
        : now;

      if (now >= gracePeriodEnd) {
        renewalLogger.warn({ subId, ownerId, attempts: sub.failedPaymentAttempts }, "Grace period expired — suspending subscription");
        await storage.updateSubscription(subId, {
          status: "suspended",
          isActive: false,
        });
        sendSubscriptionSuspendedNotification({
          ownerId,
          tenantId: sub.tenantId || null,
          planType: sub.planType,
          subscriptionId: subId,
        }).catch(err => renewalLogger.warn({ err: err.message }, "Suspension email failed — non-critical"));
        return;
      }
      renewalLogger.info({ subId, gracePeriodEnd: gracePeriodEnd.toISOString() }, "In grace period — waiting");
      return;
    }
  }

  const privateKey = env.EPOINT_PRIVATE_KEY;
  const publicKey = env.EPOINT_PUBLIC_KEY;

  if (!privateKey || !publicKey) {
    renewalLogger.error("Epoint keys not configured — cannot process renewal");
    return;
  }

  const amountAZN = planConfig.priceMonthlyAZN.toFixed(2);
  const amountCents = Math.round(planConfig.priceMonthlyAZN * 100);
  const baseUrl = env.BASE_URL;

  const order = await storage.createPaymentOrder({
    ownerId,
    tenantId: sub.tenantId || null,
    planType: sub.planType,
    orderType: "subscription_renewal",
    amount: amountCents,
    currency: "AZN",
    status: "pending",
    paymentMethodId: null,
    customerNote: `Auto-renewal: ${planConfig.displayName} plan`,
    transferReference: null,
  } as any);

  renewalLogger.info({ subId, orderId: order.id, amount: amountAZN, plan: planCode }, "Created renewal payment order");

  await storage.updateSubscription(subId, {
    lastPaymentOrderId: order.id,
  } as any);

  const epointData = {
    public_key: publicKey,
    amount: amountAZN,
    currency: "AZN",
    language: "az",
    order_id: order.id,
    description: `O.S.S ${planConfig.displayName} plan auto-renewal`,
    success_redirect_url: `${baseUrl}/settings?payment=success&orderId=${order.id}`,
    error_redirect_url: `${baseUrl}/settings?payment=declined&orderId=${order.id}`,
    callback_url: `${baseUrl}/api/epoint/webhook`,
  };

  const { data, signature } = signData(privateKey, epointData);
  const requestBody = new URLSearchParams({ data, signature }).toString();

  try {
    const epointRes = await fetch(EPOINT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: requestBody,
    });

    const epointResponse = await epointRes.json() as any;

    if (epointResponse.status !== "success" || !epointResponse.redirect_url) {
      const errorReason = epointResponse.message || epointResponse.error || "Unknown";
      renewalLogger.error({ subId, orderId: order.id, errorReason }, "Epoint renewal order creation failed");
      await storage.updatePaymentOrder(order.id, {
        status: "rejected",
        adminNote: `Renewal Epoint API error: ${errorReason}`,
      });
      const newAttempts = (sub.failedPaymentAttempts || 0) + 1;
      await storage.updateSubscription(subId, {
        status: "past_due",
        failedPaymentAttempts: newAttempts,
      });
      if (newAttempts < MAX_FAILED_ATTEMPTS) {
        await enqueuePaymentRetry(_boss, {
          subscriptionId: subId,
          ownerId,
          tenantId: sub.tenantId || null,
          planCode,
          planType: sub.planType,
          failedOrderId: order.id,
          attemptNumber: newAttempts + 1,
        });
      }
      return;
    }

    await storage.updatePaymentOrder(order.id, {
      transferReference: epointResponse.transaction || null,
      customerNote: `Renewal Epoint transaction: ${epointResponse.transaction || ""}`,
    });

    renewalLogger.info({ subId, orderId: order.id, paymentUrl: epointResponse.redirect_url }, "Renewal payment order created — waiting for webhook");

    try {
      const allUsers = await storage.getUsersByOwner(ownerId, sub.tenantId || ownerId);
      const ownerUser = allUsers.find(u => u.role === "owner_admin");
      if (ownerUser) {
        await storage.createNotification({
          userId: ownerUser.id,
          title: "Subscription Renewal",
          message: `Your ${planConfig.displayName} subscription is due for renewal. Please complete the payment to continue using all features.`,
          type: "payment",
          actionUrl: epointResponse.redirect_url,
          tenantId: sub.tenantId || null,
        } as any);
        renewalLogger.info({ userId: ownerUser.id }, "Renewal notification sent");
      }
    } catch (notifErr: any) {
      renewalLogger.warn({ err: notifErr.message }, "Failed to send renewal notification — non-critical");
    }
  } catch (fetchErr: any) {
    renewalLogger.error({ err: fetchErr.message, subId, orderId: order.id }, "Epoint API request failed");
    await storage.updatePaymentOrder(order.id, {
      status: "rejected",
      adminNote: `Network error: ${fetchErr.message}`,
    });
    const newAttempts = (sub.failedPaymentAttempts || 0) + 1;
    await storage.updateSubscription(subId, {
      status: "past_due",
      failedPaymentAttempts: newAttempts,
    });
    if (newAttempts < MAX_FAILED_ATTEMPTS) {
      await enqueuePaymentRetry(_boss, {
        subscriptionId: subId,
        ownerId,
        tenantId: sub.tenantId || null,
        planCode,
        planType: sub.planType,
        failedOrderId: order.id,
        attemptNumber: newAttempts + 1,
      });
    }
  }
}

async function checkSubscriptions(): Promise<void> {
  renewalLogger.info("Running daily subscription renewal check");

  try {
    await checkTrialEndingSubscriptions();
  } catch (err: any) {
    renewalLogger.error({ err: err.message }, "Trial ending email check failed — continuing with renewals");
  }

  try {
    const dueSubs = await storage.getSubscriptionsDueForRenewal();
    renewalLogger.info({ count: dueSubs.length }, "Subscriptions due for renewal");

    for (const sub of dueSubs) {
      try {
        await processRenewal(sub);
      } catch (err: any) {
        renewalLogger.error({ err: err.message, subId: sub.id }, "Error processing renewal for subscription");
      }
    }

    renewalLogger.info("Subscription renewal check completed");
  } catch (err: any) {
    renewalLogger.error({ err: err.message }, "Subscription renewal check failed");
  }
}

export async function registerSubscriptionRenewalWorker(boss: PgBoss): Promise<void> {
  _boss = boss;
  await boss.createQueue(RENEWAL_QUEUE);
  await boss.createQueue(RENEWAL_CHECK_QUEUE);

  await boss.work(RENEWAL_QUEUE, async (job: any) => {
    renewalLogger.info({ jobId: job.id }, "Processing subscription renewal job");
    await checkSubscriptions();
  });

  await boss.schedule(RENEWAL_CHECK_QUEUE, "0 6 * * *", {}, {
    tz: "Asia/Baku",
  });

  await boss.work(RENEWAL_CHECK_QUEUE, async (job: any) => {
    renewalLogger.info({ jobId: job.id }, "Scheduled renewal check triggered");
    await checkSubscriptions();
  });

  renewalLogger.info("Subscription renewal worker registered (daily at 06:00 Baku time)");
}

export async function triggerRenewalCheck(): Promise<void> {
  await checkSubscriptions();
}
