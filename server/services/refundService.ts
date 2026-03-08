import { db } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import { refundRequests, invoices, financialTransactions } from "@shared/schema";
import type { RefundRequest, InsertRefundRequest } from "@shared/schema";
import { logger } from "../utils/logger";
import { storage } from "../storage";
import { sendRefundApprovedNotification } from "./billingEmailService";

const refundLogger = logger.child({ module: "refund-service" });

export async function requestRefund(
  invoiceId: string,
  reason: string,
  requestedBy: string,
  ownerId: string,
  tenantId: string | null
): Promise<RefundRequest> {
  const invoice = await storage.getInvoice(invoiceId);
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.ownerId !== ownerId) {
    throw new Error("Access denied: invoice does not belong to this organization");
  }

  if (tenantId && invoice.tenantId && invoice.tenantId !== tenantId) {
    throw new Error("Access denied: invoice does not belong to this tenant");
  }

  if (invoice.status !== "paid") {
    throw new Error(`Cannot request refund for invoice with status: ${invoice.status}`);
  }

  const existing = await db
    .select()
    .from(refundRequests)
    .where(
      and(
        eq(refundRequests.invoiceId, invoiceId),
        sql`${refundRequests.status} IN ('pending', 'approved')`
      )
    );

  if (existing.length > 0) {
    throw new Error("A refund request already exists for this invoice");
  }

  let transactionId: string | undefined;
  const [relatedTx] = await db
    .select()
    .from(financialTransactions)
    .where(
      and(
        eq(financialTransactions.ownerId, ownerId),
        eq(financialTransactions.paymentStatus, "paid"),
        sql`${financialTransactions.transactionReference} = ${invoiceId}`
      )
    );
  if (relatedTx) {
    transactionId = relatedTx.id;
  }

  const [refund] = await db
    .insert(refundRequests)
    .values({
      invoiceId,
      transactionId: transactionId || null,
      ownerId,
      tenantId: tenantId || invoice.tenantId,
      amount: invoice.amount,
      currency: invoice.currency,
      reason,
      status: "pending",
      requestedBy,
    })
    .returning();

  refundLogger.info({ refundId: refund.id, invoiceId, transactionId, amount: invoice.amount }, "Refund requested");
  return refund;
}

export async function getRefundRequests(status?: string): Promise<RefundRequest[]> {
  if (status) {
    return db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.status, status))
      .orderBy(desc(refundRequests.createdAt));
  }
  return db
    .select()
    .from(refundRequests)
    .orderBy(desc(refundRequests.createdAt));
}

export async function getRefundRequest(id: string): Promise<RefundRequest | undefined> {
  const [refund] = await db
    .select()
    .from(refundRequests)
    .where(eq(refundRequests.id, id));
  return refund;
}

export async function getRefundsByOwner(ownerId: string): Promise<RefundRequest[]> {
  return db
    .select()
    .from(refundRequests)
    .where(eq(refundRequests.ownerId, ownerId))
    .orderBy(desc(refundRequests.createdAt));
}

export async function approveRefund(refundId: string, adminId: string): Promise<RefundRequest> {
  const refund = await getRefundRequest(refundId);
  if (!refund) {
    throw new Error("Refund request not found");
  }

  if (refund.status !== "pending") {
    throw new Error(`Cannot approve refund with status: ${refund.status}`);
  }

  const [updated] = await db
    .update(refundRequests)
    .set({
      status: "approved",
      approvedBy: adminId,
    })
    .where(eq(refundRequests.id, refundId))
    .returning();

  refundLogger.info({ refundId, adminId }, "Refund approved");

  sendRefundApprovedNotification({
    ownerId: updated.ownerId,
    refundId: updated.id,
    amount: updated.amount || 0,
    currency: updated.currency || "AZN",
  }).catch(err => refundLogger.warn({ err: err.message }, "Refund approved email failed — non-critical"));

  return updated;
}

export async function rejectRefund(
  refundId: string,
  adminId: string,
  rejectionReason?: string
): Promise<RefundRequest> {
  const refund = await getRefundRequest(refundId);
  if (!refund) {
    throw new Error("Refund request not found");
  }

  if (refund.status !== "pending") {
    throw new Error(`Cannot reject refund with status: ${refund.status}`);
  }

  const [updated] = await db
    .update(refundRequests)
    .set({
      status: "rejected",
      rejectedBy: adminId,
      rejectionReason: rejectionReason || null,
    })
    .where(eq(refundRequests.id, refundId))
    .returning();

  refundLogger.info({ refundId, adminId, rejectionReason }, "Refund rejected");
  return updated;
}

export async function processRefund(refundId: string): Promise<RefundRequest> {
  const refund = await getRefundRequest(refundId);
  if (!refund) {
    throw new Error("Refund request not found");
  }

  if (refund.status !== "approved") {
    throw new Error(`Cannot process refund with status: ${refund.status}. Must be approved first.`);
  }

  await storage.updateInvoice(refund.invoiceId, {
    status: "refunded",
  });

  if (refund.transactionId) {
    await db
      .update(financialTransactions)
      .set({
        paymentStatus: "refunded",
        updatedAt: new Date(),
      })
      .where(eq(financialTransactions.id, refund.transactionId));
  }

  const [updated] = await db
    .update(refundRequests)
    .set({
      status: "processed",
      processedAt: new Date(),
    })
    .where(eq(refundRequests.id, refundId))
    .returning();

  refundLogger.info(
    { refundId, invoiceId: refund.invoiceId, amount: refund.amount },
    "Refund processed"
  );
  return updated;
}
