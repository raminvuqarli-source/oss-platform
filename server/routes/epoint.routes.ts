import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { env } from "../config/env";
import { type PlanType, type PlanCode, PLAN_TYPE_TO_CODE } from "@shared/schema";
import { applyPlanFeatures, PLAN_CODE_FEATURES, SMART_PLAN_PRICING } from "@shared/planFeatures";
import { authenticateRequest, requireAuth, requireRole } from "../middleware";
import { WHATSAPP_PACKAGES } from "./billing-addons.routes";
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
const EPOINT_MAX_AZN = 800;

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

  // Check if this is a split payment
  let splitMeta: { splitIndex: number; splitTotal: number; splitGroupId: string } | null = null;
  try {
    if (order.customerNote) {
      const noteData = JSON.parse(order.customerNote);
      if (noteData.splitIndex && noteData.splitTotal) {
        splitMeta = noteData;
      }
    }
  } catch { /* not JSON or no split info */ }

  if (splitMeta && splitMeta.splitIndex < splitMeta.splitTotal) {
    logger.info({ orderId, splitIndex: splitMeta.splitIndex, splitTotal: splitMeta.splitTotal }, "Split payment partial — subscription not yet activated");
    logActionAsync({
      tenantId: order.tenantId || null,
      userId: order.ownerId,
      ownerId: order.ownerId,
      action: "payment_split_partial",
      entityType: "payment_order",
      entityId: orderId,
      description: `Split payment ${splitMeta.splitIndex}/${splitMeta.splitTotal} completed — ${order.amount} ${order.currency || "AZN"}`,
      newValues: { splitIndex: splitMeta.splitIndex, splitTotal: splitMeta.splitTotal },
    });
    return;
  }

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

async function processWhatsappPayment(order: any, callbackData: any, paymentStatus: string): Promise<void> {
  const orderId = order.id;

  if (paymentStatus !== "success") {
    await storage.updatePaymentOrder(orderId, {
      status: "rejected",
      adminNote: `Epoint WhatsApp payment failed: ${callbackData.code || "unknown"}`,
      reviewedAt: new Date(),
    });
    logger.info({ orderId }, "WhatsApp payment failed");
    return;
  }

  // Parse package metadata from customerNote
  let meta: { packageId: string; hotelId: string; tenantId: string } | null = null;
  try {
    if (order.customerNote) meta = JSON.parse(order.customerNote);
  } catch { /* ignore */ }

  if (!meta?.packageId || !meta?.hotelId) {
    logger.error({ orderId, customerNote: order.customerNote }, "WhatsApp payment missing metadata");
    await storage.updatePaymentOrder(orderId, { status: "rejected", adminNote: "Missing WhatsApp package metadata" });
    return;
  }

  const pkg = WHATSAPP_PACKAGES.find((p) => p.id === meta!.packageId);
  if (!pkg) {
    logger.error({ packageId: meta.packageId }, "WhatsApp payment unknown packageId");
    await storage.updatePaymentOrder(orderId, { status: "rejected", adminNote: `Unknown package: ${meta.packageId}` });
    return;
  }

  const hotel = await storage.getHotel(meta.hotelId);
  if (!hotel) {
    logger.error({ hotelId: meta.hotelId }, "WhatsApp payment hotel not found");
    await storage.updatePaymentOrder(orderId, { status: "rejected", adminNote: `Hotel not found: ${meta.hotelId}` });
    return;
  }

  const newBalance = (hotel.whatsappBalance ?? 0) + pkg.messages;
  await storage.updateHotelBilling(meta.hotelId, { isWhatsappEnabled: true, whatsappBalance: newBalance });

  await storage.updatePaymentOrder(orderId, {
    status: "approved",
    adminNote: `WhatsApp package ${pkg.name} approved via Epoint. Transaction: ${callbackData.transaction || ""}`,
    transferReference: callbackData.transaction || order.transferReference,
    reviewedAt: new Date(),
  });

  await storage.createBillingLog({
    tenantId: meta.tenantId || meta.hotelId,
    hotelId: meta.hotelId,
    ownerId: order.ownerId,
    eventType: "whatsapp_package",
    description: `Purchased WhatsApp ${pkg.name} package — ${pkg.messages} messages (Epoint)`,
    amountUsd: String(pkg.priceUsd),
    messagesAdded: pkg.messages,
    packageName: pkg.name,
    status: "completed",
  });

  logger.info({ orderId, hotelId: meta.hotelId, pkg: pkg.name, newBalance }, "WhatsApp payment processed successfully");
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

      const { planCode, smartPlanCode, smartRoomCount } = req.body;
      if (!planCode || typeof planCode !== "string") {
        return res.status(400).json({ message: "Plan code is required" });
      }

      const planConfig = PLAN_CODE_FEATURES[planCode as PlanCode];
      if (!planConfig) return res.status(400).json({ message: "Invalid plan code" });

      let totalAZN = planConfig.priceMonthlyAZN;
      let descriptionParts = [`${planConfig.displayName} plan`];

      if (smartPlanCode && typeof smartPlanCode === "string" && smartPlanCode !== "none") {
        const smartConfig = SMART_PLAN_PRICING[smartPlanCode as keyof typeof SMART_PLAN_PRICING];
        if (smartConfig) {
          const rooms = Math.max(1, parseInt(smartRoomCount, 10) || 1);
          const smartTotal = smartConfig.priceMonthlyAZN * rooms;
          totalAZN += smartTotal;
          descriptionParts.push(`${smartConfig.displayName} x${rooms} rooms`);
        }
      }

      const planType = PLAN_CODE_TO_TYPE[planCode as PlanCode];
      const baseUrl = env.BASE_URL;
      const merchantId = env.EPOINT_MERCHANT_ID;

      // Split payment logic: Epoint max = 800 AZN per transaction
      const isSplit = totalAZN > EPOINT_MAX_AZN;
      const splitTotal = isSplit ? Math.ceil(totalAZN / EPOINT_MAX_AZN) : 1;
      const splitGroupId = isSplit ? crypto.randomUUID() : null;
      const firstSplitAZN = isSplit ? Math.min(EPOINT_MAX_AZN, totalAZN) : totalAZN;
      const firstSplitCents = Math.round(firstSplitAZN * 100);
      const totalCents = Math.round(totalAZN * 100);

      const splitNote = isSplit
        ? JSON.stringify({ splitGroupId, splitIndex: 1, splitTotal, planCode, smartPlanCode: smartPlanCode || null, smartRoomCount: smartRoomCount || 0, totalAmountAZN: totalAZN })
        : `Epoint payment - ${planCode}${smartPlanCode && smartPlanCode !== "none" ? ` + ${smartPlanCode} x${smartRoomCount || 1}` : ""}`;

      const order = await storage.createPaymentOrder({
        ownerId: user.ownerId,
        tenantId: req.tenantId || null,
        planType,
        amount: isSplit ? firstSplitCents : totalCents,
        currency: "AZN",
        status: "pending",
        paymentMethodId: null,
        customerNote: splitNote,
        transferReference: null,
      });

      // Keep URLs short — only orderId; all split metadata is stored in customerNote
      const successUrl = isSplit
        ? `${baseUrl}/settings?payment=split_pending&orderId=${order.id}`
        : `${baseUrl}/settings?payment=success&orderId=${order.id}`;

      const epointData = {
        public_key: publicKey,
        merchant_id: merchantId,
        amount: (isSplit ? firstSplitAZN : totalAZN).toFixed(2),
        currency: "AZN",
        language: "az",
        order_id: order.id,
        description: `OSS ${planCode}` + (isSplit ? ` p1of${splitTotal}` : ""),
        success_redirect_url: successUrl,
        error_redirect_url: `${baseUrl}/settings?payment=declined&orderId=${order.id}`,
        callback_url: `${baseUrl}/api/epoint/webhook`,
      };

      logger.info({ description: epointData.description, amount: epointData.amount, isSplit, splitTotal }, "Creating Epoint order");

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
        // Preserve split metadata in customerNote; only update if not a split order
        ...(isSplit ? {} : { customerNote: `Epoint transaction: ${epointResponse.transaction || ""}` }),
      });

      res.json({
        paymentUrl: epointResponse.redirect_url,
        orderId: order.id,
        isSplit,
        splitTotal: isSplit ? splitTotal : 1,
      });
    } catch (error: any) {
      logger.error({ err: error }, "Create Epoint order error");
      res.status(500).json({ message: `Failed to create Epoint order: ${error?.message || "Unknown error"}` });
    }
  });

  // ============== SPLIT STATUS (frontend reads metadata by orderId) ==============
  app.get("/api/epoint/split-status/:orderId", authenticateRequest, requireRole("owner_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });

      const order = await storage.getPaymentOrder(String(req.params.orderId));
      if (!order || order.ownerId !== user.ownerId) {
        return res.status(404).json({ message: "Order not found" });
      }

      let meta: any = null;
      try {
        if (order.customerNote) meta = JSON.parse(order.customerNote);
      } catch { /* not JSON */ }

      if (!meta?.splitGroupId) {
        return res.status(400).json({ message: "Not a split order" });
      }

      // Safe paid calculation: min(total, splitIndex * chunkSize)
      const paidSoFar = Math.min(meta.totalAmountAZN, meta.splitIndex * EPOINT_MAX_AZN);
      const remaining = Math.max(0, parseFloat((meta.totalAmountAZN - paidSoFar).toFixed(2)));

      res.json({
        splitGroupId: meta.splitGroupId,
        splitIndex: meta.splitIndex,
        splitTotal: meta.splitTotal,
        planCode: meta.planCode,
        smartPlanCode: meta.smartPlanCode || "",
        smartRoomCount: meta.smartRoomCount || 0,
        totalAmountAZN: meta.totalAmountAZN,
        paidAZN: parseFloat(paidSoFar.toFixed(2)),
        remainingAZN: remaining,
        planType: order.planType,
        prevOrderId: orderId,
      });
    } catch (error: any) {
      logger.error({ err: error }, "Split status fetch error");
      res.status(500).json({ message: "Failed to fetch split status" });
    }
  });

  // ============== SPLIT PAYMENT: NEXT PART ==============
  app.post("/api/epoint/next-split", authenticateRequest, requireRole("owner_admin"), async (req, res) => {
    try {
      const privateKey = env.EPOINT_PRIVATE_KEY;
      const publicKey = env.EPOINT_PUBLIC_KEY;
      const merchantId = env.EPOINT_MERCHANT_ID;

      if (!privateKey || !publicKey) {
        return res.status(503).json({ message: "Epoint payment is not configured." });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });

      // Load metadata from the previous split order
      const { prevOrderId } = req.body;
      if (!prevOrderId) return res.status(400).json({ message: "prevOrderId is required" });

      const prevOrder = await storage.getPaymentOrder(String(prevOrderId));
      if (!prevOrder || prevOrder.ownerId !== user.ownerId) {
        return res.status(404).json({ message: "Previous order not found" });
      }

      let meta: any = null;
      try {
        if (prevOrder.customerNote) meta = JSON.parse(prevOrder.customerNote);
      } catch { /* ignore */ }

      if (!meta?.splitGroupId) return res.status(400).json({ message: "Not a split order" });

      const { splitGroupId, splitIndex, splitTotal, planCode, smartPlanCode, smartRoomCount, totalAmountAZN } = meta;
      const nextSplitIndex = splitIndex + 1;
      // Safe paid calculation: min(total, splitIndex * chunkSize)
      const alreadyPaidAZN = Math.min(totalAmountAZN, splitIndex * EPOINT_MAX_AZN);
      const remainingAZN = Math.max(0, parseFloat((totalAmountAZN - alreadyPaidAZN).toFixed(2)));

      const currentSplitAZN = Math.min(EPOINT_MAX_AZN, remainingAZN);
      const currentSplitCents = Math.round(currentSplitAZN * 100);
      const isLastSplit = nextSplitIndex >= splitTotal;

      const baseUrl = env.BASE_URL;

      const splitNote = JSON.stringify({
        splitGroupId, splitIndex: nextSplitIndex, splitTotal,
        planCode, smartPlanCode: smartPlanCode || null, smartRoomCount: smartRoomCount || 0,
        totalAmountAZN,
      });

      const order = await storage.createPaymentOrder({
        ownerId: user.ownerId,
        tenantId: req.tenantId || null,
        planType: prevOrder.planType || PLAN_CODE_TO_TYPE[planCode as PlanCode],
        amount: currentSplitCents,
        currency: "AZN",
        status: "pending",
        paymentMethodId: null,
        customerNote: splitNote,
        transferReference: null,
      });

      // Short URL — metadata lives in customerNote on the order
      const successUrl = isLastSplit
        ? `${baseUrl}/settings?payment=success&orderId=${order.id}`
        : `${baseUrl}/settings?payment=split_pending&orderId=${order.id}`;

      const epointData = {
        public_key: publicKey,
        merchant_id: merchantId,
        amount: currentSplitAZN.toFixed(2),
        currency: "AZN",
        language: "az",
        order_id: order.id,
        description: `OSS ${planCode} p${nextSplitIndex}of${splitTotal}`,
        success_redirect_url: successUrl,
        error_redirect_url: `${baseUrl}/settings?payment=declined&orderId=${order.id}`,
        callback_url: `${baseUrl}/api/epoint/webhook`,
      };

      logger.info({ splitIndex, splitTotal, amount: currentSplitAZN, isLastSplit }, "Creating next split Epoint order");

      const { data, signature } = signData(privateKey, epointData);
      const requestBody = new URLSearchParams({ data, signature }).toString();

      const epointRes = await fetch(EPOINT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: requestBody,
      });

      const epointResponse = await epointRes.json() as any;

      if (epointResponse.status !== "success" || !epointResponse.redirect_url) {
        const errorReason = epointResponse.message || epointResponse.error || epointResponse.status || "Unknown error";
        await storage.updatePaymentOrder(order.id, { status: "rejected", adminNote: `Epoint API error: ${errorReason}` });
        return res.status(502).json({ message: `Payment gateway error: ${errorReason}` });
      }

      res.json({ paymentUrl: epointResponse.redirect_url, orderId: order.id });
    } catch (error: any) {
      logger.error({ err: error }, "Next split Epoint order error");
      res.status(500).json({ message: `Failed to create next split order: ${error?.message || "Unknown error"}` });
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
        return res.status(503).json({ message: "Ödəniş sistemi konfiqurasiya edilməyib. Zəhmət olmasa sahiblə əlaqə saxlayın." });
      }

      const { bookingId, amount } = req.body;
      if (!bookingId || typeof bookingId !== "string") {
        return res.status(400).json({ message: "bookingId is required" });
      }

      // Accept amount as number or numeric string
      const amountNum = typeof amount === "string" ? parseFloat(amount) : Number(amount);
      if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ message: "Ödəniş məbləği müəyyən edilə bilmədi. Zəhmət olmasa resepsiyanla əlaqə saxlayın." });
      }

      // Fetch booking using raw SQL to avoid schema/column mismatch issues
      const bookingResult = await db.execute(
        sql`SELECT * FROM bookings WHERE id = ${bookingId} LIMIT 1`
      );
      const bookingRows = (bookingResult as any).rows ?? bookingResult;
      if (!bookingRows || bookingRows.length === 0) {
        return res.status(404).json({ message: "Rezervasiya tapılmadı" });
      }
      const bookingRow = bookingRows[0];

      if (bookingRow.payment_status === "paid") {
        return res.status(400).json({ message: "BOOKING_ALREADY_PAID" });
      }

      // Use booking's actual owner ID for the payment record
      const ownerId = bookingRow.owner_id || req.session.userId!;
      const tenantId = bookingRow.tenant_id || (req as any).tenantId || null;

      // Ensure amount is in AZN (not qəpik)
      // nightlyRate/totalPrice stored as integer AZN in DB (e.g. 150 = 150 AZN)
      const amountAZN = parseFloat(amountNum.toFixed(2));
      const amountCents = Math.round(amountAZN * 100);
      const baseUrl = env.BASE_URL;

      // Epoint max is 800 AZN per transaction
      if (amountAZN > EPOINT_MAX_AZN) {
        return res.status(400).json({ 
          message: `Ödəniş məbləği ${amountAZN} AZN Epoint maksimum həddini (${EPOINT_MAX_AZN} AZN) keçir. Zəhmət olmasa resepsiyanla əlaqə saxlayın.` 
        });
      }

      const order = await storage.createPaymentOrder({
        ownerId,
        tenantId,
        planType: "booking_payment",
        orderType: "booking",
        referenceId: bookingId,
        amount: amountCents,
        currency: "AZN",
        status: "pending",
        paymentMethodId: null,
        customerNote: `Booking payment - Room ${bookingRow.room_number || bookingId}`,
        transferReference: null,
      } as any);

      // Use ASCII-safe description for Epoint
      const roomDesc = (bookingRow.room_number || "").replace(/[^\x00-\x7F]/g, "").trim() || bookingId.slice(0, 8);
      const epointData = {
        public_key: publicKey,
        merchant_id: merchantId,
        amount: amountAZN.toFixed(2),
        currency: "AZN",
        language: "az",
        order_id: order.id,
        description: `OSS Booking ${roomDesc}`.slice(0, 50),
        success_redirect_url: `${baseUrl}/dashboard?payment=success&bookingId=${bookingId}`,
        error_redirect_url: `${baseUrl}/dashboard?payment=declined&bookingId=${bookingId}`,
        callback_url: `${baseUrl}/api/epoint/webhook`,
      };

      logger.info({ orderId: order.id, bookingId, amountAZN, room: bookingRow.room_number, baseUrl }, "Creating Epoint booking order");

      const { data, signature } = signData(privateKey, epointData);
      const requestBody = new URLSearchParams({ data, signature }).toString();

      const epointRes = await fetch(EPOINT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: requestBody,
      });

      const epointResponse = await epointRes.json() as any;

      logger.info({ httpStatus: epointRes.status, epointStatus: epointResponse.status, hasRedirect: !!epointResponse.redirect_url, orderId: order.id }, "Epoint booking API response");

      if (epointResponse.status !== "success" || !epointResponse.redirect_url) {
        const errorReason = epointResponse.message || epointResponse.error || String(epointResponse.status) || "Unknown error";
        logger.error({ errorReason, response: epointResponse, orderId: order.id, amountAZN }, "Epoint booking order creation failed");
        await storage.updatePaymentOrder(order.id, { status: "rejected", adminNote: `Epoint API error: ${errorReason}` });
        return res.status(400).json({ message: `Ödəniş sistemi xətası: ${errorReason}` });
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
      logger.error({ err: error, errMsg: error?.message, stack: error?.stack }, "Create Epoint booking order error");
      res.status(500).json({ message: `Ödəniş xətası: ${error?.message || "Bilinməyən xəta"}` });
    }
  });

  // ============== WHATSAPP PACKAGE — EPOINT ORDER ==============
  app.post("/api/billing/whatsapp/epoint-order", requireAuth, async (req, res) => {
    try {
      const privateKey = env.EPOINT_PRIVATE_KEY;
      const publicKey = env.EPOINT_PUBLIC_KEY;
      const merchantId = env.EPOINT_MERCHANT_ID;
      const baseUrl = env.BASE_URL;

      if (!privateKey || !publicKey) {
        return res.status(503).json({ message: "Epoint payment is not configured." });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      if (!["owner_admin", "admin", "property_manager"].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const tenantId = req.session.demoSessionTenantId || user.tenantId || user.ownerId || null;
      if (!tenantId) return res.status(403).json({ message: "No tenant" });

      const { packageId } = req.body;
      const pkg = WHATSAPP_PACKAGES.find((p) => p.id === packageId);
      if (!pkg) return res.status(400).json({ message: "Invalid package" });

      const hotels = await storage.getAllHotels(tenantId);
      const hotel = hotels[0];
      if (!hotel) return res.status(404).json({ message: "Hotel not found" });

      const amountAZN = pkg.priceAZN;
      const amountCents = Math.round(amountAZN * 100);

      const ownerId = user.ownerId || user.id;

      const order = await storage.createPaymentOrder({
        ownerId,
        tenantId,
        planType: "whatsapp_package" as any,
        orderType: "whatsapp_package",
        amount: amountCents,
        currency: "AZN",
        status: "pending",
        paymentMethodId: null,
        customerNote: JSON.stringify({ packageId, hotelId: hotel.id, tenantId }),
        transferReference: null,
      } as any);

      const epointData = {
        public_key: publicKey,
        merchant_id: merchantId,
        amount: amountAZN.toFixed(2),
        currency: "AZN",
        language: "az",
        order_id: order.id,
        description: `OSS WhatsApp ${pkg.name} (${pkg.messages} msg)`,
        success_redirect_url: `${baseUrl}/dashboard?view=billing-addons&payment=success&orderId=${order.id}`,
        error_redirect_url: `${baseUrl}/dashboard?view=billing-addons&payment=declined&orderId=${order.id}`,
        callback_url: `${baseUrl}/api/epoint/webhook`,
      };

      logger.info({ orderId: order.id, pkg: pkg.name, amount: amountAZN }, "Creating Epoint WhatsApp order");

      const { data, signature } = signData(privateKey, epointData);
      const requestBody = new URLSearchParams({ data, signature }).toString();

      const epointRes = await fetch(EPOINT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: requestBody,
      });

      const epointResponse = await epointRes.json() as any;

      if (epointResponse.status !== "success" || !epointResponse.redirect_url) {
        const errorReason = epointResponse.message || epointResponse.error || epointResponse.status || "Unknown error";
        logger.error({ errorReason, response: epointResponse }, "Epoint WhatsApp order creation failed");
        await storage.updatePaymentOrder(order.id, { status: "rejected", adminNote: `Epoint API error: ${errorReason}` });
        return res.status(502).json({ message: `Payment gateway error: ${errorReason}` });
      }

      await storage.updatePaymentOrder(order.id, {
        transferReference: epointResponse.transaction || null,
      });

      return res.json({ paymentUrl: epointResponse.redirect_url, orderId: order.id });
    } catch (error: any) {
      logger.error({ err: error }, "Create Epoint WhatsApp order error");
      res.status(500).json({ message: `Failed to create payment: ${error?.message || "Unknown error"}` });
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
      } else if ((order as any).orderType === "whatsapp_package") {
        await processWhatsappPayment(order, callbackData, paymentStatus);
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
        } else if ((order as any).orderType === "whatsapp_package") {
          await processWhatsappPayment(order, statusResponse, "success");
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
