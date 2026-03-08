import PgBoss from "pg-boss";
import { storage } from "../storage";
import { env } from "../config/env";
import { type PlanCode } from "@shared/schema";
import { PLAN_CODE_FEATURES } from "@shared/planFeatures";
import crypto from "crypto";
import { logger } from "../utils/logger";
import {
  sendPaymentFailedNotification,
  sendSubscriptionSuspendedNotification,
} from "../services/billingEmailService";

const retryLogger = logger.child({ module: "payment-retry" });

export const PAYMENT_RETRY_QUEUE = "payment-retry";

const EPOINT_API_URL = "https://epoint.az/api/1/request";
const MAX_RETRY_ATTEMPTS = 4;

const RETRY_DELAYS_SECONDS: Record<number, number> = {
  1: 0,
  2: 24 * 60 * 60,
  3: 48 * 60 * 60,
  4: 72 * 60 * 60,
};

function signData(privateKey: string, jsonData: Record<string, any>): { data: string; signature: string } {
  const dataBase64 = Buffer.from(JSON.stringify(jsonData)).toString("base64");
  const rawSig = crypto.createHash("sha1").update(`${privateKey}${dataBase64}${privateKey}`).digest();
  return { data: dataBase64, signature: rawSig.toString("base64") };
}

export interface PaymentRetryJobData {
  subscriptionId: string;
  ownerId: string;
  tenantId: string | null;
  planCode: string;
  planType: string;
  failedOrderId: string;
  attemptNumber: number;
}

async function processRetry(job: PaymentRetryJobData): Promise<void> {
  const { subscriptionId, ownerId, planCode, planType, failedOrderId, attemptNumber } = job;

  retryLogger.info({ subscriptionId, ownerId, attemptNumber, failedOrderId }, "Processing payment retry");

  const sub = await storage.getSubscriptionByOwner(ownerId);
  if (!sub) {
    retryLogger.warn({ ownerId }, "No active subscription found — skipping retry");
    return;
  }

  const subStatus = (sub as any).status;
  if (subStatus === "active") {
    retryLogger.info({ subscriptionId }, "Subscription already active — payment succeeded elsewhere, skipping retry");
    return;
  }

  if (subStatus === "suspended" || subStatus === "expired" || subStatus === "canceled") {
    retryLogger.info({ subscriptionId, status: subStatus }, "Subscription not retryable — skipping");
    return;
  }

  const currentAttempts = (sub as any).failedPaymentAttempts || 0;
  if (currentAttempts >= MAX_RETRY_ATTEMPTS) {
    retryLogger.warn({ subscriptionId, attempts: currentAttempts }, "Max retries reached — suspending");
    await storage.updateSubscription(sub.id, {
      status: "suspended",
      isActive: false,
    });
    sendSubscriptionSuspendedNotification({
      ownerId,
      tenantId: job.tenantId,
      planType,
      subscriptionId,
    }).catch(err => retryLogger.warn({ err: err.message }, "Suspension email failed — non-critical"));
    return;
  }

  const failedOrder = await storage.getPaymentOrder(failedOrderId);
  if (!failedOrder) {
    retryLogger.error({ failedOrderId }, "Failed order not found — skipping retry");
    return;
  }

  const config = PLAN_CODE_FEATURES[planCode as PlanCode];
  if (!config) {
    retryLogger.error({ planCode }, "Unknown plan code — skipping retry");
    return;
  }

  const privateKey = env.EPOINT_PRIVATE_KEY;
  const publicKey = env.EPOINT_PUBLIC_KEY;
  if (!privateKey || !publicKey) {
    retryLogger.error("Epoint keys not configured — cannot retry");
    return;
  }

  const amountAZN = config.priceMonthlyAZN.toFixed(2);
  const amountCents = Math.round(config.priceMonthlyAZN * 100);
  const baseUrl = env.BASE_URL;

  const retryOrder = await storage.createPaymentOrder({
    ownerId,
    tenantId: job.tenantId || null,
    planType,
    orderType: "subscription_retry",
    referenceId: failedOrderId,
    amount: amountCents,
    currency: "AZN",
    status: "pending",
    paymentMethodId: null,
    customerNote: `Payment retry #${attemptNumber} for ${config.displayName} plan`,
    transferReference: null,
  } as any);

  retryLogger.info({ orderId: retryOrder.id, attempt: attemptNumber, amount: amountAZN }, "Created retry payment order");

  await storage.updateSubscription(sub.id, {
    lastPaymentOrderId: retryOrder.id,
  } as any);

  const epointData = {
    public_key: publicKey,
    amount: amountAZN,
    currency: "AZN",
    language: "az",
    order_id: retryOrder.id,
    description: `O.S.S ${config.displayName} plan - retry #${attemptNumber}`,
    success_redirect_url: `${baseUrl}/settings?payment=success&orderId=${retryOrder.id}`,
    error_redirect_url: `${baseUrl}/settings?payment=declined&orderId=${retryOrder.id}`,
    callback_url: `${baseUrl}/api/epoint/webhook`,
  };

  const { data, signature } = signData(privateKey, epointData);

  try {
    const epointRes = await fetch(EPOINT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data, signature }).toString(),
    });

    const epointResponse = await epointRes.json() as any;

    if (epointResponse.status !== "success" || !epointResponse.redirect_url) {
      const errorReason = epointResponse.message || epointResponse.error || "Unknown";
      retryLogger.error({ orderId: retryOrder.id, errorReason, attempt: attemptNumber }, "Retry Epoint API call failed");

      await storage.updatePaymentOrder(retryOrder.id, {
        status: "rejected",
        adminNote: `Retry #${attemptNumber} Epoint API error: ${errorReason}`,
        reviewedAt: new Date(),
      });

      await storage.updateSubscription(sub.id, {
        status: "past_due",
        failedPaymentAttempts: currentAttempts + 1,
      } as any);

      sendPaymentFailedNotification({
        ownerId,
        tenantId: job.tenantId,
        orderId: retryOrder.id,
        amount: retryOrder.amount,
        currency: "AZN",
        attemptCount: currentAttempts + 1,
      }).catch(err => retryLogger.warn({ err: err.message }, "Payment failed email failed — non-critical"));

      return;
    }

    await storage.updatePaymentOrder(retryOrder.id, {
      transferReference: epointResponse.transaction || null,
      customerNote: `Retry #${attemptNumber} Epoint transaction: ${epointResponse.transaction || ""}`,
    });

    retryLogger.info({ orderId: retryOrder.id, attempt: attemptNumber, paymentUrl: epointResponse.redirect_url }, "Retry payment order created — waiting for webhook");

    try {
      const allUsers = await storage.getUsersByOwner(ownerId, job.tenantId || ownerId);
      const ownerUser = allUsers.find(u => u.role === "owner_admin");
      if (ownerUser) {
        await storage.createNotification({
          userId: ownerUser.id,
          title: "Payment Retry",
          message: `Payment retry #${attemptNumber} for your ${config.displayName} plan. Please complete the payment to avoid service interruption.`,
          type: "payment",
          actionUrl: epointResponse.redirect_url,
          tenantId: job.tenantId || null,
        } as any);
      }
    } catch (notifErr: any) {
      retryLogger.warn({ err: notifErr.message }, "Failed to send retry notification");
    }
  } catch (fetchErr: any) {
    retryLogger.error({ err: fetchErr.message, orderId: retryOrder.id, attempt: attemptNumber }, "Retry network request failed");

    await storage.updatePaymentOrder(retryOrder.id, {
      status: "rejected",
      adminNote: `Retry #${attemptNumber} network error: ${fetchErr.message}`,
      reviewedAt: new Date(),
    });

    await storage.updateSubscription(sub.id, {
      status: "past_due",
      failedPaymentAttempts: currentAttempts + 1,
    } as any);
  }
}

export async function enqueuePaymentRetry(
  boss: PgBoss | null,
  data: PaymentRetryJobData
): Promise<void> {
  if (!boss) {
    retryLogger.error("Job queue not available — cannot enqueue retry");
    return;
  }

  const { attemptNumber, failedOrderId } = data;

  if (attemptNumber > MAX_RETRY_ATTEMPTS) {
    retryLogger.warn({ attemptNumber, failedOrderId }, "Attempt exceeds max — not scheduling");
    return;
  }

  const delaySec = RETRY_DELAYS_SECONDS[attemptNumber] || 0;
  const singletonKey = `retry-${data.subscriptionId}-${attemptNumber}`;

  retryLogger.info({ attemptNumber, delaySec, singletonKey, failedOrderId }, "Scheduling payment retry");

  await boss.send(PAYMENT_RETRY_QUEUE, data, {
    startAfter: delaySec,
    singletonKey,
    retryLimit: 1,
    expireInSeconds: 3600,
  });
}

export async function registerPaymentRetryWorker(boss: PgBoss): Promise<void> {
  await boss.createQueue(PAYMENT_RETRY_QUEUE);

  await boss.work(PAYMENT_RETRY_QUEUE, async (job: any) => {
    const data = job.data as PaymentRetryJobData;
    retryLogger.info({ jobId: job.id, attempt: data.attemptNumber, subscriptionId: data.subscriptionId }, "Payment retry job started");

    try {
      await processRetry(data);

      const nextAttempt = data.attemptNumber + 1;
      if (nextAttempt <= MAX_RETRY_ATTEMPTS) {
        const sub = await storage.getSubscriptionByOwner(data.ownerId);
        const subStatus = (sub as any)?.status;
        if (subStatus === "past_due") {
          await enqueuePaymentRetry(boss, {
            ...data,
            attemptNumber: nextAttempt,
            failedOrderId: (sub as any)?.lastPaymentOrderId || data.failedOrderId,
          });
        }
      }
    } catch (err: any) {
      retryLogger.error({ err: err.message, jobId: job.id }, "Payment retry job failed");
      throw err;
    }
  });

  retryLogger.info("Payment retry worker registered");
}
