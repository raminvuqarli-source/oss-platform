import { logger } from "../../utils/logger";
import type { OtaIntegration } from "@shared/schema";
import type { AvailabilityEntry } from "../../services/availabilityExportService";
import type { RateEntry } from "../../services/rateExportService";
import type { OtaReservation } from "../../services/otaSyncService";

const expediaLogger = logger.child({ module: "ota-expedia" });

export async function sendAvailabilityToExpedia(
  integration: OtaIntegration,
  availability: AvailabilityEntry[]
): Promise<{ success: boolean; message: string }> {
  const available = availability.filter(a => a.available).length;
  const blocked = availability.length - available;

  expediaLogger.info(
    {
      propertyId: integration.propertyId,
      totalEntries: availability.length,
      available,
      blocked,
    },
    "Sending availability to Expedia"
  );

  expediaLogger.warn("Expedia API client not yet implemented — payload logged only");
  return {
    success: true,
    message: `stub: ${availability.length} entries (${available} available, ${blocked} blocked) queued for Expedia`,
  };
}

export async function sendRatesToExpedia(
  integration: OtaIntegration,
  rates: RateEntry[]
): Promise<{ success: boolean; message: string }> {
  const unitCount = new Set(rates.map(r => r.unitId)).size;
  const ratePlanCount = new Set(rates.map(r => r.ratePlanId)).size;

  expediaLogger.info(
    {
      propertyId: integration.propertyId,
      totalEntries: rates.length,
      unitCount,
      ratePlanCount,
    },
    "Sending rates to Expedia"
  );

  expediaLogger.warn("Expedia API client not yet implemented — payload logged only");
  return {
    success: true,
    message: `stub: ${rates.length} rate entries (${unitCount} units, ${ratePlanCount} plans) queued for Expedia`,
  };
}

export async function fetchReservationsFromExpedia(
  integration: OtaIntegration
): Promise<OtaReservation[]> {
  expediaLogger.info(
    { propertyId: integration.propertyId },
    "Fetching reservations from Expedia"
  );

  expediaLogger.warn("Expedia API client not yet implemented — returning empty");
  return [];
}
