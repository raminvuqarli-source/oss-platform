import type { Express } from "express";
import { storage } from "../storage";
import { authenticateRequest, requireAuth, requireRole } from "../middleware";
import { logger } from "../utils/logger";
import { triggerRenewalCheck } from "../workers/subscriptionRenewalWorker";
import { logActionAsync } from "../services/auditLogService";

const subLogger = logger.child({ module: "subscription-routes" });

export function registerSubscriptionRoutes(app: Express): void {

  app.get("/api/subscription/status", authenticateRequest, requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });

      const sub = await storage.getSubscriptionByOwner(user.ownerId);
      if (!sub) return res.json({ hasSubscription: false });

      res.json({
        hasSubscription: true,
        id: sub.id,
        planType: sub.planType,
        planCode: sub.planCode,
        status: (sub as any).status || "active",
        isActive: sub.isActive,
        currentPeriodStart: (sub as any).currentPeriodStart,
        currentPeriodEnd: (sub as any).currentPeriodEnd,
        autoRenew: (sub as any).autoRenew ?? true,
        cancelAtPeriodEnd: (sub as any).cancelAtPeriodEnd ?? false,
        failedPaymentAttempts: (sub as any).failedPaymentAttempts ?? 0,
        trialEndsAt: sub.trialEndsAt,
        startDate: sub.startDate,
        endDate: sub.endDate,
      });
    } catch (error: any) {
      subLogger.error({ err: error }, "Failed to get subscription status");
      res.status(500).json({ message: "Failed to get subscription status" });
    }
  });

  app.patch("/api/subscription/auto-renew", authenticateRequest, requireRole("owner_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });

      const { autoRenew } = req.body;
      if (typeof autoRenew !== "boolean") {
        return res.status(400).json({ message: "autoRenew must be a boolean" });
      }

      const sub = await storage.getSubscriptionByOwner(user.ownerId);
      if (!sub) return res.status(404).json({ message: "No subscription found" });

      const updated = await storage.updateSubscription(sub.id, {
        autoRenew,
        cancelAtPeriodEnd: !autoRenew,
      } as any);

      subLogger.info({ subId: sub.id, autoRenew }, "Auto-renew updated");
      res.json({ success: true, autoRenew, cancelAtPeriodEnd: !autoRenew });
    } catch (error: any) {
      subLogger.error({ err: error }, "Failed to update auto-renew");
      res.status(500).json({ message: "Failed to update auto-renew setting" });
    }
  });

  app.post("/api/subscription/cancel", authenticateRequest, requireRole("owner_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });

      const sub = await storage.getSubscriptionByOwner(user.ownerId);
      if (!sub) return res.status(404).json({ message: "No subscription found" });

      await storage.updateSubscription(sub.id, {
        cancelAtPeriodEnd: true,
        autoRenew: false,
      } as any);

      logActionAsync({
        tenantId: req.tenantId,
        userId: user.id,
        userRole: user.role,
        ownerId: user.ownerId,
        action: "subscription_canceled",
        entityType: "subscription",
        entityId: sub.id,
        description: "Subscription set to cancel at period end",
        previousValues: { cancelAtPeriodEnd: false, autoRenew: true },
        newValues: { cancelAtPeriodEnd: true, autoRenew: false },
      });

      subLogger.info({ subId: sub.id, ownerId: user.ownerId }, "Subscription set to cancel at period end");
      res.json({
        success: true,
        message: "Subscription will be canceled at the end of the current billing period",
        currentPeriodEnd: (sub as any).currentPeriodEnd || sub.endDate,
      });
    } catch (error: any) {
      subLogger.error({ err: error }, "Failed to cancel subscription");
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  app.post("/api/subscription/reactivate", authenticateRequest, requireRole("owner_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });

      const sub = await storage.getSubscriptionByOwner(user.ownerId);
      if (!sub) return res.status(404).json({ message: "No subscription found" });

      const subStatus = (sub as any).status || "active";
      if (subStatus === "expired" || subStatus === "suspended") {
        return res.status(400).json({
          message: "Cannot reactivate an expired or suspended subscription. Please create a new subscription.",
        });
      }

      await storage.updateSubscription(sub.id, {
        cancelAtPeriodEnd: false,
        autoRenew: true,
      } as any);

      logActionAsync({
        tenantId: req.tenantId,
        userId: user.id,
        userRole: user.role,
        ownerId: user.ownerId,
        action: "subscription_reactivated",
        entityType: "subscription",
        entityId: sub.id,
        description: "Subscription reactivated — auto-renewal re-enabled",
        previousValues: { cancelAtPeriodEnd: true, autoRenew: false },
        newValues: { cancelAtPeriodEnd: false, autoRenew: true },
      });

      subLogger.info({ subId: sub.id, ownerId: user.ownerId }, "Subscription reactivated");
      res.json({ success: true, message: "Subscription reactivated — auto-renewal is back on" });
    } catch (error: any) {
      subLogger.error({ err: error }, "Failed to reactivate subscription");
      res.status(500).json({ message: "Failed to reactivate subscription" });
    }
  });

  app.post("/api/admin/trigger-renewal-check", authenticateRequest, requireRole("oss_super_admin"), async (req, res) => {
    try {
      subLogger.info("Manual renewal check triggered");
      await triggerRenewalCheck();
      res.json({ success: true, message: "Renewal check completed" });
    } catch (error: any) {
      subLogger.error({ err: error }, "Manual renewal check failed");
      res.status(500).json({ message: "Failed to run renewal check" });
    }
  });

  subLogger.info("Subscription management routes registered");
}
