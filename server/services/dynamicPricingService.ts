import { storage } from "../storage";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { logger } from "../utils/logger";
import type { PricingRule } from "@shared/schema";

const pricingLogger = logger.child({ module: "dynamic-pricing" });

interface AppliedRule {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  adjustmentType: string;
  adjustmentValue: number;
  priceImpact: number;
}

export interface DynamicPriceResult {
  date: string;
  basePrice: number;
  finalPrice: number;
  appliedRules: AppliedRule[];
}

interface RuleConditions {
  days?: number[];
  threshold?: number;
  direction?: "above" | "below";
  startDate?: string;
  endDate?: string;
  withinDays?: number;
  daysAhead?: number;
}

interface RuleAdjustment {
  type: "percentage" | "fixed";
  value: number;
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function matchesDayOfWeek(date: Date, conditions: RuleConditions): boolean {
  const days = conditions.days;
  if (!days || !Array.isArray(days)) return false;
  return days.includes(date.getDay());
}

function matchesSeasonal(date: Date, conditions: RuleConditions): boolean {
  const { startDate, endDate } = conditions;
  if (!startDate || !endDate) return false;

  const [startMM, startDD] = startDate.split("-").map(Number);
  const [endMM, endDD] = endDate.split("-").map(Number);

  const month = date.getMonth() + 1;
  const day = date.getDate();

  const dateVal = month * 100 + day;
  const startVal = startMM * 100 + startDD;
  const endVal = endMM * 100 + endDD;

  if (startVal <= endVal) {
    return dateVal >= startVal && dateVal <= endVal;
  }
  return dateVal >= startVal || dateVal <= endVal;
}

function matchesLastMinute(date: Date, conditions: RuleConditions): boolean {
  const withinDays = conditions.withinDays;
  if (typeof withinDays !== "number") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= withinDays;
}

function matchesEarlyBird(date: Date, conditions: RuleConditions): boolean {
  const daysAhead = conditions.daysAhead;
  if (typeof daysAhead !== "number") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= daysAhead;
}

async function getOccupancyForDate(propertyId: string, tenantId: string, date: string): Promise<number> {
  const result = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM room_nights rn
        JOIN bookings b ON b.id = rn.booking_id
        WHERE rn.property_id = ${propertyId}
          AND rn.tenant_id = ${tenantId}
          AND rn.date = ${date}
          AND b.status NOT IN ('cancelled', 'no_show')
      ) AS booked,
      (SELECT COUNT(*) FROM units
        WHERE property_id = ${propertyId}
          AND tenant_id = ${tenantId}
          AND is_active = true
          AND unit_category = 'accommodation'
      ) AS total
  `);
  const row = result.rows[0] as any;
  const booked = parseInt(row.booked) || 0;
  const total = parseInt(row.total) || 0;
  if (total === 0) return 0;
  return (booked / total) * 100;
}

function matchesRule(rule: PricingRule, date: Date, occupancy: number | null): boolean {
  const conditions = rule.conditions as RuleConditions;

  switch (rule.ruleType) {
    case "day_of_week":
      return matchesDayOfWeek(date, conditions);
    case "seasonal":
      return matchesSeasonal(date, conditions);
    case "last_minute":
      return matchesLastMinute(date, conditions);
    case "early_bird":
      return matchesEarlyBird(date, conditions);
    case "occupancy": {
      if (occupancy === null) return false;
      const threshold = conditions.threshold || 80;
      const direction = conditions.direction || "above";
      return direction === "above" ? occupancy >= threshold : occupancy <= threshold;
    }
    default:
      return false;
  }
}

function applyAdjustment(currentPrice: number, adjustment: RuleAdjustment): number {
  if (adjustment.type === "percentage") {
    return Math.round(currentPrice * (1 + adjustment.value / 100));
  }
  return currentPrice + Math.round(adjustment.value);
}

export async function calculateDynamicPrice(
  propertyId: string,
  tenantId: string,
  unitId: string,
  dateStr: string,
): Promise<DynamicPriceResult> {
  const unit = await storage.getUnit(unitId);
  if (!unit) {
    return { date: dateStr, basePrice: 0, finalPrice: 0, appliedRules: [] };
  }

  const basePrice = unit.pricePerNight || 0;
  const rules = await storage.getPricingRulesByProperty(propertyId, tenantId);
  const activeRules = rules.filter((r) => r.isActive);

  if (activeRules.length === 0) {
    return { date: dateStr, basePrice, finalPrice: basePrice, appliedRules: [] };
  }

  const date = parseDate(dateStr);

  const hasOccupancyRule = activeRules.some((r) => r.ruleType === "occupancy");
  let occupancy: number | null = null;
  if (hasOccupancyRule) {
    occupancy = await getOccupancyForDate(propertyId, tenantId, dateStr);
  }

  let currentPrice = basePrice;
  const appliedRules: AppliedRule[] = [];

  for (const rule of activeRules) {
    if (!matchesRule(rule, date, occupancy)) continue;

    const adjustment = rule.adjustment as RuleAdjustment;
    const prevPrice = currentPrice;
    currentPrice = applyAdjustment(currentPrice, adjustment);

    appliedRules.push({
      ruleId: rule.id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      adjustmentType: adjustment.type,
      adjustmentValue: adjustment.value,
      priceImpact: currentPrice - prevPrice,
    });
  }

  const finalPrice = Math.max(0, currentPrice);

  return { date: dateStr, basePrice, finalPrice, appliedRules };
}

export async function calculateDynamicPricesForRange(
  propertyId: string,
  tenantId: string,
  unitId: string,
  startDate: string,
  endDate: string,
): Promise<DynamicPriceResult[]> {
  const unit = await storage.getUnit(unitId);
  if (!unit) return [];

  const basePrice = unit.pricePerNight || 0;
  const rules = await storage.getPricingRulesByProperty(propertyId, tenantId);
  const activeRules = rules.filter((r) => r.isActive);

  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const results: DynamicPriceResult[] = [];

  const hasOccupancyRule = activeRules.some((r) => r.ruleType === "occupancy");
  const occupancyCache: Record<string, number> = {};

  const current = new Date(start);
  while (current < end) {
    const dateStr = formatDate(current);

    if (activeRules.length === 0) {
      results.push({ date: dateStr, basePrice, finalPrice: basePrice, appliedRules: [] });
      current.setDate(current.getDate() + 1);
      continue;
    }

    let occupancy: number | null = null;
    if (hasOccupancyRule) {
      if (!(dateStr in occupancyCache)) {
        occupancyCache[dateStr] = await getOccupancyForDate(propertyId, tenantId, dateStr);
      }
      occupancy = occupancyCache[dateStr];
    }

    let currentPrice = basePrice;
    const appliedRules: AppliedRule[] = [];

    for (const rule of activeRules) {
      if (!matchesRule(rule, current, occupancy)) continue;

      const adjustment = rule.adjustment as RuleAdjustment;
      const prevPrice = currentPrice;
      currentPrice = applyAdjustment(currentPrice, adjustment);

      appliedRules.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        adjustmentType: adjustment.type,
        adjustmentValue: adjustment.value,
        priceImpact: currentPrice - prevPrice,
      });
    }

    results.push({
      date: dateStr,
      basePrice,
      finalPrice: Math.max(0, currentPrice),
      appliedRules,
    });

    current.setDate(current.getDate() + 1);
  }

  pricingLogger.info(
    { propertyId, unitId, startDate, endDate, rulesEvaluated: activeRules.length, daysCalculated: results.length },
    "Dynamic prices calculated for range",
  );

  return results;
}
