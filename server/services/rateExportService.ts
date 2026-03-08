import { storage } from "../storage";
import { logger } from "../utils/logger";
import { calculateDynamicPrice } from "./dynamicPricingService";

const exportLogger = logger.child({ module: "rate-export" });

export interface RateEntry {
  unitId: string;
  unitNumber: string;
  roomType: string;
  ratePlanId: string;
  ratePlanName: string;
  date: string;
  price: number;
  mealPlan: string;
  refundPolicy: string;
}

export async function exportRates(propertyId: string, tenantId?: string | null): Promise<RateEntry[]> {
  const units = await storage.getUnitsByProperty(propertyId);

  if (units.length === 0) {
    exportLogger.debug({ propertyId }, "No units found for property");
    return [];
  }

  const ratePlans = await storage.getRatePlansByProperty(propertyId, tenantId || "");
  const activeRatePlans = ratePlans.filter(rp => rp.isActive);

  if (activeRatePlans.length === 0) {
    exportLogger.debug({ propertyId }, "No active rate plans for property");
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 365);

  const entries: RateEntry[] = [];

  for (const unit of units) {
    const basePrice = unit.pricePerNight || 0;

    for (const rp of activeRatePlans) {
      const modifier = rp.priceModifier || 0;
      const finalPrice = Math.round(basePrice * (1 + modifier / 100));

      const cursor = new Date(today);
      while (cursor < endDate) {
        const dateStr = formatDate(cursor);
        let price = finalPrice;

        try {
          const dynamicResult = await calculateDynamicPrice(
            propertyId,
            tenantId || "",
            unit.id,
            dateStr,
          );
          if (dynamicResult.appliedRules.length > 0) {
            price = Math.round(dynamicResult.finalPrice * (1 + modifier / 100));
          }
        } catch {
        }

        entries.push({
          unitId: unit.id,
          unitNumber: unit.unitNumber || "",
          roomType: unit.unitType || "Standard",
          ratePlanId: rp.id,
          ratePlanName: rp.name,
          date: dateStr,
          price,
          mealPlan: rp.mealPlan || "none",
          refundPolicy: rp.refundPolicy || "flexible",
        });

        cursor.setDate(cursor.getDate() + 1);
      }
    }
  }

  exportLogger.info(
    { propertyId, unitCount: units.length, ratePlanCount: activeRatePlans.length, entryCount: entries.length },
    "Rate export generated"
  );

  return entries;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
