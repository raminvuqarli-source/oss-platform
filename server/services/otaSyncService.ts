import { storage } from "../storage";
import { logger } from "../utils/logger";
import type { OtaIntegration } from "@shared/schema";
import { exportAvailability, type AvailabilityEntry } from "./availabilityExportService";
import { exportRates, type RateEntry } from "./rateExportService";
import { sendAvailabilityToBookingCom, sendRatesToBookingCom, fetchReservationsFromBookingCom } from "../integrations/booking";
import { sendAvailabilityToAirbnb, sendRatesToAirbnb, fetchReservationsFromAirbnb } from "../integrations/airbnb";
import { sendAvailabilityToExpedia, sendRatesToExpedia, fetchReservationsFromExpedia } from "../integrations/expedia";
import { getJobQueue } from "./jobQueue";
import { enqueueOtaSync } from "../workers/otaSyncWorker";

const otaLogger = logger.child({ module: "ota-sync" });

export type OtaProvider = "booking_com" | "airbnb" | "expedia";
export type OtaSyncAction = "push_availability" | "push_rates" | "pull_reservations";

export interface OtaReservation {
  externalId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  unitName: string;
  price: number;
  status: string;
}

export interface OtaSyncResult {
  provider: OtaProvider;
  action: OtaSyncAction;
  success: boolean;
  message: string;
}

function mapOtaStatus(otaStatus: string): string {
  switch (otaStatus.toLowerCase()) {
    case "confirmed":
      return "booked";
    case "cancelled":
      return "cancelled";
    case "modified":
      return "modified";
    default:
      return "booked";
  }
}

async function logSyncAction(
  provider: string,
  propertyId: string,
  tenantId: string | null,
  action: string,
  status: string,
  response: string | null
): Promise<void> {
  try {
    await storage.createOtaSyncLog({
      provider,
      propertyId,
      tenantId,
      action,
      status,
      response,
    });
  } catch (err) {
    otaLogger.error({ err, provider, propertyId, action }, "Failed to write OTA sync log");
  }
}

function generateDateRange(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const cursor = new Date(start);
  while (cursor < end) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export async function pushAvailability(propertyId: string, tenantId?: string | null): Promise<OtaSyncResult[]> {
  const results: OtaSyncResult[] = [];
  const integrations = await storage.getActiveOtaIntegrations(propertyId, tenantId);

  if (integrations.length === 0) {
    otaLogger.debug({ propertyId }, "No active OTA integrations for property");
    return results;
  }

  const availability = await exportAvailability(propertyId);

  if (availability.length === 0) {
    otaLogger.debug({ propertyId }, "No availability data to push");
    return results;
  }

  for (const integration of integrations) {
    const provider = integration.provider as OtaProvider;
    try {
      let result: { success: boolean; message: string };

      switch (provider) {
        case "booking_com":
          result = await sendAvailabilityToBookingCom(integration, availability);
          break;
        case "airbnb":
          result = await sendAvailabilityToAirbnb(integration, availability);
          break;
        case "expedia":
          result = await sendAvailabilityToExpedia(integration, availability);
          break;
        default:
          result = { success: false, message: `Unknown provider: ${provider}` };
      }

      await logSyncAction(provider, propertyId, tenantId || null, "push_availability", result.success ? "success" : "failed", result.message);
      results.push({ provider, action: "push_availability", ...result });

      otaLogger.info({ propertyId, provider, success: result.success, entries: availability.length }, "Availability push completed");
    } catch (err: any) {
      await logSyncAction(provider, propertyId, tenantId || null, "push_availability", "error", err.message);
      results.push({ provider, action: "push_availability", success: false, message: err.message });
      otaLogger.error({ err, propertyId, provider }, "Availability push failed");
    }
  }

  return results;
}

export async function pushRates(propertyId: string, tenantId?: string | null): Promise<OtaSyncResult[]> {
  const results: OtaSyncResult[] = [];
  const integrations = await storage.getActiveOtaIntegrations(propertyId, tenantId);

  if (integrations.length === 0) {
    otaLogger.debug({ propertyId }, "No active OTA integrations for property");
    return results;
  }

  const rates = await exportRates(propertyId, tenantId);

  if (rates.length === 0) {
    otaLogger.debug({ propertyId }, "No rate data to push");
    return results;
  }

  for (const integration of integrations) {
    const provider = integration.provider as OtaProvider;
    try {
      let result: { success: boolean; message: string };

      switch (provider) {
        case "booking_com":
          result = await sendRatesToBookingCom(integration, rates);
          break;
        case "airbnb":
          result = await sendRatesToAirbnb(integration, rates);
          break;
        case "expedia":
          result = await sendRatesToExpedia(integration, rates);
          break;
        default:
          result = { success: false, message: `Unknown provider: ${provider}` };
      }

      await logSyncAction(provider, propertyId, tenantId || null, "push_rates", result.success ? "success" : "failed", result.message);
      results.push({ provider, action: "push_rates", ...result });

      otaLogger.info({ propertyId, provider, success: result.success, entries: rates.length }, "Rates push completed");
    } catch (err: any) {
      await logSyncAction(provider, propertyId, tenantId || null, "push_rates", "error", err.message);
      results.push({ provider, action: "push_rates", success: false, message: err.message });
      otaLogger.error({ err, propertyId, provider }, "Rates push failed");
    }
  }

  return results;
}

export async function pullReservations(propertyId: string, tenantId?: string | null): Promise<OtaSyncResult[]> {
  const results: OtaSyncResult[] = [];
  const integrations = await storage.getActiveOtaIntegrations(propertyId, tenantId);

  if (integrations.length === 0) {
    otaLogger.debug({ propertyId }, "No active OTA integrations for property");
    return results;
  }

  const units = await storage.getUnitsByProperty(propertyId);
  const unitNameMap = new Map<string, { id: string; unitNumber: string; roomType: string }>();
  for (const u of units) {
    if (u.unitNumber) {
      unitNameMap.set(u.unitNumber.toLowerCase().trim(), { id: u.id, unitNumber: u.unitNumber, roomType: u.unitType || "Standard" });
    }
    if (u.unitType) {
      unitNameMap.set(u.unitType.toLowerCase().trim(), { id: u.id, unitNumber: u.unitNumber || "", roomType: u.unitType });
    }
  }

  let triggerAvailabilityPush = false;

  for (const integration of integrations) {
    const provider = integration.provider as OtaProvider;
    try {
      let reservations: OtaReservation[] = [];

      switch (provider) {
        case "booking_com":
          reservations = await fetchReservationsFromBookingCom(integration);
          break;
        case "airbnb":
          reservations = await fetchReservationsFromAirbnb(integration);
          break;
        case "expedia":
          reservations = await fetchReservationsFromExpedia(integration);
          break;
      }

      let inserted = 0;
      let updated = 0;
      let conflicts = 0;
      let failed = 0;

      for (const res of reservations) {
        try {
          const mappedUnit = unitNameMap.get(res.unitName.toLowerCase().trim()) || null;
          const internalStatus = mapOtaStatus(res.status);

          const existing = await storage.getExternalBookingByExternalId(res.externalId, propertyId);

          if (existing) {
            if (internalStatus === "cancelled") {
              await storage.updateExternalBooking(existing.id, {
                guestName: res.guestName,
                checkinDate: res.checkIn,
                checkoutDate: res.checkOut,
                roomName: res.unitName,
                price: res.price,
                status: "cancelled",
              });
              updated++;
              triggerAvailabilityPush = true;
              otaLogger.info({ externalId: res.externalId, provider }, "OTA reservation cancelled — external booking updated");
            } else if (internalStatus === "modified") {
              await storage.updateExternalBooking(existing.id, {
                guestName: res.guestName,
                checkinDate: res.checkIn,
                checkoutDate: res.checkOut,
                roomName: res.unitName,
                price: res.price,
                status: "confirmed",
              });
              updated++;
              triggerAvailabilityPush = true;
              otaLogger.info({ externalId: res.externalId, provider }, "OTA reservation modified — external booking updated");
            } else {
              await storage.updateExternalBooking(existing.id, {
                guestName: res.guestName,
                checkinDate: res.checkIn,
                checkoutDate: res.checkOut,
                roomName: res.unitName,
                price: res.price,
                status: "confirmed",
              });
              updated++;
            }
            continue;
          }

          if (!mappedUnit) {
            await storage.createExternalBooking({
              hotelId: propertyId,
              tenantId: tenantId || null,
              source: provider,
              externalId: res.externalId,
              guestName: res.guestName,
              checkinDate: res.checkIn,
              checkoutDate: res.checkOut,
              roomName: res.unitName,
              price: res.price,
              status: "unmapped",
            });
            await storage.createOtaConflict({
              provider,
              externalId: res.externalId,
              propertyId,
              tenantId: tenantId || null,
              unitId: null,
              checkIn: res.checkIn,
              checkOut: res.checkOut,
              guestName: res.guestName,
              reason: `Unit name "${res.unitName}" could not be mapped to any internal unit`,
            });
            conflicts++;
            otaLogger.warn({ externalId: res.externalId, unitName: res.unitName, provider }, "OTA reservation unmapped — no matching unit found");
            continue;
          }

          const nightDates = generateDateRange(res.checkIn, res.checkOut);
          const existingNights = await storage.getRoomNightsByUnit(
            mappedUnit.id,
            nightDates[0],
            nightDates[nightDates.length - 1]
          );
          const occupiedDates = new Set(existingNights.map(rn => rn.date));
          const conflictDates = nightDates.filter(d => occupiedDates.has(d));

          if (conflictDates.length > 0) {
            await storage.createExternalBooking({
              hotelId: propertyId,
              tenantId: tenantId || null,
              source: provider,
              externalId: res.externalId,
              guestName: res.guestName,
              checkinDate: res.checkIn,
              checkoutDate: res.checkOut,
              roomName: res.unitName,
              price: res.price,
              status: "conflict",
            });
            await storage.createOtaConflict({
              provider,
              externalId: res.externalId,
              propertyId,
              tenantId: tenantId || null,
              unitId: mappedUnit.id,
              checkIn: res.checkIn,
              checkOut: res.checkOut,
              guestName: res.guestName,
              reason: `Room ${mappedUnit.unitNumber} already booked on dates: ${conflictDates.join(", ")}`,
            });
            conflicts++;
            otaLogger.warn({ externalId: res.externalId, unitId: mappedUnit.id, conflictDates, provider }, "OTA reservation conflict — room already booked");
            continue;
          }

          const property = await storage.getProperty(propertyId);
          const ownerId = property?.ownerId || null;

          const booking = await storage.createBooking({
            guestId: "ota_guest",
            roomNumber: mappedUnit.unitNumber,
            roomType: mappedUnit.roomType,
            checkInDate: new Date(res.checkIn),
            checkOutDate: new Date(res.checkOut),
            status: "booked",
            bookingSource: provider,
            numberOfGuests: 1,
            nightlyRate: Math.round(res.price / Math.max(nightDates.length, 1)),
            totalPrice: Math.round(res.price),
            currency: "USD",
            propertyId,
            unitId: mappedUnit.id,
            tenantId: tenantId || null,
            ownerId,
          });

          await storage.createExternalBooking({
            hotelId: propertyId,
            tenantId: tenantId || null,
            source: provider,
            externalId: res.externalId,
            guestName: res.guestName,
            checkinDate: res.checkIn,
            checkoutDate: res.checkOut,
            roomName: res.unitName,
            price: res.price,
            status: "confirmed",
          });

          inserted++;
          triggerAvailabilityPush = true;

          otaLogger.info(
            { externalId: res.externalId, bookingId: booking.id, unitId: mappedUnit.id, provider },
            "OTA reservation imported — internal booking created"
          );
        } catch (resErr: any) {
          failed++;
          otaLogger.error({ err: resErr, externalId: res.externalId, provider }, "Failed to process OTA reservation");
        }
      }

      const message = `Pulled ${reservations.length} reservations from ${provider}: ${inserted} inserted, ${updated} updated, ${conflicts} conflicts, ${failed} failed`;
      await logSyncAction(provider, propertyId, tenantId || null, "pull_reservations", "success", message);
      results.push({ provider, action: "pull_reservations", success: true, message });

      otaLogger.info({ propertyId, provider, total: reservations.length, inserted, updated, conflicts, failed }, "Reservations pull completed");
    } catch (err: any) {
      await logSyncAction(provider, propertyId, tenantId || null, "pull_reservations", "error", err.message);
      results.push({ provider, action: "pull_reservations", success: false, message: err.message });
      otaLogger.error({ err, propertyId, provider }, "Reservations pull failed");
    }
  }

  if (triggerAvailabilityPush) {
    try {
      const boss = await getJobQueue();
      await enqueueOtaSync(boss, propertyId, tenantId || null, "push_availability", "ota_reservation_sync");
      otaLogger.info({ propertyId }, "Availability push triggered after OTA reservation sync");
    } catch (err) {
      otaLogger.warn({ err, propertyId }, "Failed to trigger availability push after OTA reservation sync");
    }
  }

  return results;
}
