import { storage } from "../storage";
import { resolveOwnerIdFromUser, resolveUserFeatures } from "../utils/planResolver";
import type { User } from "@shared/schema";
import { logger } from "../utils/logger";

const usageLogger = logger.child({ module: "plan-usage" });

export class PlanLimitError extends Error {
  public readonly error = "plan_limit_exceeded";
  public readonly feature: string;
  public readonly currentPlan: string;
  public readonly currentCount: number;
  public readonly maxAllowed: number;

  constructor(feature: string, currentPlan: string, currentCount: number, maxAllowed: number, message: string) {
    super(message);
    this.feature = feature;
    this.currentPlan = currentPlan;
    this.currentCount = currentCount;
    this.maxAllowed = maxAllowed;
  }

  toJSON() {
    return {
      error: this.error,
      message: this.message,
      feature: this.feature,
      currentPlan: this.currentPlan,
      currentCount: this.currentCount,
      maxAllowed: this.maxAllowed,
    };
  }
}

async function resolveContext(user: User) {
  const ownerId = await resolveOwnerIdFromUser(user);
  if (!ownerId) return null;

  const result = await resolveUserFeatures(user);
  if (!result) return null;

  return { ownerId, planCode: result.planCode, config: result.config };
}

export async function checkRoomLimit(user: User, propertyId?: string, requestedCount = 1): Promise<void> {
  const ctx = await resolveContext(user);
  if (!ctx) return;

  const { ownerId, planCode, config } = ctx;
  const maxUnits = config.limits.maxUnitsPerProperty;

  if (!propertyId) {
    const properties = await storage.getPropertiesByOwner(ownerId);
    for (const prop of properties) {
      const existingUnits = await storage.getUnitsByProperty(prop.id);
      if (existingUnits.length + requestedCount > maxUnits) {
        usageLogger.info({ ownerId, plan: planCode, propertyId: prop.id, current: existingUnits.length, max: maxUnits }, "Room limit exceeded");
        throw new PlanLimitError(
          "rooms_limit",
          planCode,
          existingUnits.length,
          maxUnits,
          `Your ${config.displayName} plan allows up to ${maxUnits} rooms per property. Property "${prop.id}" has ${existingUnits.length}. Upgrade your plan to add more rooms.`,
        );
      }
    }
    return;
  }

  const existingUnits = await storage.getUnitsByProperty(propertyId);
  if (existingUnits.length + requestedCount > maxUnits) {
    usageLogger.info({ ownerId, plan: planCode, propertyId, current: existingUnits.length, max: maxUnits }, "Room limit exceeded");
    throw new PlanLimitError(
      "rooms_limit",
      planCode,
      existingUnits.length,
      maxUnits,
      `Your ${config.displayName} plan allows up to ${maxUnits} rooms per property. You currently have ${existingUnits.length}. Upgrade your plan to add more rooms.`,
    );
  }
}

export async function checkStaffLimit(user: User): Promise<void> {
  const ctx = await resolveContext(user);
  if (!ctx) return;

  const { ownerId, planCode, config } = ctx;
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
    usageLogger.info({ ownerId, plan: planCode, currentStaff: totalStaff, maxStaff }, "Staff limit exceeded");
    throw new PlanLimitError(
      "staff_limit",
      planCode,
      totalStaff,
      maxStaff,
      `Your ${config.displayName} plan allows up to ${maxStaff} staff member${maxStaff === 1 ? "" : "s"}. You currently have ${totalStaff}. Upgrade your plan to add more staff.`,
    );
  }
}

export async function checkIntegrationLimit(user: User, propertyId?: string): Promise<void> {
  const ctx = await resolveContext(user);
  if (!ctx) return;

  const { ownerId, planCode, config } = ctx;
  const maxIntegrations = config.limits.maxIntegrations;

  const properties = await storage.getPropertiesByOwner(ownerId);
  let totalIntegrations = 0;
  for (const prop of properties) {
    if (!prop.tenantId) continue;
    const integrations = await storage.getOtaIntegrationsByProperty(prop.id, prop.tenantId);
    totalIntegrations += integrations.length;
  }

  if (totalIntegrations >= maxIntegrations) {
    usageLogger.info({ ownerId, plan: planCode, current: totalIntegrations, max: maxIntegrations }, "Integration limit exceeded");
    throw new PlanLimitError(
      "integrations_limit",
      planCode,
      totalIntegrations,
      maxIntegrations,
      `Your ${config.displayName} plan allows up to ${maxIntegrations} integration${maxIntegrations === 1 ? "" : "s"}. You currently have ${totalIntegrations}. Upgrade your plan to add more integrations.`,
    );
  }
}

export async function checkApiMonthlyLimit(tenantId: string, user: User): Promise<void> {
  const ctx = await resolveContext(user);
  if (!ctx) return;

  const { planCode, config } = ctx;
  const maxApiCalls = config.limits.maxApiCallsMonthly;

  const currentCount = await storage.countApiUsageThisMonth(tenantId);

  if (currentCount >= maxApiCalls) {
    usageLogger.info({ tenantId, plan: planCode, current: currentCount, max: maxApiCalls }, "API monthly limit exceeded");
    throw new PlanLimitError(
      "api_monthly_limit",
      planCode,
      currentCount,
      maxApiCalls,
      `Your ${config.displayName} plan allows up to ${maxApiCalls.toLocaleString()} API calls per month. You have used ${currentCount.toLocaleString()}. Upgrade your plan for higher limits.`,
    );
  }
}
