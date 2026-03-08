import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware";
import { logger } from "../utils/logger";
import { z } from "zod";
import {
  calculateDynamicPricesForRange,
} from "../services/dynamicPricingService";

const pricingLogger = logger.child({ module: "pricing-routes" });

const createRuleSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(1),
  ruleType: z.enum(["day_of_week", "occupancy", "seasonal", "last_minute", "early_bird"]),
  priority: z.number().int().default(0),
  conditions: z.record(z.any()),
  adjustment: z.object({
    type: z.enum(["percentage", "fixed"]),
    value: z.number(),
  }),
  isActive: z.boolean().optional().default(true),
});

const updateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  ruleType: z.enum(["day_of_week", "occupancy", "seasonal", "last_minute", "early_bird"]).optional(),
  priority: z.number().int().optional(),
  conditions: z.record(z.any()).optional(),
  adjustment: z.object({
    type: z.enum(["percentage", "fixed"]),
    value: z.number(),
  }).optional(),
  isActive: z.boolean().optional(),
});

const calculateSchema = z.object({
  propertyId: z.string().min(1),
  unitId: z.string().min(1),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

async function verifyPropertyAccess(propertyId: string, tenantId: string, userId: string): Promise<boolean> {
  const user = await storage.getUser(userId);
  if (!user) return false;
  if (user.role === "oss_super_admin") return true;

  const property = await storage.getProperty(propertyId);
  if (!property) return false;

  return property.ownerId === tenantId || property.ownerId === user.id || property.ownerId === user.ownerId;
}

export function registerPricingRoutes(app: Express): void {

  app.get("/api/pricing/rules/:propertyId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params;
      const tenantId = req.tenantId;
      if (!tenantId) return res.status(403).json({ message: "Tenant not resolved" });

      if (!await verifyPropertyAccess(propertyId as string, tenantId, req.session.userId!)) {
        return res.status(403).json({ message: "Access denied to this property" });
      }

      const rules = await storage.getPricingRulesByProperty(propertyId as string, tenantId);
      res.json(rules);
    } catch (err) {
      pricingLogger.error({ err }, "Failed to get pricing rules");
      res.status(500).json({ message: "Failed to get pricing rules" });
    }
  });

  app.post("/api/pricing/rules", requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) return res.status(403).json({ message: "Tenant not resolved" });

      const parsed = createRuleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten().fieldErrors });
      }

      if (!await verifyPropertyAccess(parsed.data.propertyId, tenantId, req.session.userId!)) {
        return res.status(403).json({ message: "Access denied to this property" });
      }

      const rule = await storage.createPricingRule({
        ...parsed.data,
        tenantId,
      });

      pricingLogger.info({ ruleId: rule.id, propertyId: parsed.data.propertyId, ruleType: parsed.data.ruleType }, "Pricing rule created");
      res.status(201).json(rule);
    } catch (err) {
      pricingLogger.error({ err }, "Failed to create pricing rule");
      res.status(500).json({ message: "Failed to create pricing rule" });
    }
  });

  app.patch("/api/pricing/rules/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) return res.status(403).json({ message: "Tenant not resolved" });

      const parsed = updateRuleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten().fieldErrors });
      }

      const existing = await storage.getPricingRule(req.params.id as string);
      if (!existing || existing.tenantId !== tenantId) {
        return res.status(404).json({ message: "Pricing rule not found" });
      }

      const updated = await storage.updatePricingRule(req.params.id as string, tenantId, parsed.data);
      if (!updated) {
        return res.status(404).json({ message: "Pricing rule not found" });
      }

      pricingLogger.info({ ruleId: req.params.id as string }, "Pricing rule updated");
      res.json(updated);
    } catch (err) {
      pricingLogger.error({ err }, "Failed to update pricing rule");
      res.status(500).json({ message: "Failed to update pricing rule" });
    }
  });

  app.delete("/api/pricing/rules/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) return res.status(403).json({ message: "Tenant not resolved" });

      const existing = await storage.getPricingRule(req.params.id as string);
      if (!existing || existing.tenantId !== tenantId) {
        return res.status(404).json({ message: "Pricing rule not found" });
      }

      await storage.deletePricingRule(req.params.id as string, tenantId);
      pricingLogger.info({ ruleId: req.params.id as string }, "Pricing rule deleted");
      res.json({ message: "Pricing rule deleted" });
    } catch (err) {
      pricingLogger.error({ err }, "Failed to delete pricing rule");
      res.status(500).json({ message: "Failed to delete pricing rule" });
    }
  });

  app.get("/api/pricing/calculate", requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) return res.status(403).json({ message: "Tenant not resolved" });

      const parsed = calculateSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Missing or invalid query parameters. Required: propertyId, unitId, checkIn (YYYY-MM-DD), checkOut (YYYY-MM-DD)",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { propertyId, unitId, checkIn, checkOut } = parsed.data;

      if (!await verifyPropertyAccess(propertyId as string, tenantId, req.session.userId!)) {
        return res.status(403).json({ message: "Access denied to this property" });
      }

      const unit = await storage.getUnit(unitId);
      if (!unit || unit.propertyId !== propertyId) {
        return res.status(404).json({ message: "Unit not found in this property" });
      }

      const dailyPrices = await calculateDynamicPricesForRange(propertyId, tenantId, unitId, checkIn, checkOut);

      const totalBasePrice = dailyPrices.reduce((sum, d) => sum + d.basePrice, 0);
      const totalDynamicPrice = dailyPrices.reduce((sum, d) => sum + d.finalPrice, 0);

      res.json({
        propertyId,
        unitId,
        checkIn,
        checkOut,
        nights: dailyPrices.length,
        totalBasePrice,
        totalDynamicPrice,
        averageDynamicPrice: dailyPrices.length > 0 ? Math.round(totalDynamicPrice / dailyPrices.length) : 0,
        dailyBreakdown: dailyPrices,
      });
    } catch (err) {
      pricingLogger.error({ err }, "Failed to calculate dynamic prices");
      res.status(500).json({ message: "Failed to calculate dynamic prices" });
    }
  });
}
