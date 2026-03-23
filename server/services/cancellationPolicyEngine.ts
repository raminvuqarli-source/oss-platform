import { storage } from "../storage";
import { logger } from "../utils/logger";
import type { Booking } from "@shared/schema";

const policyLog = logger.child({ module: "cancellation-policy" });

export interface CancellationPenaltyResult {
  bookingId: string;
  action: "no_show" | "cancelled";
  depositCents: number;
  penaltyCents: number;
  refundCents: number;
  folioId: string | null;
  applied: boolean;
  reason: string;
}

function calcPenalty(
  depositCents: number,
  penaltyType: string,
  penaltyValue: number,
): number {
  if (penaltyType === "percent") {
    return Math.min(depositCents, Math.round(depositCents * penaltyValue / 10000));
  }
  return Math.min(depositCents, penaltyValue);
}

export async function applyCancellationPolicy(
  booking: Booking,
  action: "no_show" | "cancelled",
  hotelId: string,
): Promise<CancellationPenaltyResult> {
  const result: CancellationPenaltyResult = {
    bookingId: booking.id,
    action,
    depositCents: 0,
    penaltyCents: 0,
    refundCents: 0,
    folioId: null,
    applied: false,
    reason: "",
  };

  try {
    const policy = await storage.getDefaultCancellationPolicy(hotelId);

    let folio = await storage.getGuestFolioByBooking(booking.id);
    if (!folio) {
      const folioNumber = `F-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;
      folio = await storage.createGuestFolio({
        bookingId: booking.id,
        guestId: booking.guestId,
        hotelId,
        propertyId: booking.propertyId ?? undefined,
        tenantId: booking.tenantId ?? undefined,
        folioNumber,
        status: "open",
        currency: booking.currency ?? "USD",
        openedAt: new Date(),
        notes: `Auto-opened for ${action} billing`,
      });
      policyLog.info({ bookingId: booking.id, folioId: folio.id }, "Folio created for cancellation/no-show");
    }

    result.folioId = folio.id;

    if (folio.status === "finalized") {
      result.reason = "Folio already finalized";
      result.applied = false;
      return result;
    }

    const depositPayments = (await storage.getFolioPayments(folio.id)).filter(p => p.isDeposit && p.status === "completed");
    const depositTotal = depositPayments.reduce((s, p) => s + (p.amount ?? 0), 0);
    result.depositCents = depositTotal;

    const legacyDeposit = booking.depositAmount ? Number(booking.depositAmount) : 0;

    const effectiveDeposit = depositTotal || legacyDeposit;

    if (effectiveDeposit === 0 && !policy) {
      result.reason = "No deposit found and no policy configured";
      result.applied = false;
      return result;
    }

    let penaltyCents = 0;

    if (policy) {
      const penaltyType = action === "no_show" ? policy.noShowPenaltyType! : policy.lateCancellationPenaltyType!;
      const penaltyValue = action === "no_show" ? (policy.noShowPenaltyValue ?? 10000) : (policy.lateCancellationPenaltyValue ?? 10000);

      if (action === "cancelled" && policy.freeCancellationHours) {
        const checkIn = booking.checkInDate ? new Date(booking.checkInDate) : null;
        if (checkIn) {
          const hoursUntilCheckin = (checkIn.getTime() - Date.now()) / 3600000;
          if (hoursUntilCheckin >= policy.freeCancellationHours) {
            result.reason = `Free cancellation window — ${Math.round(hoursUntilCheckin)}h before check-in ≥ ${policy.freeCancellationHours}h`;
            result.penaltyCents = 0;
            result.refundCents = effectiveDeposit;
            result.applied = true;

            if (effectiveDeposit > 0) {
              await storage.createFolioAdjustment({
                folioId: folio.id,
                bookingId: booking.id,
                hotelId,
                tenantId: booking.tenantId ?? undefined,
                adjustmentType: "refund",
                description: "Full refund — free cancellation window",
                amount: -effectiveDeposit,
                currency: folio.currency ?? "USD",
                approvalStatus: "approved",
                approvedAt: new Date(),
                createdBy: "system",
              });
              await storage.recalculateFolioBalance(folio.id);
            }
            return result;
          }
        }
      }

      penaltyCents = calcPenalty(effectiveDeposit, penaltyType!, penaltyValue);
    } else {
      penaltyCents = effectiveDeposit;
    }

    result.penaltyCents = penaltyCents;
    result.refundCents = Math.max(0, effectiveDeposit - penaltyCents);

    if (penaltyCents > 0) {
      await storage.createFolioCharge({
        folioId: folio.id,
        bookingId: booking.id,
        hotelId,
        tenantId: booking.tenantId ?? undefined,
        chargeType: "other",
        description: `${action === "no_show" ? "No-show" : "Cancellation"} penalty`,
        quantity: 1,
        unitPrice: penaltyCents,
        amountNet: penaltyCents,
        taxRate: 0,
        taxAmount: 0,
        amountGross: penaltyCents,
        isInclusive: false,
        currency: folio.currency ?? "USD",
        serviceDate: new Date(),
        idempotencyKey: `cancel-penalty-${booking.id}`,
        status: "posted",
      });
    }

    if (result.refundCents > 0) {
      await storage.createFolioAdjustment({
        folioId: folio.id,
        bookingId: booking.id,
        hotelId,
        tenantId: booking.tenantId ?? undefined,
        adjustmentType: "refund",
        description: `Deposit refund after ${action === "no_show" ? "no-show" : "cancellation"} penalty`,
        amount: -result.refundCents,
        currency: folio.currency ?? "USD",
        approvalStatus: "approved",
        approvedAt: new Date(),
        createdBy: "system",
      });
    }

    await storage.recalculateFolioBalance(folio.id);
    result.applied = true;
    result.reason = `Penalty: ${penaltyCents / 100} ${folio.currency}, Refund: ${result.refundCents / 100} ${folio.currency}`;

    policyLog.info({
      bookingId: booking.id,
      folioId: folio.id,
      action,
      depositCents: effectiveDeposit,
      penaltyCents,
      refundCents: result.refundCents,
    }, "Cancellation policy applied");
  } catch (err) {
    policyLog.error({ err, bookingId: booking.id, action }, "Failed to apply cancellation policy");
    result.reason = `Error: ${(err as Error).message}`;
    result.applied = false;
  }

  return result;
}
