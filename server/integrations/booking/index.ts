import { logger } from "../../utils/logger";
import type { OtaIntegration } from "@shared/schema";
import type { AvailabilityEntry } from "../../services/availabilityExportService";
import type { RateEntry } from "../../services/rateExportService";
import type { OtaReservation } from "../../services/otaSyncService";

const bookingLogger = logger.child({ module: "ota-booking-com" });

export async function sendAvailabilityToBookingCom(
  integration: OtaIntegration,
  availability: AvailabilityEntry[]
): Promise<{ success: boolean; message: string }> {
  const available = availability.filter(a => a.available).length;
  const blocked = availability.length - available;

  bookingLogger.info(
    {
      propertyId: integration.propertyId,
      totalEntries: availability.length,
      available,
      blocked,
      dateRange: availability.length > 0
        ? `${availability[0].date} → ${availability[availability.length - 1].date}`
        : "empty",
    },
    "Sending availability to Booking.com"
  );

  bookingLogger.warn("Booking.com Connectivity API not yet implemented — payload logged only");
  return {
    success: true,
    message: `stub: ${availability.length} entries (${available} available, ${blocked} blocked) queued for Booking.com`,
  };
}

export async function sendRatesToBookingCom(
  integration: OtaIntegration,
  rates: RateEntry[]
): Promise<{ success: boolean; message: string }> {
  const ratePlanNames = Array.from(new Set(rates.map(r => r.ratePlanName)));
  const unitCount = new Set(rates.map(r => r.unitId)).size;

  bookingLogger.info(
    {
      propertyId: integration.propertyId,
      totalEntries: rates.length,
      unitCount,
      ratePlans: ratePlanNames,
      dateRange: rates.length > 0
        ? `${rates[0].date} → ${rates[rates.length - 1].date}`
        : "empty",
    },
    "Sending rates to Booking.com"
  );

  bookingLogger.warn("Booking.com Connectivity API not yet implemented — payload logged only");
  return {
    success: true,
    message: `stub: ${rates.length} rate entries (${unitCount} units, ${ratePlanNames.length} plans) queued for Booking.com`,
  };
}

export async function fetchReservationsFromBookingCom(
  integration: OtaIntegration
): Promise<OtaReservation[]> {
  bookingLogger.info(
    { propertyId: integration.propertyId },
    "Fetching reservations from Booking.com"
  );

  bookingLogger.warn("Booking.com Connectivity API not yet implemented — returning empty");
  return [];
}
