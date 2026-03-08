import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { resolveOwnerIdFromUser, resolveUserFeatures } from "../utils/planResolver";
import { PlanLimitError, checkRoomLimit, checkStaffLimit, checkIntegrationLimit, checkApiMonthlyLimit } from "../services/planUsageService";
import { logger } from "../utils/logger";

const limitLogger = logger.child({ module: "plan-limit-middleware" });

function sendLimitError(res: Response, err: PlanLimitError) {
  return res.status(403).json(err.toJSON());
}

async function resolveUser(req: Request) {
  const user = req.tenantUser || (req.session.userId ? await storage.getUser(req.session.userId) : undefined);
  return user || null;
}

export function requireRoomLimit() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await resolveUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      if (user.role === "oss_super_admin") return next();
      if (user.username?.startsWith("demo_")) return next();

      const propertyId = req.params.propertyId || req.body?.propertyId;
      const requestedCount = req.body?.rooms
        ? (req.body.rooms as any[]).reduce((sum: number, r: any) => sum + (r.count || 1), 0)
        : 1;

      await checkRoomLimit(user, propertyId, requestedCount);
      next();
    } catch (err) {
      if (err instanceof PlanLimitError) return sendLimitError(res, err);
      next(err);
    }
  };
}

export function requireStaffLimitV2() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await resolveUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      if (user.role === "oss_super_admin") return next();
      if (user.username?.startsWith("demo_")) return next();

      await checkStaffLimit(user);
      next();
    } catch (err) {
      if (err instanceof PlanLimitError) return sendLimitError(res, err);
      next(err);
    }
  };
}

export function requireIntegrationLimit() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await resolveUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      if (user.role === "oss_super_admin") return next();
      if (user.username?.startsWith("demo_")) return next();

      const propertyId = req.params.propertyId || req.body?.propertyId;
      await checkIntegrationLimit(user, propertyId);
      next();
    } catch (err) {
      if (err instanceof PlanLimitError) return sendLimitError(res, err);
      next(err);
    }
  };
}

export function trackApiUsage() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) return next();

      const user = await resolveUser(req);
      if (!user) return next();
      if (user.role === "oss_super_admin") return next();
      if (user.username?.startsWith("demo_")) return next();

      const endpoint = `${req.method} ${req.route?.path || req.path}`;

      storage.createApiUsageLog(tenantId, endpoint).catch((err) => {
        limitLogger.error({ err, tenantId, endpoint }, "Failed to log API usage");
      });

      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireApiLimit() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) return next();

      const user = await resolveUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      if (user.role === "oss_super_admin") return next();
      if (user.username?.startsWith("demo_")) return next();

      await checkApiMonthlyLimit(tenantId, user);
      next();
    } catch (err) {
      if (err instanceof PlanLimitError) return sendLimitError(res, err);
      next(err);
    }
  };
}
