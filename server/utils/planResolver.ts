import type { PlanCode, User } from "@shared/schema";
import { PLAN_TYPE_TO_CODE } from "@shared/schema";
import { PLAN_CODE_FEATURES, type PlanCodeConfig, type BusinessFeature } from "@shared/planFeatures";
import { storage } from "../storage";
import { logger } from "./logger";

export function getPlanFeatures(planCode: PlanCode): PlanCodeConfig {
  const config = PLAN_CODE_FEATURES[planCode];
  if (!config) {
    return PLAN_CODE_FEATURES["CORE_STARTER"];
  }
  return config;
}

export async function getOwnerPlanCode(ownerId: string): Promise<PlanCode> {
  const sub = await storage.getSubscriptionByOwner(ownerId);
  if (!sub) {
    return "CORE_STARTER";
  }

  let storedPlanCode: PlanCode;
  if (sub.planCode && sub.planCode in PLAN_CODE_FEATURES) {
    storedPlanCode = sub.planCode as PlanCode;
  } else {
    const mapped = PLAN_TYPE_TO_CODE[sub.planType as keyof typeof PLAN_TYPE_TO_CODE];
    storedPlanCode = mapped || "CORE_STARTER";
  }

  logger.debug({ planType: sub.planType, storedPlanCode }, "EffectivePlan resolved");

  return storedPlanCode;
}

export async function getOwnerFeatures(ownerId: string): Promise<{ planCode: PlanCode; features: PlanCodeConfig }> {
  const planCode = await getOwnerPlanCode(ownerId);
  const features = getPlanFeatures(planCode);
  return { planCode, features };
}

export async function resolveOwnerIdFromUser(user: User): Promise<string | null> {
  let ownerId = user.ownerId || null;

  if (!ownerId && user.hotelId) {
    const hotel = await storage.getHotel(user.hotelId);
    if (hotel?.ownerId) {
      ownerId = hotel.ownerId;
    } else if (hotel?.propertyId) {
      const prop = await storage.getProperty(hotel.propertyId);
      ownerId = prop?.ownerId || null;
    }
  }

  if (!ownerId && user.propertyId) {
    const prop = await storage.getProperty(user.propertyId);
    ownerId = prop?.ownerId || null;
  }

  return ownerId;
}

export async function resolveUserFeatures(user: User): Promise<{ planCode: PlanCode; config: PlanCodeConfig } | null> {
  const ownerId = await resolveOwnerIdFromUser(user);
  if (!ownerId) return null;

  const planCode = await getOwnerPlanCode(ownerId);
  const config = getPlanFeatures(planCode);
  return { planCode, config };
}
