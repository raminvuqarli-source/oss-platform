import type { Express, Request, Response } from "express";
import { requireAuth, requireRole } from "../middleware";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { z } from "zod";
import {
  requestRefund,
  getRefundRequests,
  getRefundsByOwner,
  approveRefund,
  rejectRefund,
  processRefund,
} from "../services/refundService";
import { logActionAsync } from "../services/auditLogService";

const refundLogger = logger.child({ module: "refund-routes" });

const requestRefundSchema = z.object({
  invoiceId: z.string().min(1),
  reason: z.string().min(1).max(1000),
});

const rejectRefundSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export function registerRefundRoutes(app: Express): void {
  app.post("/api/refunds/request", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = requestRefundSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request", errors: parsed.error.flatten() });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      if (user.role !== "owner_admin") {
        return res.status(403).json({ message: "Only organization owners can request refunds" });
      }

      const ownerId = user.id;
      const tenantId = req.tenantId || null;

      const refund = await requestRefund(
        parsed.data.invoiceId,
        parsed.data.reason,
        user.id,
        ownerId,
        tenantId
      );

      logActionAsync({
        tenantId: tenantId,
        userId: user.id,
        userRole: user.role,
        ownerId: ownerId,
        action: "refund_requested",
        entityType: "refund",
        entityId: refund.id,
        description: `Refund requested for invoice ${parsed.data.invoiceId}`,
        newValues: { invoiceId: parsed.data.invoiceId, reason: parsed.data.reason, amount: refund.amount },
      });

      res.status(201).json(refund);
    } catch (err: any) {
      if (err.message.includes("not found") || err.message.includes("Access denied") ||
          err.message.includes("Cannot request") || err.message.includes("already exists")) {
        return res.status(400).json({ message: err.message });
      }
      refundLogger.error({ err: err.message }, "Failed to request refund");
      res.status(500).json({ message: "Failed to request refund" });
    }
  });

  app.get("/api/refunds", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      if (user.role !== "owner_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const refunds = await getRefundsByOwner(user.id);
      res.json(refunds);
    } catch (err: any) {
      refundLogger.error({ err: err.message }, "Failed to list refunds");
      res.status(500).json({ message: "Failed to list refunds" });
    }
  });

  app.get("/api/admin/refunds", requireRole("oss_super_admin"), async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const refunds = await getRefundRequests(status);
      res.json(refunds);
    } catch (err: any) {
      refundLogger.error({ err: err.message }, "Failed to list refund requests");
      res.status(500).json({ message: "Failed to list refund requests" });
    }
  });

  app.post("/api/admin/refunds/:id/approve", requireRole("oss_super_admin"), async (req: Request, res: Response) => {
    try {
      const refund = await approveRefund(req.params.id as string, req.session.userId!);

      logActionAsync({
        userId: req.session.userId!,
        userRole: "oss_super_admin",
        action: "refund_approved",
        entityType: "refund",
        entityId: refund.id,
        description: `Refund ${refund.id} approved for invoice ${refund.invoiceId}`,
        newValues: { status: "approved" },
      });

      res.json(refund);
    } catch (err: any) {
      if (err.message.includes("not found") || err.message.includes("Cannot approve")) {
        return res.status(400).json({ message: err.message });
      }
      refundLogger.error({ err: err.message }, "Failed to approve refund");
      res.status(500).json({ message: "Failed to approve refund" });
    }
  });

  app.post("/api/admin/refunds/:id/reject", requireRole("oss_super_admin"), async (req: Request, res: Response) => {
    try {
      const parsed = rejectRefundSchema.safeParse(req.body);
      const rejectionReason = parsed.success ? parsed.data.reason : undefined;
      const refund = await rejectRefund(req.params.id as string, req.session.userId!, rejectionReason);
      res.json(refund);
    } catch (err: any) {
      if (err.message.includes("not found") || err.message.includes("Cannot reject")) {
        return res.status(400).json({ message: err.message });
      }
      refundLogger.error({ err: err.message }, "Failed to reject refund");
      res.status(500).json({ message: "Failed to reject refund" });
    }
  });

  app.post("/api/admin/refunds/:id/process", requireRole("oss_super_admin"), async (req: Request, res: Response) => {
    try {
      const refund = await processRefund(req.params.id as string);

      logActionAsync({
        userId: req.session.userId!,
        userRole: "oss_super_admin",
        action: "refund_processed",
        entityType: "refund",
        entityId: refund.id,
        description: `Refund ${refund.id} processed — invoice ${refund.invoiceId} marked refunded`,
        newValues: { status: "processed" },
      });

      res.json(refund);
    } catch (err: any) {
      if (err.message.includes("not found") || err.message.includes("Cannot process")) {
        return res.status(400).json({ message: err.message });
      }
      refundLogger.error({ err: err.message }, "Failed to process refund");
      res.status(500).json({ message: "Failed to process refund" });
    }
  });
}
