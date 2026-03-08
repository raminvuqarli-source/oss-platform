import { logger } from "../../utils/logger";
import type { OtaIntegration } from "@shared/schema";
import type { AvailabilityEntry } from "../../services/availabilityExportService";
import type { RateEntry } from "../../services/rateExportService";
import type { OtaReservation } from "../../services/otaSyncService";

const airbnbLogger = logger.child({ module: "ota-airbnb" });

export async function sendAvailabilityToAirbnb(
  integration: OtaIntegration,
  availability: AvailabilityEntry[]
): Promise<{ success: boolean; message: string }> {
  const available = availability.filter(a => a.available).length;
  const blocked = availability.length - available;

  airbnbLogger.info(
    {
      propertyId: integration.propertyId,
      totalEntries: availability.length,
      available,
      blocked,
    },
    "Sending availability to Airbnb"
  );

  airbnbLogger.warn("Airbnb API client not yet implemented — payload logged only");
  return {
    success: true,
    message: `stub: ${availability.length} entries (${available} available, ${blocked} blocked) queued for Airbnb`,
  };
}

export async function sendRatesToAirbnb(
  integration: OtaIntegration,
  rates: RateEntry[]
): Promise<{ success: boolean; message: string }> {
  const unitCount = new Set(rates.map(r => r.unitId)).size;
  const ratePlanCount = new Set(rates.map(r => r.ratePlanId)).size;

  airbnbLogger.info(
    {
      propertyId: integration.propertyId,
      totalEntries: rates.length,
      unitCount,
      ratePlanCount,
    },
    "Sending rates to Airbnb"
  );

  airbnbLogger.warn("Airbnb API client not yet implemented — payload logged only");
  return {
    success: true,
    message: `stub: ${rates.length} rate entries (${unitCount} units, ${ratePlanCount} plans) queued for Airbnb`,
  };
}

export async function fetchReservationsFromAirbnb(
  integration: OtaIntegration
): Promise<OtaReservation[]> {
  airbnbLogger.info(
    { propertyId: integration.propertyId },
    "Fetching reservations from Airbnb"
  );

  airbnbLogger.warn("Airbnb API client not yet implemented — returning empty");
  return [];
}
