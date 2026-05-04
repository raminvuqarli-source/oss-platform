import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { asString } from "../utils/request";
import { logger } from "../utils/logger";
import { authenticateRequest, requireAuth, requireRole, requireFeature, requireUnitLimit } from "../middleware";
import { hotels, type PlanType, PLAN_TYPE_TO_CODE } from "@shared/schema";
import { ALL_BUSINESS_FEATURES, applyPlanFeatures, PLAN_CODE_FEATURES, SMART_PLAN_PRICING, SMART_PLAN_FEATURES, isSmartPlanActive, type BusinessFeature } from "@shared/planFeatures";
import type { PlanCode } from "@shared/schema";

import { notifyDeviceAlert, notifySubscriptionEvent } from "../notifications";
import { sendStaffInvitationEmail } from "../email";
import crypto from "crypto";
import { db } from "../db";
import { pool } from "../db";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger";

export function registerSaasRoutes(app: Express): void {

  app.get("/api/plans", (_req, res) => {
    const plans = (Object.entries(PLAN_CODE_FEATURES) as [PlanCode, typeof PLAN_CODE_FEATURES[PlanCode]][])
      .filter(([code]) => code !== "APARTMENT_LITE")
      .map(([code, config]) => ({
        code,
        displayName: config.displayName,
        priceMonthlyUSD: config.priceMonthlyUSD,
        currency: config.currency,
        features: config.features,
        limits: config.limits,
      }));
    res.json(plans);
  });

  app.get("/api/smart-plans", (_req, res) => {
    const smartPlans = (Object.entries(SMART_PLAN_PRICING) as [string, typeof SMART_PLAN_PRICING[keyof typeof SMART_PLAN_PRICING]][])
      .map(([code, config]) => ({
        code,
        displayName: config.displayName,
        priceMonthlyUSD: config.priceMonthlyUSD,
        currency: config.currency,
        popular: config.popular,
        features: SMART_PLAN_FEATURES[code as keyof typeof SMART_PLAN_FEATURES] || [],
        available: isSmartPlanActive(code as any),
      }));
    res.json(smartPlans);
  });

  // ===================== ONBOARDING VALIDATION SCHEMAS =====================
  const propertySchema = z.object({
    name: z.string().min(1).max(200),
    type: z.enum(["hotel", "resort", "tiny_house", "apartment", "glamping"]).default("hotel"),
    country: z.string().min(1).max(100),
    city: z.string().min(1).max(100),
    timezone: z.string().min(1).max(50).default("UTC"),
    totalUnits: z.number().int().min(0).default(0),
  });

  const roomSchema = z.object({
    propertyId: z.string().min(1),
    rooms: z.array(z.object({
      type: z.string().min(1),
      count: z.number().int().min(1).max(1000),
      pricePerNight: z.number().min(0),
    })).min(1),
  });

  const smartSchema = z.object({
    propertyId: z.string().min(1),
    smartEnabled: z.boolean().default(false),
    smartDoorLocks: z.boolean().default(false),
    smartHvac: z.boolean().default(false),
    smartLighting: z.boolean().default(false),
  });

  const staffSchema = z.object({
    propertyId: z.string().min(1),
    staff: z.array(z.object({
      email: z.string().email(),
      role: z.string().min(1),
    })),
  });

  // ===================== ADVANCED SaaS FEATURE ROUTES =====================

  // --- FEATURE FLAGS ---
  app.get("/api/features", requireAuth, async (req, res) => {
    try {
      const { resolveOwnerIdFromUser, getOwnerPlanCode, getPlanFeatures } = await import("../utils/planResolver");
      const user = await storage.getUser(req.session.userId!);

      if (user?.username?.startsWith("demo_")) {
        const { PLAN_CODE_FEATURES } = await import("@shared/planFeatures");
        const config = PLAN_CODE_FEATURES["CORE_PRO"];
        const businessFeatures = ALL_BUSINESS_FEATURES.map(f => ({ name: f, access: true }));
        return res.json({
          businessFeatures, plan: "pro", planCode: "CORE_PRO", smartPlanType: "smart_lite",
          planLimits: config.limits,
          trialExpired: false,
        });
      }

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const ownerId = await resolveOwnerIdFromUser(user);

      if (!ownerId) {
        return res.status(403).json({ error: "PLAN_LIMIT", message: "No owner account found. Please complete registration." });
      }

      const sub = await storage.getSubscriptionByOwner(ownerId);
      if (!sub) {
        return res.status(403).json({ error: "PLAN_LIMIT", message: "No active subscription found." });
      }

      const planCode = await getOwnerPlanCode(ownerId);
      const config = getPlanFeatures(planCode);

      const trialExpired = sub.planType === "trial" && sub.trialEndsAt
        ? new Date(sub.trialEndsAt) < new Date()
        : false;

      const smartPlanType = (sub.smartPlanType || "none") as string;
      const businessFeatures = ALL_BUSINESS_FEATURES.map(f => {
        if (trialExpired) return { name: f, access: false as any };
        const access = config.features[f as BusinessFeature];
        const allowed = access === true || access === "limited";
        return { name: f, access: allowed };
      });

      const planLimits = {
        maxProperties: config.limits.maxProperties,
        maxUnitsPerProperty: config.limits.maxUnitsPerProperty,
        maxStaff: config.limits.maxStaff,
      };

      if (process.env.NODE_ENV !== "production") {
        logger.debug({ userId: user.id, planCode, planLimits }, "Features resolved");
      }

      res.json({ businessFeatures, plan: sub.planType, planCode, smartPlanType, planLimits, trialExpired });
    } catch (error) {
      logger.error({ err: error }, "Failed to get features");
      res.status(500).json({ message: "Failed to get features" });
    }
  });

  app.get("/api/me/features", requireAuth, async (req, res) => {
    try {
      const { getOwnerFeatures } = await import("../utils/planResolver");
      const user = await storage.getUser(req.session.userId!);

      if (user?.username?.startsWith("demo_")) {
        const { PLAN_CODE_FEATURES } = await import("@shared/planFeatures");
        const config = PLAN_CODE_FEATURES["CORE_PRO"];
        return res.json({
          planCode: "CORE_PRO",
          features: config.features,
          limits: config.limits,
        });
      }

      let ownerId = user?.ownerId || null;
      if (!ownerId && user?.hotelId) {
        const hotel = await storage.getHotel(user.hotelId);
        if (hotel?.ownerId) ownerId = hotel.ownerId;
        else if (hotel?.propertyId) {
          const prop = await storage.getProperty(hotel.propertyId);
          ownerId = prop?.ownerId || null;
        }
      }
      if (!ownerId && user?.propertyId) {
        const prop = await storage.getProperty(user.propertyId);
        ownerId = prop?.ownerId || null;
      }

      if (!ownerId) {
        return res.status(403).json({ error: "NO_OWNER", message: "No owner account found." });
      }

      const sub = await storage.getSubscriptionByOwner(ownerId);
      const trialExpired = sub?.planType === "trial" && sub?.trialEndsAt
        ? new Date(sub.trialEndsAt) < new Date()
        : false;

      const result = await getOwnerFeatures(ownerId);

      const features = trialExpired
        ? Object.fromEntries(Object.keys(result.features.features).map(k => [k, false]))
        : result.features.features;

      res.json({
        planCode: result.planCode,
        features,
        limits: result.features.limits,
        trialExpired,
      });
    } catch (error) {
      logger.error({ err: error }, "Error resolving user features");
      res.status(500).json({ message: "Failed to resolve plan features" });
    }
  });

  app.get("/api/features/check/:featureName", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.username?.startsWith("demo_")) {
        return res.json({ enabled: true, feature: req.params.featureName });
      }
      if (!user?.ownerId) return res.json({ enabled: false });
      const featureName = req.params.featureName as string;
      const enabled = await storage.hasFeature(user.ownerId, featureName);
      res.json({ enabled, feature: featureName });
    } catch (error) {
      logger.error({ err: error }, "Failed to check feature");
      res.status(500).json({ message: "Failed to check feature" });
    }
  });

  // --- SUBSCRIPTION / TRIAL STATUS ---
  app.get("/api/subscription/status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.username?.startsWith("demo_")) {
        return res.json({ planType: "enterprise", smartPlanType: "smart_ai", isTrial: false, isExpired: false, isActive: true, remainingDays: 0 });
      }
      if (!user?.ownerId) return res.status(403).json({ error: "PLAN_LIMIT", message: "No owner account found." });
      
      const sub = await storage.getSubscriptionByOwner(user.ownerId);
      if (!sub) return res.status(403).json({ error: "PLAN_LIMIT", message: "No active subscription found." });

      const isTrial = sub.planType === "trial";
      const subStatus = (sub as any).status || "active";
      let remainingDays = 0;
      let isExpired = false;
      let daysUntilRenewal: number | null = null;
      let nextBillingDate: string | null = null;

      const now = new Date();

      if (isTrial && sub.trialEndsAt) {
        const diff = new Date(sub.trialEndsAt).getTime() - now.getTime();
        remainingDays = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        isExpired = diff <= 0;
      } else if (!isTrial && (sub as any).currentPeriodEnd) {
        const periodEnd = new Date((sub as any).currentPeriodEnd);
        const diff = periodEnd.getTime() - now.getTime();
        daysUntilRenewal = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        nextBillingDate = periodEnd.toISOString();
        if (diff <= 0) isExpired = true;
      }

      res.json({
        planType: sub.planType,
        planCode: (sub as any).planCode,
        status: subStatus,
        isTrial,
        trialEndsAt: sub.trialEndsAt,
        remainingDays,
        isExpired,
        isActive: sub.isActive,
        daysUntilRenewal,
        nextBillingDate,
        autoRenew: (sub as any).autoRenew ?? true,
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to get subscription status");
      res.status(500).json({ message: "Failed to get subscription status" });
    }
  });

  // --- USAGE METERING ---
  app.get("/api/usage", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.json({ meters: [] });
      
      const meters = await storage.refreshUsageMeters(user.ownerId);
      const warnings = meters.filter(m => m.currentValue >= m.maxAllowed * 0.8).map(m => ({
        metric: m.metricType,
        current: m.currentValue,
        max: m.maxAllowed,
        percentage: Math.round((m.currentValue / m.maxAllowed) * 100),
        atLimit: m.currentValue >= m.maxAllowed,
      }));
      
      res.json({ meters, warnings });
    } catch (error) {
      logger.error({ err: error }, "Failed to get usage");
      res.status(500).json({ message: "Failed to get usage" });
    }
  });

  app.get("/api/usage/can-create/:resourceType", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.json({ allowed: false, reason: "No owner account" });
      
      const { resourceType } = req.params;
      const meters = await storage.refreshUsageMeters(user.ownerId);
      const meter = meters.find(m => m.metricType === resourceType);
      
      if (!meter) return res.json({ allowed: true });
      
      const allowed = meter.currentValue < meter.maxAllowed;
      res.json({ 
        allowed, 
        current: meter.currentValue, 
        max: meter.maxAllowed,
        reason: allowed ? undefined : `You have reached your plan limit of ${meter.maxAllowed} ${resourceType}` 
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to check usage");
      res.status(500).json({ message: "Failed to check usage" });
    }
  });

  // --- AUDIT LOGS ---
  app.get("/api/audit-logs", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId && user?.role !== "oss_super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (!user?.ownerId) {
        return res.json({ logs: [], total: 0, actions: [], entityTypes: [] });
      }

      const limitParam = req.query.limit ? parseInt(asString(req.query.limit as string)) : 20;
      const offsetParam = req.query.offset ? parseInt(asString(req.query.offset as string)) : 0;
      const actionFilter = req.query.action ? asString(req.query.action as string) : undefined;
      const entityTypeFilter = req.query.entityType ? asString(req.query.entityType as string) : undefined;
      const searchQuery = req.query.search ? asString(req.query.search as string) : undefined;

      const result = await storage.getAuditLogsFiltered(user.ownerId, {
        action: actionFilter,
        entityType: entityTypeFilter,
        search: searchQuery,
        limit: Math.min(limitParam, 100),
        offset: offsetParam,
      });

      res.json(result);
    } catch (error) {
      logger.error({ err: error }, "Failed to get audit logs");
      res.status(500).json({ message: "Failed to get audit logs" });
    }
  });

  // --- WHITE LABEL ---
  app.get("/api/white-label", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.json(null);
      
      const hasFeature = await storage.hasFeature(user.ownerId, "white_label");
      if (!hasFeature) return res.status(403).json({ message: "White label is not available on your plan" });
      
      const settings = await storage.getWhiteLabelSettings(user.ownerId);
      res.json(settings || null);
    } catch (error) {
      logger.error({ err: error }, "Failed to get white label settings");
      res.status(500).json({ message: "Failed to get white label settings" });
    }
  });

  app.put("/api/white-label", authenticateRequest, requireRole("owner_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });
      
      const hasFeature = await storage.hasFeature(user.ownerId, "white_label");
      if (!hasFeature) return res.status(403).json({ message: "White label is not available on your plan" });
      
      const settings = await storage.upsertWhiteLabelSettings({
        ownerId: user.ownerId,
        ...req.body,
      });
      
      await storage.createAuditLog({
        ownerId: user.ownerId,
        userId: user.id,
        userRole: user.role,
        action: "white_label_updated",
        entityType: "white_label",
        entityId: settings.id,
        description: "Updated white label settings",
      });
      
      res.json(settings);
    } catch (error) {
      logger.error({ err: error }, "Failed to update white label settings");
      res.status(500).json({ message: "Failed to update white label settings" });
    }
  });

  // --- ONBOARDING ---
  app.get("/api/onboarding", authenticateRequest, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.json(null);
      
      let progress = await storage.getOnboardingProgress(user.ownerId);
      const properties = await storage.getPropertiesByOwner(user.ownerId);
      const firstProperty = properties[0] || null;

      res.json({
        ...(progress || { currentStep: 1, isComplete: false }),
        savedData: firstProperty ? {
          property: { name: firstProperty.name, type: firstProperty.type, country: firstProperty.country, city: firstProperty.city, timezone: firstProperty.timezone },
          propertyId: firstProperty.id,
          smart: { smartEnabled: firstProperty.hasSmartDevices, smartDoorLocks: firstProperty.smartDoorLocks, smartHvac: firstProperty.smartHvac, smartLighting: firstProperty.smartLighting },
        } : null,
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to get onboarding progress");
      res.status(500).json({ message: "Failed to get onboarding progress" });
    }
  });

  app.put("/api/onboarding", authenticateRequest, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });
      
      const progress = await storage.upsertOnboardingProgress({
        ownerId: user.ownerId,
        ...req.body,
      });
      res.json(progress);
    } catch (error) {
      logger.error({ err: error }, "Failed to update onboarding");
      res.status(500).json({ message: "Failed to update onboarding" });
    }
  });

  // --- ONBOARDING WIZARD STEPS ---
  app.post("/api/onboarding/property", authenticateRequest, async (req, res) => {
    try {
      const parsed = propertySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });

      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });

      const { name, type, country, city, timezone, totalUnits } = parsed.data;
      const existing = await storage.getPropertiesByOwner(user.ownerId);

      let propertyId: string;
      if (existing.length > 0) {
        await storage.updateProperty(existing[0].id, {
          name, type, country, city, timezone, totalUnits,
        });
        propertyId = existing[0].id;
      } else {
        const property = await storage.createProperty({
          ownerId: user.ownerId,
          tenantId: user.tenantId || user.ownerId,
          name,
          type,
          country,
          city,
          timezone,
          totalUnits,
        });
        propertyId = property.id;
        await storage.ensureDefaultRatePlan(propertyId, user.tenantId || user.ownerId);
      }
      res.json({ propertyId });
    } catch (error) {
      logger.error({ err: error }, "Onboarding property error");
      res.status(500).json({ message: "Failed to save property" });
    }
  });

  app.post("/api/onboarding/rooms", authenticateRequest, requireUnitLimit(), async (req, res) => {
    try {
      const parsed = roomSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });

      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });

      const { propertyId, rooms } = parsed.data;

      const prop = await storage.getProperty(propertyId);
      if (!prop || prop.ownerId !== user.ownerId) return res.status(403).json({ message: "Forbidden" });

      for (const room of rooms) {
        for (let i = 0; i < room.count; i++) {
          await storage.createUnit({
            propertyId,
            ownerId: user.ownerId,
            tenantId: user.tenantId || user.ownerId,
            unitNumber: `${room.type.toUpperCase().slice(0, 3)}-${String(i + 1).padStart(3, "0")}`,
            unitType: room.type,
            pricePerNight: room.pricePerNight,
          });
        }
      }

      const totalUnits = rooms.reduce((s, r) => s + r.count, 0);
      await storage.updateProperty(propertyId, { totalUnits });

      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error }, "Onboarding rooms error");
      res.status(500).json({ message: "Failed to save rooms" });
    }
  });

  app.post("/api/onboarding/plan", authenticateRequest, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });

      const { planCode } = req.body;
      const validPlanCodes = Object.keys(PLAN_CODE_FEATURES);
      if (!planCode || !validPlanCodes.includes(planCode)) {
        return res.status(400).json({ message: "Invalid plan code" });
      }

      const sub = await storage.getSubscriptionByOwner(user.ownerId);
      if (!sub) return res.status(404).json({ message: "No subscription found" });

      const planTypeEntry = Object.entries(PLAN_TYPE_TO_CODE).find(([, v]) => v === planCode);
      const resolvedPlanType = planTypeEntry ? planTypeEntry[0] : "starter";

      await storage.updateSubscription(sub.id, {
        planCode,
        planType: resolvedPlanType as any,
      } as any);

      logger.info({ ownerId: user.ownerId, planCode }, "Plan selected during onboarding");
      res.json({ planCode });
    } catch (error) {
      logger.error({ err: error }, "Onboarding plan selection error");
      res.status(500).json({ message: "Failed to save plan selection" });
    }
  });

  app.post("/api/onboarding/financial", authenticateRequest, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });

      const {
        countryTaxRate,
        utilityExpensePct,
        cleaningExpenseMonthly,
        defaultEmployeeTaxRate,
        additionalExpensesMonthly,
      } = req.body;

      const properties = await storage.getPropertiesByOwner(user.ownerId);
      if (properties.length > 0) {
        await storage.updateProperty(properties[0].id, {
          countryTaxRate: countryTaxRate ?? 0,
          utilityExpensePct: utilityExpensePct ?? 0,
          cleaningExpenseMonthly: cleaningExpenseMonthly ?? 0,
          defaultEmployeeTaxRate: defaultEmployeeTaxRate ?? 0,
          additionalExpensesMonthly: additionalExpensesMonthly ?? 0,
        });
      }

      const progress = await storage.upsertOnboardingProgress({
        ownerId: user.ownerId,
        currentStep: 4,
        completedSteps: [1, 2, 3],
      });
      res.json(progress);
    } catch (error) {
      logger.error({ err: error }, "Onboarding financial error");
      res.status(500).json({ message: "Failed to save financial settings" });
    }
  });

  app.post("/api/onboarding/smart", authenticateRequest, async (req, res) => {
    try {
      const parsed = smartSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });

      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });

      let { propertyId, smartEnabled, smartDoorLocks, smartHvac, smartLighting } = parsed.data;

      const prop = await storage.getProperty(propertyId);
      if (!prop || prop.ownerId !== user.ownerId) return res.status(403).json({ message: "Forbidden" });

      const sub = await storage.getSubscriptionByOwner(user.ownerId);
      const smartPlanType = (sub?.smartPlanType || "none") as string;
      const hasSmartPlan = smartPlanType !== "none";
      const { getOwnerFeatures: getOF } = await import("../utils/planResolver");
      const ownerResult = await getOF(user.ownerId);
      const smartControlsAccess = ownerResult.features.features["smart_controls"];
      const hasSmartControls = smartControlsAccess === true || smartControlsAccess === "limited";
      if (!hasSmartControls && !hasSmartPlan) {
        smartEnabled = false;
        smartDoorLocks = false;
        smartHvac = false;
        smartLighting = false;
      }

      await storage.updateProperty(propertyId, {
        hasSmartDevices: smartEnabled,
        smartDoorLocks,
        smartHvac,
        smartLighting,
      });
      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error }, "Onboarding smart config error");
      res.status(500).json({ message: "Failed to save smart config" });
    }
  });

  app.post("/api/onboarding/staff", authenticateRequest, async (req, res) => {
    try {
      const parsed = staffSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });

      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });

      const { propertyId, staff } = parsed.data;

      const prop = await storage.getProperty(propertyId);
      if (!prop || prop.ownerId !== user.ownerId) return res.status(403).json({ message: "Forbidden" });

      const results = [];
      for (const s of staff) {
        const token = crypto.randomUUID();
        const invitation = await storage.createStaffInvitation({
          propertyId,
          ownerId: user.ownerId,
          email: s.email,
          staffRole: s.role || "front_desk",
          invitedBy: user.id,
          status: "pending",
          tenantId: user.tenantId || user.ownerId,
          inviteToken: token,
        });
        results.push(invitation);

        sendStaffInvitationEmail({
          to: s.email,
          staffRole: s.role || "front_desk",
          propertyName: prop.name,
          invitedByName: user.fullName || user.username,
          inviteToken: token,
        }).catch((err) => logger.error({ err }, "Failed to send onboarding invitation email"));
      }
      res.json({ invitations: results });
    } catch (error) {
      logger.error({ err: error }, "Onboarding staff error");
      res.status(500).json({ message: "Failed to invite staff" });
    }
  });

  app.post("/api/onboarding/activate", authenticateRequest, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });

      await storage.upsertOnboardingProgress({
        ownerId: user.ownerId,
        isComplete: true,
        currentStep: 4,
        completedSteps: [1, 2, 3, 4],
        tenantId: user.tenantId || user.ownerId,
      });
      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error }, "Onboarding activate error");
      res.status(500).json({ message: "Failed to activate" });
    }
  });

  // --- BILLING ---
  app.get("/api/billing", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.json(null);
      
      const billing = await storage.getBillingInfo(user.ownerId);
      const sub = await storage.getSubscriptionByOwner(user.ownerId);
      let hotelChannex: { isChannexEnabled: boolean; channexRoomCount: number | null; channexAddonPrice: number | null; totalMonthlySubscriptionFee: string | null } | null = null;
      if (user.hotelId) {
        const hotel = await storage.getHotel(user.hotelId);
        if (hotel) {
          hotelChannex = {
            isChannexEnabled: hotel.isChannexEnabled ?? false,
            channexRoomCount: hotel.channexRoomCount ?? null,
            channexAddonPrice: hotel.channexAddonPrice ?? null,
            totalMonthlySubscriptionFee: hotel.totalMonthlySubscriptionFee ?? null,
          };
        }
      }
      res.json({ billing, subscription: sub, hotelChannex });
    } catch (error) {
      logger.error({ err: error }, "Failed to get billing info");
      res.status(500).json({ message: "Failed to get billing info" });
    }
  });

  app.get("/api/billing/invoices", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.json([]);
      
      const invoicesList = await storage.getInvoicesByOwner(user.ownerId);
      res.json(invoicesList);
    } catch (error) {
      logger.error({ err: error }, "Failed to get invoices");
      res.status(500).json({ message: "Failed to get invoices" });
    }
  });

  app.post("/api/billing/change-plan", authenticateRequest, requireRole("owner_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.status(400).json({ message: "No owner account" });
      
      let { planType, smartPlanType } = req.body;
      if (!["basic", "starter", "growth", "pro", "enterprise", "apartment_lite"].includes(planType)) {
        return res.status(400).json({ message: "Invalid plan type" });
      }
      if (planType === "basic") planType = "starter";
      if (smartPlanType && !["none", "smart_lite", "smart_pro", "smart_ai"].includes(smartPlanType)) {
        smartPlanType = undefined;
      }
      if (smartPlanType && !isSmartPlanActive(smartPlanType)) {
        return res.status(400).json({ message: `Smart plan "${smartPlanType}" is not currently available. Only Smart Lite is active.` });
      }
      
      const sub = await storage.getSubscriptionByOwner(user.ownerId);
      if (!sub) return res.status(404).json({ message: "No subscription found" });
      
      const oldPlan = sub.planType;
      const { getPlanFeatures: getPF } = await import("../utils/planResolver");
      const newPlanCode = PLAN_TYPE_TO_CODE[planType as keyof typeof PLAN_TYPE_TO_CODE] || "CORE_STARTER";
      const newConfig = getPF(newPlanCode);
      
      const meters = await storage.refreshUsageMeters(user.ownerId);
      for (const meter of meters) {
        const newMax = meter.metricType === "properties" ? newConfig.limits.maxProperties :
                       meter.metricType === "staff" || meter.metricType === "users" ? newConfig.limits.maxStaff :
                       newConfig.limits.maxUnitsPerProperty * newConfig.limits.maxProperties;
        if (meter.currentValue > newMax) {
          return res.status(400).json({ 
            message: `Cannot downgrade: you have ${meter.currentValue} ${meter.metricType} but the ${planType} plan only allows ${newMax}` 
          });
        }
      }
      
      const planDefaults = applyPlanFeatures(planType as PlanType);
      const updateData: any = {
        planType,
        planCode: newPlanCode,
        ...planDefaults,
      };
      if (smartPlanType !== undefined) {
        updateData.smartPlanType = smartPlanType;
      }
      const updated = await storage.updateSubscription(sub.id, updateData);
      
      await storage.refreshUsageMeters(user.ownerId);
      
      const action = planType > oldPlan! ? "subscription_upgraded" : "subscription_downgraded";
      await storage.createAuditLog({
        ownerId: user.ownerId,
        userId: user.id,
        userRole: user.role,
        action,
        entityType: "subscription",
        entityId: sub.id,
        description: `Plan changed from ${oldPlan} to ${planType}`,
        previousValues: { planType: oldPlan },
        newValues: { planType },
      });
      
      res.json({ subscription: updated, limits: newConfig.limits });
    } catch (error) {
      logger.error({ err: error }, "Failed to change plan");
      res.status(500).json({ message: "Failed to change plan" });
    }
  });

  // --- HEALTH CHECK ---
  app.get("/api/health", async (_req, res) => {
    const mem = process.memoryUsage();
    let dbOk = false;

    try {
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      dbOk = true;
    } catch (_) {
      dbOk = false;
    }

    const { getJobQueueStatus } = await import("../services/jobQueue");
    const queueStatus = getJobQueueStatus();
    const status = dbOk ? "ok" : "degraded";

    logger.debug({ status, dbOk, queue: queueStatus }, "Health check");

    res.status(dbOk ? 200 : 503).json({
      status,
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: mem.rss,
        heapUsed: mem.heapUsed,
      },
      database: dbOk,
      queue: queueStatus,
      timestamp: new Date().toISOString(),
    });
  });

  // --- SEED DATA ---
  app.post("/api/admin/seed-demo", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const { seedDemoData } = await import("../seed");
      const result = await seedDemoData();
      res.json(result);
    } catch (error: any) {
      logger.error({ err: error }, "Seed demo data error");
      res.status(500).json({ message: error.message || "Failed to seed data" });
    }
  });

  // --- DEVICE TELEMETRY ---
  app.get("/api/devices/:deviceId/telemetry", requireAuth, requireFeature("smart_controls"), async (req, res) => {
    try {
      const device = await storage.getDevice(asString(req.params.deviceId));
      if (!device || (req.tenantUser?.role !== "oss_super_admin" && device.ownerId !== req.tenantId)) {
        return res.status(404).json({ message: "Device not found" });
      }
      const telemetry = await storage.getDeviceTelemetry(asString(req.params.deviceId));
      res.json(telemetry);
    } catch (error) {
      logger.error({ err: error }, "Failed to get telemetry");
      res.status(500).json({ message: "Failed to get telemetry" });
    }
  });

  app.post("/api/devices/:deviceId/telemetry", requireAuth, requireFeature("smart_controls"), async (req, res) => {
    try {
      const device = await storage.getDevice(asString(req.params.deviceId));
      if (!device || (req.tenantUser?.role !== "oss_super_admin" && device.ownerId !== req.tenantId)) {
        return res.status(404).json({ message: "Device not found" });
      }
      const telemetry = await storage.createDeviceTelemetry({
        deviceId: asString(req.params.deviceId),
        ...req.body,
      });
      res.json(telemetry);
    } catch (error) {
      logger.error({ err: error }, "Failed to create telemetry");
      res.status(500).json({ message: "Failed to create telemetry" });
    }
  });

  // --- ANALYTICS SNAPSHOTS ---
  app.get("/api/analytics/snapshots/:type", requireAuth, requireFeature("advanced_analytics"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.json([]);
      const snapshots = await storage.getAnalyticsSnapshots(user.ownerId, asString(req.params.type));
      res.json(snapshots);
    } catch (error) {
      logger.error({ err: error }, "Failed to get analytics snapshots");
      res.status(500).json({ message: "Failed to get analytics snapshots" });
    }
  });

  // --- EXPANDED ANALYTICS ---
  app.get("/api/analytics/revenue", requireAuth, requireFeature("advanced_analytics"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.json({ totalRevenue: 0, monthlyRevenue: [], revenueByProperty: [] });
      
      const props = await storage.getPropertiesByOwner(user.ownerId);
      const revenueByProperty = [];
      let totalRevenue = 0;
      
      for (const prop of props) {
        const hotel = (await db.select().from(hotels).where(eq(hotels.propertyId, prop.id)).limit(1))[0];
        if (hotel) {
          const transactions = await storage.getFinancialTransactionsByHotel(hotel.id, req.tenantId!);
          const revenueCents = transactions
            .filter(t => t.paymentStatus === "paid" && !t.voidedAt)
            .reduce((sum, t) => sum + t.amount, 0);
          totalRevenue += revenueCents;
          revenueByProperty.push({ propertyId: prop.id, propertyName: prop.name, revenue: revenueCents / 100, transactionCount: transactions.length });
        }
      }
      
      res.json({ totalRevenue: totalRevenue / 100, revenueByProperty });
    } catch (error) {
      logger.error({ err: error }, "Failed to get revenue analytics");
      res.status(500).json({ message: "Failed to get revenue analytics" });
    }
  });

  app.get("/api/analytics/occupancy", requireAuth, requireFeature("advanced_analytics"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.json({ occupancyRate: 0, byProperty: [] });
      
      const props = await storage.getPropertiesByOwner(user.ownerId);
      const byProperty = [];
      let totalUnits = 0;
      let occupiedUnits = 0;
      
      for (const prop of props) {
        const propUnits = await storage.getUnitsByProperty(prop.id);
        const occupied = propUnits.filter(u => u.status === "occupied").length;
        totalUnits += propUnits.length;
        occupiedUnits += occupied;
        byProperty.push({
          propertyId: prop.id,
          propertyName: prop.name,
          totalUnits: propUnits.length,
          occupiedUnits: occupied,
          rate: propUnits.length > 0 ? Math.round((occupied / propUnits.length) * 100) : 0,
        });
      }
      
      const allUnitsFlat: any[] = [];
      for (const prop of props) {
        const pu = await storage.getUnitsByProperty(prop.id);
        allUnitsFlat.push(...pu);
      }
      const byCategory: Record<string, { total: number; occupied: number; rate: number }> = {};
      for (const u of allUnitsFlat) {
        const cat = u.unitCategory || "accommodation";
        if (!byCategory[cat]) byCategory[cat] = { total: 0, occupied: 0, rate: 0 };
        byCategory[cat].total++;
        if (u.status === "occupied") byCategory[cat].occupied++;
      }
      for (const key of Object.keys(byCategory)) {
        const c = byCategory[key];
        c.rate = c.total > 0 ? Math.round((c.occupied / c.total) * 100) : 0;
      }

      res.json({
        occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
        totalUnits,
        occupiedUnits,
        byProperty,
        byCategory,
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to get occupancy analytics");
      res.status(500).json({ message: "Failed to get occupancy analytics" });
    }
  });

  app.get("/api/analytics/devices", requireAuth, requireFeature("advanced_analytics"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.json({ totalDevices: 0, byStatus: {}, byType: {} });
      
      const allDevices = await storage.getDevicesByOwner(user.ownerId);
      const byStatus: Record<string, number> = {};
      const byType: Record<string, number> = {};
      
      allDevices.forEach(d => {
        byStatus[d.status] = (byStatus[d.status] || 0) + 1;
        byType[d.deviceType] = (byType[d.deviceType] || 0) + 1;
      });
      
      const online = allDevices.filter(d => d.status === "online").length;
      const withErrors = allDevices.filter(d => d.status === "error").length;
      const needsUpdate = allDevices.filter(d => d.status === "firmware_update").length;
      
      res.json({
        totalDevices: allDevices.length,
        online,
        offline: allDevices.length - online,
        withErrors,
        needsUpdate,
        healthScore: allDevices.length > 0 ? Math.round((online / allDevices.length) * 100) : 100,
        byStatus,
        byType,
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to get device analytics");
      res.status(500).json({ message: "Failed to get device analytics" });
    }
  });

  app.get("/api/analytics/guests", requireAuth, requireFeature("advanced_analytics"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) return res.json({ totalGuests: 0, byNationality: {} });
      
      const props = await storage.getPropertiesByOwner(user.ownerId);
      const byNationality: Record<string, number> = {};
      const bySource: Record<string, number> = {};
      let totalGuests = 0;
      let totalBookings = 0;
      
      for (const prop of props) {
        const hotel = (await db.select().from(hotels).where(eq(hotels.propertyId, prop.id)).limit(1))[0];
        if (hotel) {
          const bookings = await storage.getBookingsByHotel(hotel.id, req.tenantId!);
          totalBookings += bookings.length;
          bookings.forEach(b => {
            if (b.nationality) byNationality[b.nationality] = (byNationality[b.nationality] || 0) + 1;
            if (b.bookingSource) bySource[b.bookingSource] = (bySource[b.bookingSource] || 0) + 1;
          });
        }
      }
      
      const guests = await storage.getUsersByOwner(user.ownerId, req.tenantId!);
      totalGuests = guests.filter(g => g.role === "guest").length;
      
      res.json({ totalGuests, totalBookings, byNationality, bySource });
    } catch (error) {
      logger.error({ err: error }, "Failed to get guest analytics");
      res.status(500).json({ message: "Failed to get guest analytics" });
    }
  });
}
