import { db } from "../db";
import { eq, and, gte, lt } from "drizzle-orm";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { folioCharges, guestFolios, dailyFinancialSummaries } from "@shared/schema";

const auditLog = logger.child({ module: "night-audit-engine" });

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface NightAuditResult {
  date: string;
  hotelId: string;
  bookingsProcessed: number;
  chargesPosted: number;
  chargesSkipped: number;
  totalRoomRevenueCents: number;
  errors: string[];
}

export async function runNightAuditForHotel(
  hotelId: string,
  tenantId: string,
  auditDate?: Date,
): Promise<NightAuditResult> {
  const targetDate = auditDate ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  const dateStr = formatDate(targetDate);
  const result: NightAuditResult = {
    date: dateStr,
    hotelId,
    bookingsProcessed: 0,
    chargesPosted: 0,
    chargesSkipped: 0,
    totalRoomRevenueCents: 0,
    errors: [],
  };

  auditLog.info({ hotelId, date: dateStr }, "Night audit started");

  const activeBookings = await storage.getCheckedInBookingsByHotel(hotelId, tenantId);
  result.bookingsProcessed = activeBookings.length;

  for (const booking of activeBookings) {
    try {
      if (!booking.nightlyRate || !booking.checkInDate) continue;

      const checkIn = new Date(booking.checkInDate);
      checkIn.setHours(0, 0, 0, 0);

      const checkOut = booking.checkOutDate ? new Date(booking.checkOutDate) : null;
      if (checkOut) checkOut.setHours(0, 0, 0, 0);

      if (targetDate < checkIn) continue;
      if (checkOut && targetDate >= checkOut) continue;

      const idempotencyKey = `room-night-${booking.id}-${dateStr}`;

      const [existingCharge] = await db
        .select()
        .from(folioCharges)
        .where(eq(folioCharges.idempotencyKey, idempotencyKey))
        .limit(1);

      if (existingCharge) {
        result.chargesSkipped++;
        continue;
      }

      const folio = await storage.getGuestFolioByBooking(booking.id);
      if (!folio || folio.status === "finalized") {
        result.chargesSkipped++;
        continue;
      }

      const unitPrice = booking.nightlyRate;
      const amountNet = unitPrice;
      const taxRate = 0;
      const taxAmount = 0;
      const amountGross = amountNet;

      await storage.createFolioCharge({
        folioId: folio.id,
        bookingId: booking.id,
        hotelId,
        tenantId: tenantId ?? undefined,
        chargeType: "room_night",
        description: `Room night — ${dateStr} @ ${booking.roomNumber ?? ""}`,
        quantity: 1,
        unitPrice,
        amountNet,
        taxRate,
        taxAmount,
        amountGross,
        isInclusive: false,
        currency: booking.currency ?? "USD",
        serviceDate: new Date(targetDate),
        idempotencyKey,
        status: "posted",
      });

      await storage.recalculateFolioBalance(folio.id);
      result.chargesPosted++;
      result.totalRoomRevenueCents += amountGross;

      auditLog.info({ bookingId: booking.id, folioId: folio.id, date: dateStr, amount: amountGross }, "Room night charge posted");
    } catch (err: any) {
      const msg = `Booking ${booking.id}: ${err.message ?? String(err)}`;
      result.errors.push(msg);
      auditLog.error({ err, bookingId: booking.id }, "Failed to post room night charge");
    }
  }

  await upsertDailyFinancialSummary(hotelId, tenantId, targetDate, result.totalRoomRevenueCents);
  auditLog.info({ hotelId, date: dateStr, ...result }, "Night audit completed");
  return result;
}

async function upsertDailyFinancialSummary(
  hotelId: string,
  tenantId: string,
  date: Date,
  roomRevenueCents: number,
): Promise<void> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay.getTime() + 86400000);

    const allFolioChargesForDay = await db
      .select()
      .from(folioCharges)
      .where(and(
        eq(folioCharges.hotelId, hotelId),
        eq(folioCharges.status, "posted"),
        gte(folioCharges.serviceDate!, startOfDay),
        lt(folioCharges.serviceDate!, endOfDay),
      ));

    const roomRevenue = allFolioChargesForDay.filter(c => c.chargeType === "room_night").reduce((s, c) => s + c.amountGross, 0);
    const fbRevenue = allFolioChargesForDay.filter(c => c.chargeType === "restaurant").reduce((s, c) => s + c.amountGross, 0);
    const spaRevenue = allFolioChargesForDay.filter(c => c.chargeType === "spa").reduce((s, c) => s + c.amountGross, 0);
    const otherRevenue = allFolioChargesForDay.filter(c => !["room_night", "restaurant", "spa"].includes(c.chargeType)).reduce((s, c) => s + c.amountGross, 0);
    const totalRevenue = roomRevenue + fbRevenue + spaRevenue + otherRevenue;
    const totalTax = allFolioChargesForDay.reduce((s, c) => s + (c.taxAmount ?? 0), 0);

    const openFolios = await db.select().from(guestFolios).where(and(eq(guestFolios.hotelId, hotelId), eq(guestFolios.status, "open")));
    const occupiedRooms = openFolios.length;

    await storage.upsertDailyFinancialSummary({
      hotelId,
      tenantId: tenantId ?? undefined,
      summaryDate: startOfDay,
      roomRevenue,
      fbRevenue,
      spaRevenue,
      otherRevenue,
      totalRevenue,
      totalTax,
      totalExpenses: 0,
      occupiedRooms,
      totalRooms: 0,
      occupancyRate: 0,
      adr: occupiedRooms > 0 ? Math.round(roomRevenue / occupiedRooms) : 0,
      revpar: 0,
    });
  } catch (err) {
    auditLog.error({ err, hotelId, date: date.toISOString() }, "Failed to upsert daily financial summary");
  }
}

export async function runNightAuditForAllHotels(auditDate?: Date): Promise<NightAuditResult[]> {
  const hotels = await db.query?.hotels?.findMany?.() ?? [];
  const results: NightAuditResult[] = [];
  auditLog.info({ count: hotels.length, date: formatDate(auditDate ?? new Date()) }, "Running night audit for all hotels");
  for (const hotel of hotels) {
    try {
      const r = await runNightAuditForHotel(hotel.id, hotel.tenantId ?? hotel.id, auditDate);
      results.push(r);
    } catch (err) {
      auditLog.error({ err, hotelId: hotel.id }, "Night audit failed for hotel");
    }
  }
  return results;
}
