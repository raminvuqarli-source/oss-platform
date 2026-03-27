import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { env } from "../config/env";
import { type PlanType, type PlanCode, PLAN_TYPE_TO_CODE } from "@shared/schema";
import { applyPlanFeatures, PLAN_CODE_FEATURES } from "@shared/planFeatures";
import { authenticateRequest, requireAuth, requireRole } from "../middleware";
import crypto from "crypto";
import { logger } from "../utils/logger";
import { enqueuePaymentRetry } from "../workers/paymentRetryWorker";
import { getJobQueue } from "../services/jobQueue";
import { generateInvoicePdf } from "../services/invoicePdfService";
import {
  sendPaymentSuccessNotification,
  sendPaymentFailedNotification,
  sendSubscriptionSuspendedNotification,
} from "../services/billingEmailService";
import { logActionAsync } from "../services/auditLogService";

const EPOINT_API_URL = "https://epoint.az/api/1/request";
const EPOINT_STATUS_URL = "https://epoint.az/api/1/get-status";

const PLAN_CODE_TO_TYPE: Record<PlanCode, PlanType> = {
  CORE_STARTER: "starter",
  CORE_GROWTH: "growth",
  CORE_PRO: "pro",
  APARTMENT_LITE: "apartment_lite",
};

function signData(privateKey: string, jsonData: Record<string, any>): { data: string; signature: string } {
  const dataBase64 = Buffer.from(JSON.stringify(jsonData)).toString("base64");
  const rawSig = crypto.createHash("sha1").update(`${privateKey}${dataBase64}${privateKey}`).digest();
  const signatureBase64 = rawSig.toString("base64");
  return { data: dataBase64, signature: signatureBase64 };
}

function verifySignature(privateKey: string, data: string, signature: string): boolean {
  const expectedSig = Buffer.from(
    crypto.createHash("sha1").update(`${privateKey}${data}${privateKey}`).digest()
  ).toString("base64");
  return expectedSig === signature;
}

function decodeData(dataBase64: string): any {
  return JSON.parse(Buffer.from(dataBase64, "base64").toString("utf-8"));
}

async function processEpointPayment(order: any, callbackData: any, paymentStatus: string): Promise<void> {
  const orderId = order.id;
  const isRenewal = (order as any).orderType === "subscription_renewal" || (order as any).orderType === "subscription_retry";

  if (paymentStatus !== "success") {
    await storage.updatePaymentOrder(orderId, {
      status: "rejected",
      adminNote: `Epoint payment failed: ${callbackData.code || "unknown"}`,
      reviewedAt: new Date(),
    });

    logActionAsync({
      tenantId: order.tenantId || null,
      userId: order.ownerId,
      ownerId: order.ownerId,
      action: "payment_failed",
      entityType: "payment_order",
      entityId: orderId,
      description: `Payment failed — ${order.amount} ${order.currency || "AZN"} (code: ${callbackData.code || "unknown"})`,
      newValues: { status: "rejected", amount: order.amount, isRenewal },
    });

    if (isRenewal || (order as any).orderType === "subscription_retry") {
      const sub = await storage.getSubscriptionByOwner(order.ownerId);
      if (sub) {
        const currentAttempts = (sub as any).failedPaymentAttempts || 0;
        const newAttempts = currentAttempts + 1;
        if (newAttempts >= 4) {
          await storage.updateSubscription(sub.id, {
            status: "suspended",
            isActive: false,
            failedPaymentAttempts: newAttempts,
          } as any);
          logger.warn({ subId: sub.id, orderId, attempts: newAttempts }, "Max payment retries reached — subscription suspended");
          sendSubscriptionSuspendedNotification({
            ownerId: order.ownerId,
            tenantId: order.tenantId || null,
            planType: order.planType,
            subscriptionId: sub.id,
          }).catch(err => logger.warn({ err: err.message }, "Suspension email failed — non-critical"));
        } else {
          await storage.updateSubscription(sub.id, {
            status: "past_due",
            failedPaymentAttempts: newAttempts,
          } as any);
          logger.info({ subId: sub.id, orderId, attempts: newAttempts }, "Payment failed — scheduling retry");
          sendPaymentFailedNotification({
            ownerId: order.ownerId,
            tenantId: order.tenantId || null,
            orderId: orderId,
            amount: order.amount || 0,
            currency: order.currency || "AZN",
            attemptCount: newAttempts,
          }).catch(err => logger.warn({ err: err.message }, "Payment failed email failed — non-critical"));

          try {
            const boss = await getJobQueue();
            await enqueuePaymentRetry(boss, {
              subscriptionId: sub.id,
              ownerId: order.ownerId,
              tenantId: order.tenantId || null,
              planCode: (sub as any).planCode || "CORE_STARTER",
              planType: order.planType,
              failedOrderId: orderId,
              attemptNumber: newAttempts + 1,
            });
          } catch (retryErr: any) {
            logger.error({ err: retryErr.message }, "Failed to enqueue payment retry from webhook");
          }
        }
      }
    }
    return;
  }

  await storage.updatePaymentOrder(orderId, {
    status: "approved",
    adminNote: `Auto-approved via Epoint (verified). Transaction: ${callbackData.transaction || ""}`,
    transferReference: callbackData.transaction || order.transferReference,
    reviewedAt: new Date(),
  });

  const planType = order.planType as PlanType;
  const planDefaults = applyPlanFeatures(planType);
  const planCode = PLAN_TYPE_TO_CODE[planType] || "CORE_STARTER";

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const sub = await storage.getSubscriptionByOwner(order.ownerId);
  if (sub) {
    const updateData: Record<string, any> = {
      planType,
      planCode,
      isActive: true,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      failedPaymentAttempts: 0,
      lastPaymentOrderId: orderId,
      ...planDefaults,
      startDate: isRenewal ? sub.startDate : now,
      endDate: periodEnd,
    };
    if (PLAN_TYPE_TO_CODE[planType] && sub.planCode !== planCode) {
      logger.info({ oldPlanCode: sub.planCode, newPlanCode: planCode, planType }, "Correcting planCode");
    }
    await storage.updateSubscription(sub.id, updateData);
  } else {
    await storage.createSubscription({
      ownerId: order.ownerId,
      tenantId: order.tenantId || null,
      planType,
      planCode,
      isActive: true,
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      failedPaymentAttempts: 0,
      lastPaymentOrderId: orderId,
      autoRenew: true,
      ...planDefaults,
      startDate: now,
      endDate: periodEnd,
    } as any);
  }

  const invoice = await storage.createInvoice({
    ownerId: order.ownerId,
    amount: order.amount,
    currency: order.currency,
    status: "paid",
    description: isRenewal
      ? `Auto-renewal: ${planType} plan`
      : `Epoint payment - ${planType} plan`,
    paidAt: now,
    periodStart: now,
    periodEnd: periodEnd,
    tenantId: order.tenantId || null,
  });

  try {
    const owner = await storage.getOwner(order.ownerId);
    await generateInvoicePdf(invoice, owner?.name || undefined);
  } catch (pdfErr: any) {
    logger.warn({ err: pdfErr.message, invoiceId: invoice.id }, "Invoice PDF generation failed — non-critical");
  }

  if (!isRenewal) {
    await storage.upsertOnboardingProgress({
      ownerId: order.ownerId,
      isComplete: true,
      currentStep: 4,
      completedSteps: [1, 2, 3, 4],
      tenantId: order.tenantId || order.ownerId,
    });
  }

  sendPaymentSuccessNotification({
    ownerId: order.ownerId,
    tenantId: order.tenantId || null,
    invoiceId: invoice.id,
    invoiceNumber: (invoice as any).invoiceNumber || undefined,
    amount: order.amount,
    currency: order.currency || "AZN",
    planType: planType,
    periodStart: now,
    periodEnd: periodEnd,
  }).catch(err => logger.warn({ err: err.message }, "Payment success email failed — non-critical"));

  logActionAsync({
    tenantId: order.tenantId || null,
    userId: order.ownerId,
    ownerId: order.ownerId,
    action: "payment_success",
    entityType: "payment_order",
    entityId: order.id,
    description: `Payment ${isRenewal ? "renewal" : "initial"} succeeded — ${order.amount} ${order.currency || "AZN"}`,
    newValues: { planType, amount: order.amount, isRenewal, invoiceId: invoice.id },
  });

  logger.info({ ownerId: order.ownerId, planType, isRenewal }, "Epoint payment processed");
}

async function processBookingPayment(order: any, callbackData: any, paymentStatus: string): Promise<void> {
  const orderId = order.id;
  const bookingId = order.referenceId;

  if (!bookingId) {
    logger.error({ orderId }, "Booking payment failed - no referenceId on order");
    await storage.updatePaymentOrder(orderId, {
      status: "rejected",
      adminNote: "Missing booking referenceId",
      reviewedAt: new Date(),
    });
    return;
  }

  if (paymentStatus !== "success") {
    logger.info({ bookingId }, "Booking payment failed");
    await storage.updatePaymentOrder(orderId, {
      status: "rejected",
      adminNote: `Epoint booking payment failed: ${callbackData.code || "unknown"}`,
      reviewedAt: new Date(),
    });
    await storage.updateBooking(bookingId, { paymentStatus: "failed" } as any);
    return;
  }

  logger.info({ bookingId }, "Booking payment success");
  await storage.updatePaymentOrder(orderId, {
    status: "approved",
    adminNote: `Booking payment approved via Epoint. Transaction: ${callbackData.transaction || ""}`,
    transferReference: callbackData.transaction || order.transferReference,
    reviewedAt: new Date(),
  });
  await storage.updateBooking(bookingId, { paymentStatus: "paid" } as any);
  await storage.autoCheckinIfReady(bookingId);
}

export function registerEpointRoutes(app: Express): void {

  app.post("/api/epoint/create-order", authenticateRequest, requireRole("owner_admin"), async (req, res) => {
    try {
      const privateKey = env.EPOINT_PRIVATE_KEY;
      const publicKey = env.EPOINT_PUBLIC_KEY;

      if (!privateKey || !publicKey) {
        logger.error({ hasPrivateKey: !!privateKey, hasPublicKey: !!publicKey }, "Missing Epoint environment variables");
        return res.status(503).json({ message: "Epoint payment is not configured. Please set EPOINT_PRIVATE_KEY and EPOINT_PUBLIC_KEY environment variables." });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });

      const { planCode } = req.body;
      if (!planCode || typeof planCode !== "string") {
        return res.status(400).json({ message: "Plan code is required" });
      }

      const planConfig = PLAN_CODE_FEATURES[planCode as PlanCode];
      if (!planConfig) return res.status(400).json({ message: "Invalid plan code" });

      const amountAZN = planConfig.priceMonthlyAZN.toFixed(2);
      const amountCents = Math.round(planConfig.priceMonthlyAZN * 100);
      const planType = PLAN_CODE_TO_TYPE[planCode as PlanCode];

      const baseUrl = env.BASE_URL;

      const order = await storage.createPaymentOrder({
        ownerId: user.ownerId,
        tenantId: req.tenantId || null,
        planType,
        amount: amountCents,
        currency: "AZN",
        status: "pending",
        paymentMethodId: null,
        customerNote: `Epoint payment - ${planCode}`,
        transferReference: null,
      });

      const merchantId = env.EPOINT_MERCHANT_ID;

      const epointData = {
        public_key: publicKey,
        merchant_id: merchantId,
        amount: amountAZN,
        currency: "AZN",
        language: "az",
        order_id: order.id,
        description: `O.S.S ${planConfig.displayName} plan subscription`,
        success_redirect_url: `${baseUrl}/settings?payment=success&orderId=${order.id}`,
        error_redirect_url: `${baseUrl}/settings?payment=declined&orderId=${order.id}`,
        callback_url: `${baseUrl}/api/epoint/webhook`,
      };

      logger.info({ description: epointData.description, amount: epointData.amount }, "Creating Epoint order");

      const { data, signature } = signData(privateKey, epointData);

      const requestBody = new URLSearchParams({ data, signature }).toString();

      const epointRes = await fetch(EPOINT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: requestBody,
      });

      const epointResponse = await epointRes.json() as any;

      logger.debug({ httpStatus: epointRes.status, responseBody: epointResponse }, "Epoint API response");

      if (epointResponse.status !== "success" || !epointResponse.redirect_url) {
        const errorReason = epointResponse.message || epointResponse.error || epointResponse.status || "Unknown error";
        logger.error({ errorReason, response: epointResponse }, "Epoint order creation failed");
        await storage.updatePaymentOrder(order.id, { status: "rejected", adminNote: `Epoint API error: ${errorReason}` });
        return res.status(502).json({ message: `Payment gateway error: ${errorReason}` });
      }

      await storage.updatePaymentOrder(order.id, {
        transferReference: epointResponse.transaction || null,
        customerNote: `Epoint transaction: ${epointResponse.transaction || ""}`,
      });

      res.json({
        paymentUrl: epointResponse.redirect_url,
        orderId: order.id,
      });
    } catch (error: any) {
      logger.error({ err: error }, "Create Epoint order error");
      res.status(500).json({ message: `Failed to create Epoint order: ${error?.message || "Unknown error"}` });
    }
  });

  app.post("/api/payments/retry", authenticateRequest, requireRole("owner_admin"), async (req, res) => {
    try {
      const privateKey = env.EPOINT_PRIVATE_KEY;
      const publicKey = env.EPOINT_PUBLIC_KEY;
      const merchantId = env.EPOINT_MERCHANT_ID;

      if (!privateKey || !publicKey) {
        return res.status(503).json({ message: "Payment gateway not configured" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const ownerId = user.ownerId || user.id;
      if (!ownerId) return res.status(400).json({ message: "No owner account" });

      const sub = await storage.getSubscriptionByOwner(ownerId);
      if (!sub) return res.status(404).json({ message: "No subscription found" });

      if (!["past_due", "suspended"].includes(sub.status)) {
        return res.status(400).json({ message: `Cannot retry payment for subscription with status: ${sub.status}` });
      }

      const planCode = (sub.planCode || "CORE_STARTER") as PlanCode;
      const planConfig = PLAN_CODE_FEATURES[planCode];
      if (!planConfig) return res.status(400).json({ message: "Invalid plan configuration" });

      const amountAZN = planConfig.priceMonthlyAZN.toFixed(2);
      const amountCents = Math.round(planConfig.priceMonthlyAZN * 100);
      const planType = sub.planType || PLAN_CODE_TO_TYPE[planCode] || "starter";
      const baseUrl = env.BASE_URL;

      const order = await storage.createPaymentOrder({
        ownerId,
        tenantId: sub.tenantId || req.tenantId || null,
        planType,
        orderType: "subscription_retry",
        amount: amountCents,
        currency: "AZN",
        status: "pending",
        paymentMethodId: null,
        customerNote: `Manual payment retry - ${planConfig.displayName} plan`,
        transferReference: null,
      } as any);

      const epointData = {
        public_key: publicKey,
        merchant_id: merchantId,
        amount: amountAZN,
        currency: "AZN",
        language: "az",
        order_id: order.id,
        description: `O.S.S ${planConfig.displayName} plan - payment retry`,
        success_redirect_url: `${baseUrl}/settings?payment=success&orderId=${order.id}`,
        error_redirect_url: `${baseUrl}/settings?payment=declined&orderId=${order.id}`,
        callback_url: `${baseUrl}/api/epoint/webhook`,
      };

      const { data, signature } = signData(privateKey, epointData);

      const epointRes = await fetch(EPOINT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data, signature }).toString(),
      });

      const epointResponse = await epointRes.json() as any;

      if (epointResponse.status !== "success" || !epointResponse.redirect_url) {
        const errorReason = epointResponse.message || epointResponse.error || "Unknown error";
        logger.error({ errorReason }, "Payment retry Epoint API error");
        await storage.updatePaymentOrder(order.id, { status: "rejected", adminNote: `Retry API error: ${errorReason}` });
        return res.status(502).json({ message: `Payment gateway error: ${errorReason}` });
      }

      await storage.updatePaymentOrder(order.id, {
        transferReference: epointResponse.transaction || null,
      });

      await storage.updateSubscription(sub.id, {
        lastPaymentOrderId: order.id,
      } as any);

      logger.info({ orderId: order.id, subId: sub.id, planCode }, "Manual payment retry initiated");

      res.json({
        paymentUrl: epointResponse.redirect_url,
        orderId: order.id,
      });
    } catch (error: any) {
      logger.error({ err: error }, "Payment retry error");
      res.status(500).json({ message: "Failed to initiate payment retry" });
    }
  });

  app.post("/api/epoint/create-booking-order", authenticateRequest, async (req, res) => {
    try {
      const privateKey = env.EPOINT_PRIVATE_KEY;
      const publicKey = env.EPOINT_PUBLIC_KEY;
      const merchantId = env.EPOINT_MERCHANT_ID;

      if (!privateKey || !publicKey) {
        logger.error({ hasPrivateKey: !!privateKey, hasPublicKey: !!publicKey }, "Missing Epoint environment variables for booking order");
        return res.status(503).json({ message: "Epoint payment is not configured. Please set EPOINT_PRIVATE_KEY and EPOINT_PUBLIC_KEY environment variables." });
      }

      const { bookingId, amount } = req.body;
      if (!bookingId || typeof bookingId !== "string") {
        return res.status(400).json({ message: "bookingId is required" });
      }
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if ((booking as any).paymentStatus === "paid") {
        return res.status(400).json({ message: "BOOKING_ALREADY_PAID" });
      }

      const user = await storage.getUser(req.session.userId!);
      const ownerId = user?.ownerId || req.session.userId!;

      const amountAZN = amount.toFixed(2);
      const amountCents = Math.round(amount * 100);
      const baseUrl = env.BASE_URL;

      const order = await storage.createPaymentOrder({
        ownerId,
        tenantId: (req as any).tenantId || null,
        planType: "booking_payment",
        orderType: "booking",
        referenceId: bookingId,
        amount: amountCents,
        currency: "AZN",
        status: "pending",
        paymentMethodId: null,
        customerNote: `Booking payment - Room ${booking.roomNumber}`,
        transferReference: null,
      } as any);

      const epointData = {
        public_key: publicKey,
        merchant_id: merchantId,
        amount: amountAZN,
        currency: "AZN",
        language: "az",
        order_id: order.id,
        description: `O.S.S Booking Payment Room ${booking.roomNumber}`,
        success_redirect_url: `${baseUrl}/dashboard?payment=success&bookingId=${bookingId}`,
        error_redirect_url: `${baseUrl}/dashboard?payment=declined&bookingId=${bookingId}`,
        callback_url: `${baseUrl}/api/epoint/webhook`,
      };

      logger.info({ orderId: order.id, bookingId, amount: amountAZN, room: booking.roomNumber }, "Creating Epoint booking order");

      const { data, signature } = signData(privateKey, epointData);

      const requestBody = new URLSearchParams({ data, signature }).toString();

      const epointRes = await fetch(EPOINT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: requestBody,
      });

      const epointResponse = await epointRes.json() as any;

      logger.debug({ httpStatus: epointRes.status, responseBody: epointResponse }, "Epoint booking API response");

      if (epointResponse.status !== "success" || !epointResponse.redirect_url) {
        const errorReason = epointResponse.message || epointResponse.error || epointResponse.status || "Unknown error";
        logger.error({ errorReason, response: epointResponse }, "Epoint booking order creation failed");
        await storage.updatePaymentOrder(order.id, { status: "rejected", adminNote: `Epoint API error: ${errorReason}` });
        return res.status(502).json({ message: `Payment gateway error: ${errorReason}` });
      }

      await storage.updatePaymentOrder(order.id, {
        transferReference: epointResponse.transaction || null,
        customerNote: `Booking Epoint transaction: ${epointResponse.transaction || ""}`,
      });

      res.json({
        paymentUrl: epointResponse.redirect_url,
        orderId: order.id,
      });
    } catch (error: any) {
      logger.error({ err: error }, "Create Epoint booking order error");
      res.status(500).json({ message: `Failed to create booking payment: ${error?.message || "Unknown error"}` });
    }
  });

  app.post("/api/epoint/webhook", async (req, res) => {
    try {
      const privateKey = env.EPOINT_PRIVATE_KEY;
      if (!privateKey) {
        logger.error("Webhook received but EPOINT_PRIVATE_KEY not configured");
        return res.status(500).json({ error: "Not configured" });
      }

      const { data, signature } = req.body;
      if (!data || !signature) {
        logger.error("Epoint webhook missing data or signature");
        return res.status(400).json({ error: "Missing data or signature" });
      }

      if (!verifySignature(privateKey, data, signature)) {
        logger.error("Epoint webhook signature verification failed");
        return res.status(403).json({ error: "Invalid signature" });
      }

      const callbackData = decodeData(data);
      const orderId = callbackData.order_id;
      const paymentStatus = callbackData.status;

      logger.info({ orderId, paymentStatus }, "Epoint webhook received");

      if (!orderId) {
        logger.error({ callbackData }, "Epoint webhook missing order_id");
        return res.status(400).json({ error: "Missing order_id" });
      }

      const order = await storage.getPaymentOrder(orderId);
      if (!order) {
        logger.error({ orderId }, "Epoint webhook: order not found");
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status !== "pending") {
        logger.info({ orderId, status: order.status }, "Epoint webhook: order already processed");
        return res.json({ status: "already_processed" });
      }

      if ((order as any).orderType === "booking") {
        await processBookingPayment(order, callbackData, paymentStatus);
      } else {
        await processEpointPayment(order, callbackData, paymentStatus);
      }

      res.json({ status: "ok" });
    } catch (error: any) {
      logger.error({ err: error }, "Epoint webhook error");
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.get("/api/epoint/check-order/:orderId", authenticateRequest, async (req, res) => {
    try {
      const privateKey = env.EPOINT_PRIVATE_KEY;
      const publicKey = env.EPOINT_PUBLIC_KEY;

      if (!privateKey || !publicKey) {
        logger.error({ hasPrivateKey: !!privateKey, hasPublicKey: !!publicKey }, "Missing Epoint environment variables for status check");
        return res.status(503).json({ message: "Epoint not configured. Please set EPOINT_PRIVATE_KEY and EPOINT_PUBLIC_KEY environment variables." });
      }

      const orderId = String(req.params.orderId);
      const order = await storage.getPaymentOrder(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });

      const user = await storage.getUser(req.session.userId!);
      if (user && user.role !== "oss_super_admin" && order.ownerId !== user.id && order.ownerId !== (user as any).ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (order.status !== "pending") {
        return res.json({ status: order.status });
      }

      const statusData = { public_key: publicKey, order_id: orderId };
      const { data, signature } = signData(privateKey, statusData);

      const statusRes = await fetch(EPOINT_STATUS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data, signature }).toString(),
      });

      const statusResponse = await statusRes.json() as any;
      logger.info({ orderId, status: statusResponse.status }, "Epoint status check result");

      if (statusResponse.status === "success") {
        if ((order as any).orderType === "booking") {
          await processBookingPayment(order, statusResponse, "success");
        } else {
          await processEpointPayment(order, statusResponse, "success");
        }
        return res.json({ status: "approved" });
      } else if (statusResponse.status === "error") {
        await storage.updatePaymentOrder(orderId, {
          status: "rejected",
          adminNote: `Epoint status check: payment failed`,
          reviewedAt: new Date(),
        });
        return res.json({ status: "rejected" });
      }

      res.json({ status: "pending" });
    } catch (error: any) {
      logger.error({ err: error }, "Epoint check order error");
      res.status(500).json({ message: "Failed to check order status" });
    }
  });

  app.get("/api/epoint/status", async (_req, res) => {
    const configured = !!(env.EPOINT_PRIVATE_KEY && env.EPOINT_PUBLIC_KEY);
    res.json({ configured });
  });

  const hasPrivateKey = !!env.EPOINT_PRIVATE_KEY;
  const hasPublicKey = !!env.EPOINT_PUBLIC_KEY;
  const hasMerchantId = !!env.EPOINT_MERCHANT_ID;
  logger.info({
    privateKey: hasPrivateKey ? "SET" : "MISSING",
    publicKey: hasPublicKey ? "SET" : "MISSING",
    merchantId: hasMerchantId ? "SET" : "MISSING",
    gatewayStatus: hasPrivateKey && hasPublicKey ? "READY" : "NOT CONFIGURED",
  }, "Epoint routes registered");
}
