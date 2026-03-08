import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth, requireRole } from "../middleware";
import { logger } from "../utils/logger";
import { getJobQueue } from "../services/jobQueue";
import { enqueueOtaSync } from "../workers/otaSyncWorker";
import { z } from "zod";

const rpLogger = logger.child({ module: "rate-plans" });

const createRatePlanSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(1).max(100),
  refundPolicy: z.enum(["flexible", "moderate", "strict", "non_refundable"]).default("flexible"),
  mealPlan: z.enum(["none", "breakfast", "half_board", "full_board", "all_inclusive"]).default("none"),
  priceModifier: z.number().min(-100).max(200).default(0),
  isActive: z.boolean().default(true),
});

const updateRatePlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  refundPolicy: z.enum(["flexible", "moderate", "strict", "non_refundable"]).optional(),
  mealPlan: z.enum(["none", "breakfast", "half_board", "full_board", "all_inclusive"]).optional(),
  priceModifier: z.number().min(-100).max(200).optional(),
  isActive: z.boolean().optional(),
});

export function registerRatePlanRoutes(app: Express): void {

  app.get("/api/rate-plans/:propertyId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params;
      const tenantId = req.tenantId;
      if (!tenantId) return res.status(403).json({ message: "Tenant not resolved" });

      const plans = await storage.getRatePlansByProperty(propertyId as string, tenantId);
      res.json(plans);
    } catch (err) {
      rpLogger.error({ err }, "Failed to fetch rate plans");
      res.status(500).json({ message: "Failed to fetch rate plans" });
    }
  });

  app.post("/api/rate-plans", requireRole("owner_admin", "admin", "property_manager"), async (req: Request, res: Response) => {
    try {
      const parsed = createRatePlanSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten().fieldErrors });
      }

      const { propertyId, name, refundPolicy, mealPlan, priceModifier, isActive } = parsed.data;
      const tenantId = req.tenantId;
      if (!tenantId) return res.status(403).json({ message: "Tenant not resolved" });

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      if (user.role !== "oss_super_admin") {
        const property = await storage.getProperty(propertyId);
        if (!property || (property.ownerId !== user.ownerId && property.ownerId !== user.id)) {
          return res.status(403).json({ message: "Access denied to this property" });
        }
      }

      const ratePlan = await storage.createRatePlan({
        propertyId,
        tenantId,
        name,
        refundPolicy,
        mealPlan,
        priceModifier,
        isDefault: false,
        isActive,
      });

      rpLogger.info({ ratePlanId: ratePlan.id, propertyId, name }, "Rate plan created");
      res.status(201).json(ratePlan);
    } catch (err) {
      rpLogger.error({ err }, "Failed to create rate plan");
      res.status(500).json({ message: "Failed to create rate plan" });
    }
  });

  app.patch("/api/rate-plans/:id", requireRole("owner_admin", "admin", "property_manager"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = await storage.getRatePlan(id as string);
      if (!existing) return res.status(404).json({ message: "Rate plan not found" });

      if (existing.tenantId !== req.tenantId && req.tenantUser?.role !== "oss_super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const parsed = updateRatePlanSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten().fieldErrors });
      }

      const updated = await storage.updateRatePlan(id as string, parsed.data);
      rpLogger.info({ ratePlanId: id }, "Rate plan updated");

      if (existing.propertyId) {
        try {
          const boss = await getJobQueue();
          await enqueueOtaSync(boss, existing.propertyId, req.tenantId || null, "push_rates", "rate_plan_updated");
        } catch (otaErr) {
          rpLogger.warn({ err: otaErr, ratePlanId: id }, "Failed to enqueue OTA rates sync");
        }
      }

      res.json(updated);
    } catch (err) {
      rpLogger.error({ err }, "Failed to update rate plan");
      res.status(500).json({ message: "Failed to update rate plan" });
    }
  });

  app.delete("/api/rate-plans/:id", requireRole("owner_admin", "admin", "property_manager"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = await storage.getRatePlan(id as string);
      if (!existing) return res.status(404).json({ message: "Rate plan not found" });

      if (existing.tenantId !== req.tenantId && req.tenantUser?.role !== "oss_super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      if (existing.isDefault) {
        return res.status(400).json({ message: "Cannot delete the default rate plan" });
      }

      await storage.deleteRatePlan(id as string);
      rpLogger.info({ ratePlanId: id, propertyId: existing.propertyId }, "Rate plan deleted");
      res.json({ message: "Rate plan deleted" });
    } catch (err) {
      rpLogger.error({ err }, "Failed to delete rate plan");
      res.status(500).json({ message: "Failed to delete rate plan" });
    }
  });
}
