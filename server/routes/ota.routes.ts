import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth, requireRole } from "../middleware";
import { requireIntegrationLimit, trackApiUsage } from "../middleware/planLimitMiddleware";
import { logger } from "../utils/logger";
import { getJobQueue } from "../services/jobQueue";
import { enqueueOtaSync } from "../workers/otaSyncWorker";
import { z } from "zod";

const otaRouteLogger = logger.child({ module: "ota-routes" });

const createIntegrationSchema = z.object({
  propertyId: z.string().min(1),
  provider: z.enum(["booking_com", "airbnb", "expedia"]),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateIntegrationSchema = z.object({
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  isActive: z.boolean().optional(),
});

const triggerSyncSchema = z.object({
  propertyId: z.string().min(1),
  action: z.enum(["push_availability", "push_rates", "pull_reservations"]),
});

export function registerOtaRoutes(app: Express): void {

  app.get("/api/ota/integrations/:propertyId", requireAuth, trackApiUsage(), async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params;
      const tenantId = req.tenantId;
      if (!tenantId) return res.status(403).json({ message: "Tenant not resolved" });

      const integrations = await storage.getOtaIntegrationsByProperty(propertyId as string, tenantId);
      res.json(integrations);
    } catch (err) {
      otaRouteLogger.error({ err }, "Failed to fetch OTA integrations");
      res.status(500).json({ message: "Failed to fetch OTA integrations" });
    }
  });

  app.post("/api/ota/integrations", requireRole("owner_admin", "admin", "property_manager"), requireIntegrationLimit(), trackApiUsage(), async (req: Request, res: Response) => {
    try {
      const parsed = createIntegrationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten().fieldErrors });
      }

      const tenantId = req.tenantId;
      if (!tenantId) return res.status(403).json({ message: "Tenant not resolved" });

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      if (user.role !== "oss_super_admin") {
        const property = await storage.getProperty(parsed.data.propertyId);
        if (!property || (property.ownerId !== user.ownerId && property.ownerId !== user.id)) {
          return res.status(403).json({ message: "Access denied to this property" });
        }
      }

      const integration = await storage.createOtaIntegration({
        ...parsed.data,
        tenantId,
      });

      otaRouteLogger.info({ integrationId: integration.id, provider: parsed.data.provider, propertyId: parsed.data.propertyId }, "OTA integration created");
      res.status(201).json(integration);
    } catch (err: any) {
      if (err.code === "23505") {
        return res.status(409).json({ message: "An integration for this provider already exists on this property" });
      }
      otaRouteLogger.error({ err }, "Failed to create OTA integration");
      res.status(500).json({ message: "Failed to create OTA integration" });
    }
  });

  app.patch("/api/ota/integrations/:id", requireRole("owner_admin", "admin", "property_manager"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = await storage.getOtaIntegration(id as string);
      if (!existing) return res.status(404).json({ message: "OTA integration not found" });

      if (existing.tenantId !== req.tenantId && req.tenantUser?.role !== "oss_super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const parsed = updateIntegrationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten().fieldErrors });
      }

      const updated = await storage.updateOtaIntegration(id as string, parsed.data);
      otaRouteLogger.info({ integrationId: id }, "OTA integration updated");
      res.json(updated);
    } catch (err) {
      otaRouteLogger.error({ err }, "Failed to update OTA integration");
      res.status(500).json({ message: "Failed to update OTA integration" });
    }
  });

  app.delete("/api/ota/integrations/:id", requireRole("owner_admin", "admin", "property_manager"), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = await storage.getOtaIntegration(id as string);
      if (!existing) return res.status(404).json({ message: "OTA integration not found" });

      if (existing.tenantId !== req.tenantId && req.tenantUser?.role !== "oss_super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteOtaIntegration(id as string);
      otaRouteLogger.info({ integrationId: id, provider: existing.provider }, "OTA integration deleted");
      res.json({ message: "OTA integration deleted" });
    } catch (err) {
      otaRouteLogger.error({ err }, "Failed to delete OTA integration");
      res.status(500).json({ message: "Failed to delete OTA integration" });
    }
  });

  app.post("/api/ota/sync", requireRole("owner_admin", "admin", "property_manager"), async (req: Request, res: Response) => {
    try {
      const parsed = triggerSyncSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten().fieldErrors });
      }

      const { propertyId, action } = parsed.data;
      const tenantId = req.tenantId;
      if (!tenantId) return res.status(403).json({ message: "Tenant not resolved" });

      const boss = await getJobQueue();
      const jobId = await enqueueOtaSync(boss, propertyId, tenantId, action, "manual");

      otaRouteLogger.info({ jobId, propertyId, action }, "OTA sync job triggered manually");
      res.status(202).json({ message: "Sync job enqueued", jobId });
    } catch (err) {
      otaRouteLogger.error({ err }, "Failed to trigger OTA sync");
      res.status(500).json({ message: "Failed to trigger OTA sync" });
    }
  });

  app.get("/api/ota/conflicts/:propertyId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params;
      const tenantId = req.tenantId;
      if (!tenantId) return res.status(403).json({ message: "Tenant not resolved" });

      const conflicts = await storage.getOtaConflicts(propertyId as string, tenantId);
      res.json(conflicts);
    } catch (err) {
      otaRouteLogger.error({ err }, "Failed to fetch OTA conflicts");
      res.status(500).json({ message: "Failed to fetch OTA conflicts" });
    }
  });

  app.get("/api/ota/sync-logs/:propertyId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params;
      const tenantId = req.tenantId;
      if (!tenantId) return res.status(403).json({ message: "Tenant not resolved" });

      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getOtaSyncLogs(propertyId as string, tenantId, Math.min(limit, 200));
      res.json(logs);
    } catch (err) {
      otaRouteLogger.error({ err }, "Failed to fetch OTA sync logs");
      res.status(500).json({ message: "Failed to fetch OTA sync logs" });
    }
  });
}
