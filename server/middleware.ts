import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { User, PlanType, Subscription } from "@shared/schema";
import { type BusinessFeature, type SmartFeature, type SmartPlanType, hasSmartFeature } from "@shared/planFeatures";
import { resolveOwnerIdFromUser, resolveUserFeatures } from "./utils/planResolver";
import { logger } from "./utils/logger";
import { resolveDemoToken } from "./demoTokenStore";

const mwLogger = logger.child({ module: "middleware" });

declare global {
  namespace Express {
    interface Request {
      tenantId?: string | null;
      tenantUser?: User;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const demoToken = req.headers["x-demo-token"] as string | undefined;
  if (demoToken) {
    const tokenData = resolveDemoToken(demoToken);
    if (tokenData) {
      req.session.userId = tokenData.userId;
      req.session.role = tokenData.role;
      req.session.demoSessionTenantId = tokenData.demoSessionTenantId;
      return next();
    }
  }

  // Demo sessions require a valid tab-specific token — if none present, reject
  if (req.session.demoSessionTenantId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export function authenticateRequest(req: Request, res: Response, next: NextFunction) {
  const demoToken = req.headers["x-demo-token"] as string | undefined;
  if (demoToken) {
    const tokenData = resolveDemoToken(demoToken);
    if (tokenData) {
      req.session.userId = tokenData.userId;
      req.session.role = tokenData.role;
      req.session.demoSessionTenantId = tokenData.demoSessionTenantId;
      return next();
    }
  }

  // Demo sessions require a valid tab-specific token — if none present, reject
  if (req.session.demoSessionTenantId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.session.userId) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
}

export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!roles.includes(user.role) && user.role !== "oss_super_admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  const user = await resolveUser(req);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (user.role === "oss_super_admin") {
    req.tenantId = null;
    return next();
  }

  if (user.username?.startsWith("demo_") && req.session.demoSessionTenantId) {
    req.tenantId = req.session.demoSessionTenantId;
    return next();
  }

  let tenantId = user.tenantId || user.ownerId || null;

  if (!tenantId && user.hotelId) {
    const hotel = await storage.getHotel(user.hotelId);
    if (hotel?.ownerId) {
      tenantId = hotel.ownerId;
    } else if (hotel?.propertyId) {
      const property = await storage.getProperty(hotel.propertyId);
      tenantId = property?.ownerId || null;
    }
  }

  if (!tenantId && user.propertyId) {
    const property = await storage.getProperty(user.propertyId);
    tenantId = property?.ownerId || null;
  }

  req.tenantId = tenantId;
  return next();
}

export function requireTenant(req: Request, res: Response, next: NextFunction) {
  if (req.tenantUser?.role === "oss_super_admin") {
    return next();
  }

  if (!req.tenantId) {
    return res.status(403).json({ message: "Tenant context required" });
  }

  return next();
}

export function enforceTenantAccess(resourceTenantId: string | null | undefined) {
  return (req: Request): boolean => {
    if (req.tenantUser?.role === "oss_super_admin") return true;
    if (!req.tenantId || !resourceTenantId) return false;
    return req.tenantId === resourceTenantId;
  };
}

async function resolveUser(req: Request): Promise<User | undefined> {
  if (req.tenantUser) return req.tenantUser;

  const userId = req.session.userId;
  if (!userId) return undefined;

  const user = await storage.getUser(userId);
  if (user) {
    req.tenantUser = user;
  }
  return user;
}

export function createTenantMiddleware() {
  return [authenticateRequest, resolveTenant];
}

export function requireFeature(featureKey: BusinessFeature) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.role === "oss_super_admin") {
      mwLogger.debug({ userId: user.id, feature: featureKey, allowed: true, reason: "superadmin bypass" }, "Feature check");
      return next();
    }

    if (user.username?.startsWith("demo_")) {
      mwLogger.debug({ userId: user.id, plan: "CORE_PRO", feature: featureKey, allowed: true, reason: "demo bypass" }, "Feature check");
      (req as any).planAccess = true;
      (req as any).planCode = "CORE_PRO";
      return next();
    }

    const result = await resolveUserFeatures(user);

    if (!result) {
      mwLogger.debug({ userId: user.id, feature: featureKey, allowed: false, reason: "no owner/subscription" }, "Feature check");
      return res.status(403).json({
        error: "PLAN_LIMIT",
        message: "No subscription found. Please set up a subscription to access this feature.",
        feature: featureKey,
      });
    }

    const { planCode, config } = result;
    const access = config.features[featureKey];
    const allowed = access === true || access === "limited";

    mwLogger.debug({ userId: user.id, plan: planCode, feature: featureKey, allowed }, "Feature check");

    if (!allowed) {
      return res.status(403).json({
        error: "PLAN_LIMIT",
        message: "This feature is not included in your current subscription plan. Please upgrade to access it.",
        feature: featureKey,
        currentPlan: planCode,
      });
    }

    (req as any).planAccess = allowed;
    (req as any).planCode = planCode;
    next();
  };
}

export function requirePropertyLimit() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await resolveUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role === "oss_super_admin") return next();
    if (user.username?.startsWith("demo_")) return next();

    const ownerId = await resolveOwnerIdFromUser(user);
    if (!ownerId) return next();

    const result = await resolveUserFeatures(user);
    if (!result) {
      return res.status(403).json({
        error: "PLAN_LIMIT",
        message: "No active subscription found. Please subscribe to add properties.",
        feature: "multi_property",
      });
    }

    const { planCode, config } = result;
    const maxProperties = config.limits.maxProperties;
    const properties = await storage.getPropertiesByOwner(ownerId);
    const activeProperties = properties.filter(p => !(p as any).deletedAt);

    if (activeProperties.length >= maxProperties) {
      mwLogger.debug({ userId: user.id, plan: planCode, feature: "propertyLimit", allowed: false, current: activeProperties.length, max: maxProperties }, "Property limit check");
      return res.status(403).json({
        error: "PLAN_LIMIT",
        message: `Your plan allows up to ${maxProperties} ${maxProperties === 1 ? 'property' : 'properties'}. Please upgrade to add more.`,
        feature: "multi_property",
        currentPlan: planCode,
        currentCount: activeProperties.length,
        maxAllowed: maxProperties,
      });
    }

    mwLogger.debug({ userId: user.id, plan: planCode, feature: "propertyLimit", allowed: true, current: activeProperties.length, max: maxProperties }, "Property limit check");
    next();
  };
}

export function requireActiveSubscription(req: Request, res: Response, next: NextFunction) {
  (async () => {
    const user = req.tenantUser;
    if (!user) return next();

    if (user.role === "oss_super_admin") return next();
    if (user.username?.startsWith("demo_")) return next();

    const ownerId = await resolveOwnerIdFromUser(user);
    if (!ownerId) return next();

    const sub = await storage.getSubscriptionByOwner(ownerId);
    if (!sub) {
      // Check if any subscription exists (even inactive) before auto-creating
      const anySub = await storage.getAnySubscriptionByOwner(ownerId);
      if (!anySub) {
        // No subscription ever created — auto-provision a 14-day trial so new hotels work immediately
        try {
          const { applyPlanFeatures } = await import("@shared/planFeatures");
          const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
          const planDefaults = applyPlanFeatures("pro");
          await storage.createSubscription({
            ownerId,
            planType: "trial",
            planCode: "CORE_PRO",
            ...planDefaults,
            trialEndsAt,
            isActive: true,
            status: "trial",
          } as any);
          mwLogger.info({ ownerId }, "Auto-provisioned 14-day trial subscription");
          return next();
        } catch (e) {
          mwLogger.error({ ownerId, err: e }, "Failed to auto-provision trial");
          return res.status(402).json({
            error: "SUBSCRIPTION_REQUIRED",
            message: "No active subscription found. Please subscribe to continue.",
          });
        }
      }
      // Has a subscription record but it's inactive — show appropriate error
      const anyStatus = (anySub as any).status || "expired";
      return res.status(402).json({
        error: anyStatus === "suspended" ? "SUBSCRIPTION_SUSPENDED" : "SUBSCRIPTION_EXPIRED",
        message: anyStatus === "suspended"
          ? "Your subscription has been suspended due to failed payments. Please update your payment method."
          : "Your trial has expired. Please contact us to renew your subscription.",
      });
    }

    const subStatus = (sub as any).status || "active";

    if (subStatus === "expired" || subStatus === "suspended") {
      await storage.updateSubscription(sub.id, { isActive: false });
      mwLogger.info({ ownerId, subscriptionId: sub.id, status: subStatus }, "Subscription blocked");
      return res.status(402).json({
        error: subStatus === "suspended" ? "SUBSCRIPTION_SUSPENDED" : "SUBSCRIPTION_EXPIRED",
        message: subStatus === "suspended"
          ? "Your subscription has been suspended due to failed payments. Please update your payment method."
          : "Your subscription has expired. Please renew to continue.",
      });
    }

    if (sub.planType === "trial" && sub.trialEndsAt) {
      if (new Date(sub.trialEndsAt) < new Date()) {
        await storage.updateSubscription(sub.id, { isActive: false, status: "expired" });
        mwLogger.info({ ownerId, subscriptionId: sub.id }, "Trial subscription expired — deactivated");
        return res.status(402).json({
          error: "SUBSCRIPTION_EXPIRED",
          message: "Your trial has expired. Please subscribe to continue.",
        });
      }
    }

    if (sub.endDate && new Date(sub.endDate) < new Date() && subStatus !== "past_due") {
      await storage.updateSubscription(sub.id, { isActive: false, status: "expired" });
      mwLogger.info({ ownerId, subscriptionId: sub.id }, "Paid subscription expired — deactivated");
      return res.status(402).json({
        error: "SUBSCRIPTION_EXPIRED",
        message: "Your subscription has expired. Please renew to continue.",
      });
    }

    if (!sub.isActive) {
      return res.status(402).json({
        error: "SUBSCRIPTION_INACTIVE",
        message: "Your subscription is inactive. Please renew to continue.",
      });
    }

    next();
  })().catch(next);
}

export function requireStaffLimit() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.tenantUser || (req.session.userId ? await storage.getUser(req.session.userId) : undefined);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role === "oss_super_admin") return next();
    if (user.username?.startsWith("demo_")) return next();

    const ownerId = await resolveOwnerIdFromUser(user);
    if (!ownerId) return next();

    const result = await resolveUserFeatures(user);
    if (!result) {
      return res.status(403).json({
        error: "PLAN_LIMIT",
        message: "No active subscription found.",
      });
    }

    const { planCode, config } = result;
    const maxStaff = config.limits.maxStaff;

    const properties = await storage.getPropertiesByOwner(ownerId);
    let totalStaff = 0;
    for (const prop of properties) {
      const propUsers = await storage.getUsersByProperty(prop.id);
      totalStaff += propUsers.filter(u =>
        u.role !== "guest" && u.role !== "owner_admin" && u.role !== "oss_super_admin"
      ).length;
    }

    if (totalStaff >= maxStaff) {
      mwLogger.info({ ownerId, plan: planCode, currentStaff: totalStaff, maxStaff }, "Staff limit reached");
      return res.status(403).json({
        error: "PLAN_LIMIT",
        message: `Your plan allows up to ${maxStaff} staff member${maxStaff === 1 ? '' : 's'}. You currently have ${totalStaff}. Please upgrade to add more.`,
        feature: "staff_limit",
        currentPlan: planCode,
        currentCount: totalStaff,
        maxAllowed: maxStaff,
      });
    }

    next();
  };
}

export function requireUnitLimit() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.tenantUser || (req.session.userId ? await storage.getUser(req.session.userId) : undefined);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role === "oss_super_admin") return next();
    if (user.username?.startsWith("demo_")) return next();

    const ownerId = await resolveOwnerIdFromUser(user);
    if (!ownerId) return next();

    const result = await resolveUserFeatures(user);
    if (!result) {
      return res.status(403).json({
        error: "PLAN_LIMIT",
        message: "No active subscription found.",
      });
    }

    const { planCode, config } = result;
    const maxUnits = config.limits.maxUnitsPerProperty;

    const propertyId = req.params.propertyId || req.body?.propertyId;
    if (!propertyId) return next();

    const existingUnits = await storage.getUnitsByProperty(propertyId);
    const requestedCount = req.body?.rooms
      ? (req.body.rooms as any[]).reduce((sum: number, r: any) => sum + (r.count || 1), 0)
      : 1;

    if (existingUnits.length + requestedCount > maxUnits) {
      mwLogger.info({ ownerId, plan: planCode, propertyId, currentUnits: existingUnits.length, requested: requestedCount, maxUnits }, "Unit limit reached");
      return res.status(403).json({
        error: "PLAN_LIMIT",
        message: `Your plan allows up to ${maxUnits} rooms per property. This property has ${existingUnits.length}. Please upgrade to add more.`,
        feature: "unit_limit",
        currentPlan: planCode,
        currentCount: existingUnits.length,
        maxAllowed: maxUnits,
      });
    }

    next();
  };
}

export const checkPlanAccess = requireFeature;

export const checkPropertyLimit = requirePropertyLimit;

export function checkSmartPlanAccess(featureKey: SmartFeature) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.role === "oss_super_admin") {
      return next();
    }

    if (user.username?.startsWith("demo_")) {
      (req as any).smartPlanType = "smart_ai";
      return next();
    }

    const ownerId = await resolveOwnerIdFromUser(user);

    if (!ownerId) {
      return res.status(403).json({
        error: "SMART_PLAN_LIMIT",
        message: "No subscription found. A smart plan is required for this feature.",
        feature: featureKey,
      });
    }

    const sub = await storage.getSubscriptionByOwner(ownerId);
    const smartPlan = ((sub?.smartPlanType) || "none") as SmartPlanType;

    if (!hasSmartFeature(smartPlan, featureKey)) {
      return res.status(403).json({
        error: "SMART_PLAN_LIMIT",
        message: "This smart feature is not included in your current smart plan. Please upgrade to access it.",
        feature: featureKey,
        currentSmartPlan: smartPlan,
      });
    }

    (req as any).smartPlanType = smartPlan;
    next();
  };
}
