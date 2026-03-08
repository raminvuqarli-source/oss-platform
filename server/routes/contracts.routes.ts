import type { Express } from "express";
import { storage } from "../storage";
import { authenticateRequest, requireRole } from "../middleware";
import { PLAN_CODE_FEATURES, SMART_PLAN_PRICING, isSmartPlanActive, type SmartPlanType } from "@shared/planFeatures";
import type { PlanCode } from "@shared/schema";
import { logger } from "../utils/logger";

const CONTRACT_VERSION = "v1.0";

export function registerContractRoutes(app: Express): void {

  app.post("/api/contracts/accept", authenticateRequest, requireRole("owner_admin"), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });

      const { planCode, planType, smartPlanType, contractLanguage } = req.body;
      if (!planCode || !planType) {
        return res.status(400).json({ message: "planCode and planType are required" });
      }

      const planConfig = PLAN_CODE_FEATURES[planCode as PlanCode];
      if (!planConfig) return res.status(400).json({ message: "Invalid plan code" });

      let monthlyPrice = planConfig.priceMonthlyUSD;
      const smartType = smartPlanType || "none";
      if (smartType !== "none" && !isSmartPlanActive(smartType as SmartPlanType)) {
        return res.status(400).json({ message: `Smart plan "${smartType}" is not currently available. Only Smart Lite is active.` });
      }
      if (smartType !== "none" && SMART_PLAN_PRICING[smartType as Exclude<SmartPlanType, "none">]) {
        monthlyPrice += SMART_PLAN_PRICING[smartType as Exclude<SmartPlanType, "none">].priceMonthlyUSD;
      }

      const properties = await storage.getPropertiesByOwner(user.ownerId);
      const propertyName = properties.length > 0 ? properties[0].name : null;

      const ipAddress = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";

      const acceptance = await storage.createContractAcceptance({
        ownerId: user.ownerId,
        tenantId: req.tenantId || null,
        userId,
        planCode,
        planType,
        smartPlanType: smartType,
        contractVersion: CONTRACT_VERSION,
        propertyName,
        monthlyPrice,
        currency: "USD",
        acceptedAt: new Date(),
        ipAddress,
        userAgent,
        contractLanguage: contractLanguage || "EN",
      });

      res.json({ success: true, contractId: acceptance.id });
    } catch (error: any) {
      logger.error({ err: error }, "Contract accept error");
      res.status(500).json({ message: "Failed to save contract acceptance" });
    }
  });

  app.get("/api/contracts/status", authenticateRequest, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user?.ownerId) return res.json({ accepted: false });

      const latest = await storage.getLatestContractAcceptance(user.ownerId);
      if (!latest) return res.json({ accepted: false });

      res.json({
        accepted: true,
        planCode: latest.planCode,
        smartPlanType: latest.smartPlanType,
        date: latest.acceptedAt,
        ip: latest.ipAddress,
        propertyName: latest.propertyName,
        price: latest.monthlyPrice,
        currency: latest.currency,
        contractVersion: latest.contractVersion,
        contractLanguage: latest.contractLanguage,
      });
    } catch (error: any) {
      logger.error({ err: error }, "Contract status error");
      res.status(500).json({ message: "Failed to get contract status" });
    }
  });
}
