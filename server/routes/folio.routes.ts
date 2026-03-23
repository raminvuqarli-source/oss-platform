import { Express } from "express";
import { storage } from "../storage";
import { requireAuth, requireRole } from "../middleware";
import { logger } from "../utils/logger";

function generateFolioNumber(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `F-${ymd}-${rand}`;
}

function generateJournalNumber(): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `JE-${ymd}-${rand}`;
}

async function getHotelContext(userId: string) {
  const user = await storage.getUser(userId);
  if (!user) return null;
  let hotelId = user.hotelId;
  if (!hotelId && user.propertyId) {
    const hotel = await storage.getHotelByPropertyId(user.propertyId);
    if (hotel) hotelId = hotel.id;
  }
  return { user, hotelId };
}

export function registerFolioRoutes(app: Express): void {

  // ── List folios ──────────────────────────────────────────
  app.get("/api/folios", requireRole("admin", "owner_admin", "property_manager", "reception"), async (req, res) => {
    try {
      const ctx = await getHotelContext(req.session.userId!);
      if (!ctx?.hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const folios = await storage.getGuestFoliosByHotel(ctx.hotelId, req.tenantId!);
      res.json(folios);
    } catch (e) {
      logger.error({ err: e }, "Error fetching folios");
      res.status(500).json({ message: "Failed to fetch folios" });
    }
  });

  // ── Get folio by booking ──────────────────────────────────
  app.get("/api/folios/booking/:bookingId", requireAuth, async (req, res) => {
    try {
      const folio = await storage.getGuestFolioByBooking(req.params.bookingId);
      if (!folio) return res.status(404).json({ message: "Folio not found" });
      const [charges, payments, adjustments] = await Promise.all([
        storage.getFolioCharges(folio.id),
        storage.getFolioPayments(folio.id),
        storage.getFolioAdjustments(folio.id),
      ]);
      res.json({ ...folio, charges, payments, adjustments });
    } catch (e) {
      logger.error({ err: e }, "Error fetching folio by booking");
      res.status(500).json({ message: "Failed to fetch folio" });
    }
  });

  // ── Get single folio with full detail ────────────────────
  app.get("/api/folios/:id", requireAuth, async (req, res) => {
    try {
      const folio = await storage.getGuestFolio(req.params.id);
      if (!folio) return res.status(404).json({ message: "Folio not found" });
      const [charges, payments, adjustments] = await Promise.all([
        storage.getFolioCharges(folio.id),
        storage.getFolioPayments(folio.id),
        storage.getFolioAdjustments(folio.id),
      ]);
      res.json({ ...folio, charges, payments, adjustments });
    } catch (e) {
      logger.error({ err: e }, "Error fetching folio");
      res.status(500).json({ message: "Failed to fetch folio" });
    }
  });

  // ── Manually open folio for no-show / cancellation billing ──
  app.post("/api/folios/booking/:bookingId/open", requireRole("admin", "owner_admin", "property_manager", "reception"), async (req, res) => {
    try {
      const existing = await storage.getGuestFolioByBooking(req.params.bookingId);
      if (existing) return res.json(existing);
      const booking = await storage.getBooking(req.params.bookingId);
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      const ctx = await getHotelContext(req.session.userId!);
      if (!ctx?.hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const folioNumber = `F-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;
      const folio = await storage.createGuestFolio({
        bookingId: booking.id,
        guestId: booking.guestId,
        hotelId: ctx.hotelId,
        propertyId: booking.propertyId ?? undefined,
        tenantId: req.tenantId ?? undefined,
        folioNumber,
        currency: booking.currency ?? "USD",
        status: "open",
        openedAt: new Date(),
        notes: req.body.notes ?? `Manually opened for ${booking.status} booking`,
      });
      logger.info({ bookingId: booking.id, folioId: folio.id, status: booking.status }, "Folio manually opened");
      res.status(201).json(folio);
    } catch (e) {
      logger.error({ err: e }, "Error opening manual folio");
      res.status(500).json({ message: "Failed to open folio" });
    }
  });

  // ── Add charge to folio ───────────────────────────────────
  app.post("/api/folios/:id/charges", requireRole("admin", "owner_admin", "property_manager", "reception"), async (req, res) => {
    try {
      const folio = await storage.getGuestFolio(req.params.id);
      if (!folio) return res.status(404).json({ message: "Folio not found" });
      if (folio.status === "finalized" || folio.status === "closed") {
        return res.status(400).json({ message: "Cannot add charges to a closed or finalized folio" });
      }
      const { chargeType, description, quantity = 1, unitPrice, taxRate = 0, isInclusive = false, departmentId, costCenterId, serviceDate, idempotencyKey } = req.body;
      if (!chargeType || !description || unitPrice === undefined) {
        return res.status(400).json({ message: "chargeType, description and unitPrice are required" });
      }
      const amountNet = quantity * unitPrice;
      let taxAmount = 0;
      let amountGross = amountNet;
      if (taxRate > 0) {
        if (isInclusive) {
          taxAmount = Math.round(amountNet - (amountNet / (1 + taxRate / 10000)));
          amountGross = amountNet;
        } else {
          taxAmount = Math.round(amountNet * taxRate / 10000);
          amountGross = amountNet + taxAmount;
        }
      }
      const charge = await storage.createFolioCharge({
        folioId: folio.id,
        bookingId: folio.bookingId,
        hotelId: folio.hotelId,
        tenantId: folio.tenantId ?? undefined,
        departmentId: departmentId ?? undefined,
        costCenterId: costCenterId ?? undefined,
        chargeType,
        description,
        quantity,
        unitPrice,
        amountNet,
        taxRate,
        taxAmount,
        amountGross,
        isInclusive,
        currency: folio.currency ?? "USD",
        serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
        idempotencyKey: idempotencyKey ?? undefined,
        status: "posted",
        postedBy: req.session.userId,
      });
      await storage.recalculateFolioBalance(folio.id);
      res.status(201).json(charge);
    } catch (e: any) {
      if (e?.code === "23505") return res.status(409).json({ message: "Duplicate charge (idempotency key already exists)" });
      logger.error({ err: e }, "Error adding folio charge");
      res.status(500).json({ message: "Failed to add charge" });
    }
  });

  // ── Void a charge ─────────────────────────────────────────
  app.post("/api/folios/:id/charges/:chargeId/void", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const folio = await storage.getGuestFolio(req.params.id);
      if (!folio) return res.status(404).json({ message: "Folio not found" });
      if (folio.status === "finalized") return res.status(400).json({ message: "Cannot void charges on a finalized folio" });
      const { reason } = req.body;
      if (!reason) return res.status(400).json({ message: "Void reason is required" });
      const charge = await storage.voidFolioCharge(req.params.chargeId, req.session.userId!, reason);
      if (!charge) return res.status(404).json({ message: "Charge not found" });
      await storage.recalculateFolioBalance(folio.id);
      res.json(charge);
    } catch (e) {
      logger.error({ err: e }, "Error voiding charge");
      res.status(500).json({ message: "Failed to void charge" });
    }
  });

  // ── Add payment to folio ──────────────────────────────────
  app.post("/api/folios/:id/payments", requireRole("admin", "owner_admin", "property_manager", "reception"), async (req, res) => {
    try {
      const folio = await storage.getGuestFolio(req.params.id);
      if (!folio) return res.status(404).json({ message: "Folio not found" });
      if (folio.status === "finalized") return res.status(400).json({ message: "Folio is already finalized" });
      const { paymentMethod, amount, isDeposit = false, referenceNumber, notes, paymentType = "payment" } = req.body;
      if (!paymentMethod || !amount) return res.status(400).json({ message: "paymentMethod and amount are required" });
      const payment = await storage.createFolioPayment({
        folioId: folio.id,
        bookingId: folio.bookingId,
        hotelId: folio.hotelId,
        tenantId: folio.tenantId ?? undefined,
        paymentType,
        paymentMethod,
        amount,
        currency: folio.currency ?? "USD",
        referenceNumber: referenceNumber ?? undefined,
        isDeposit,
        status: "completed",
        receivedAt: new Date(),
        receivedBy: req.session.userId,
        notes: notes ?? undefined,
      });
      await storage.recalculateFolioBalance(folio.id);
      if (isDeposit) {
        await storage.updateBooking(folio.bookingId, {
          depositPaidAt: new Date(),
          paidAmount: (await storage.getBooking(folio.bookingId))?.paidAmount ?? 0 + amount,
        } as any);
      }
      res.status(201).json(payment);
    } catch (e) {
      logger.error({ err: e }, "Error adding folio payment");
      res.status(500).json({ message: "Failed to add payment" });
    }
  });

  // ── Add adjustment (reception → pending, manager → approved) ─
  app.post("/api/folios/:id/adjustments", requireRole("admin", "owner_admin", "property_manager", "reception"), async (req, res) => {
    try {
      const folio = await storage.getGuestFolio(req.params.id);
      if (!folio) return res.status(404).json({ message: "Folio not found" });
      if (folio.status === "finalized") return res.status(400).json({ message: "Cannot adjust a finalized folio" });
      const { adjustmentType, description, amount } = req.body;
      if (!adjustmentType || !description || amount === undefined) {
        return res.status(400).json({ message: "adjustmentType, description and amount are required" });
      }
      const user = await storage.getUser(req.session.userId!);
      const isManager = ["admin", "owner_admin", "property_manager"].includes(user?.role ?? "");
      const approvalStatus = isManager ? "approved" : "pending";
      const adj = await storage.createFolioAdjustment({
        folioId: folio.id,
        bookingId: folio.bookingId,
        hotelId: folio.hotelId,
        tenantId: folio.tenantId ?? undefined,
        adjustmentType,
        description,
        amount,
        currency: folio.currency ?? "USD",
        approvalStatus,
        approvedBy: isManager ? req.session.userId : undefined,
        approvedAt: isManager ? new Date() : undefined,
        createdBy: req.session.userId,
      });
      if (isManager) await storage.recalculateFolioBalance(folio.id);
      res.status(201).json(adj);
    } catch (e) {
      logger.error({ err: e }, "Error adding folio adjustment");
      res.status(500).json({ message: "Failed to add adjustment" });
    }
  });

  // ── Approve adjustment ────────────────────────────────────
  app.post("/api/folios/:id/adjustments/:adjId/approve", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const folio = await storage.getGuestFolio(req.params.id);
      if (!folio) return res.status(404).json({ message: "Folio not found" });
      if (folio.status === "finalized") return res.status(400).json({ message: "Cannot approve on finalized folio" });
      const adj = await storage.updateFolioAdjustment(req.params.adjId, {
        approvalStatus: "approved",
        approvedBy: req.session.userId,
        approvedAt: new Date(),
      });
      if (!adj) return res.status(404).json({ message: "Adjustment not found" });
      await storage.recalculateFolioBalance(folio.id);
      res.json(adj);
    } catch (e) {
      logger.error({ err: e }, "Error approving adjustment");
      res.status(500).json({ message: "Failed to approve adjustment" });
    }
  });

  // ── Reject adjustment ─────────────────────────────────────
  app.post("/api/folios/:id/adjustments/:adjId/reject", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const { reason } = req.body;
      if (!reason) return res.status(400).json({ message: "Rejection reason required" });
      const adj = await storage.updateFolioAdjustment(req.params.adjId, {
        approvalStatus: "rejected",
        rejectedBy: req.session.userId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      });
      if (!adj) return res.status(404).json({ message: "Adjustment not found" });
      res.json(adj);
    } catch (e) {
      logger.error({ err: e }, "Error rejecting adjustment");
      res.status(500).json({ message: "Failed to reject adjustment" });
    }
  });

  // ── Finalize folio (check-out close) ─────────────────────
  app.post("/api/folios/:id/finalize", requireRole("admin", "owner_admin", "property_manager", "reception"), async (req, res) => {
    try {
      const folio = await storage.getGuestFolio(req.params.id);
      if (!folio) return res.status(404).json({ message: "Folio not found" });
      if (folio.status === "finalized") return res.status(400).json({ message: "Folio is already finalized" });
      const updated = await storage.updateGuestFolio(folio.id, {
        status: "finalized",
        finalizedAt: new Date(),
        finalizedBy: req.session.userId,
        closedAt: new Date(),
        invoiceGeneratedAt: new Date(),
      });
      const recalculated = await storage.recalculateFolioBalance(folio.id);
      await storage.updateBooking(folio.bookingId, {
        paymentStatus: (recalculated?.balance ?? 0) <= 0 ? "paid" : "partial",
        remainingBalance: Math.max(0, recalculated?.balance ?? 0),
        paidAmount: recalculated?.totalPayments ?? 0,
      } as any);
      res.json({ ...recalculated, status: "finalized", finalizedAt: updated?.finalizedAt });
    } catch (e) {
      logger.error({ err: e }, "Error finalizing folio");
      res.status(500).json({ message: "Failed to finalize folio" });
    }
  });

  // ── Generate invoice data for finalized folio ─────────────
  app.get("/api/folios/:id/invoice", requireAuth, async (req, res) => {
    try {
      const folio = await storage.getGuestFolio(req.params.id);
      if (!folio) return res.status(404).json({ message: "Folio not found" });
      const [charges, payments, adjustments] = await Promise.all([
        storage.getFolioCharges(folio.id),
        storage.getFolioPayments(folio.id),
        storage.getFolioAdjustments(folio.id),
      ]);
      const booking = await storage.getBooking(folio.bookingId);
      const guest = booking ? await storage.getUser(booking.guestId) : null;
      const postedCharges = charges.filter(c => c.status === "posted");
      const subtotal = postedCharges.reduce((s, c) => s + c.amountNet, 0);
      const totalTax = postedCharges.reduce((s, c) => s + (c.taxAmount ?? 0), 0);
      const totalGross = postedCharges.reduce((s, c) => s + c.amountGross, 0);
      const totalPaid = payments.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0);
      const totalAdj = adjustments.reduce((s, a) => s + a.amount, 0);
      const amountDue = totalGross + totalAdj - totalPaid;
      const guestName = guest
        ? (guest.fullName || `${(guest as any).firstName ?? ""} ${(guest as any).lastName ?? ""}`.trim() || guest.username || "Guest")
        : "Guest";
      res.json({
        invoiceNumber: folio.folioNumber,
        folioId: folio.id,
        bookingId: folio.bookingId,
        roomNumber: booking?.roomNumber,
        checkInDate: booking?.checkInDate,
        checkOutDate: booking?.checkOutDate,
        guestName,
        currency: folio.currency,
        openedAt: folio.openedAt,
        closedAt: folio.closedAt,
        finalizedAt: folio.finalizedAt,
        charges: postedCharges.map(c => ({
          description: c.description,
          chargeType: c.chargeType,
          quantity: c.quantity,
          unitPrice: c.unitPrice / 100,
          amountNet: c.amountNet / 100,
          taxRateBasisPoints: c.taxRate,
          taxRatePercent: (c.taxRate ?? 0) / 100,
          taxAmount: (c.taxAmount ?? 0) / 100,
          amountGross: c.amountGross / 100,
          isInclusive: c.isInclusive,
          serviceDate: c.serviceDate,
        })),
        payments: payments.map(p => ({
          paymentMethod: p.paymentMethod,
          amount: p.amount / 100,
          isDeposit: p.isDeposit,
          receivedAt: p.receivedAt,
          referenceNumber: p.referenceNumber,
        })),
        adjustments: adjustments.map(a => ({
          description: a.description,
          adjustmentType: a.adjustmentType,
          amount: a.amount / 100,
        })),
        summary: {
          subtotal: subtotal / 100,
          totalTax: totalTax / 100,
          totalGross: totalGross / 100,
          totalPaid: totalPaid / 100,
          totalAdjustments: totalAdj / 100,
          amountDue: amountDue / 100,
        },
      });
    } catch (e) {
      logger.error({ err: e }, "Error generating invoice");
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  });

  // ═══════════ DEPARTMENTS ═══════════════════════════════════

  app.get("/api/departments", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const ctx = await getHotelContext(req.session.userId!);
      if (!ctx?.hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const depts = await storage.getDepartmentsByHotel(ctx.hotelId, req.tenantId!);
      res.json(depts);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", requireRole("admin", "owner_admin"), async (req, res) => {
    try {
      const ctx = await getHotelContext(req.session.userId!);
      if (!ctx?.hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const { name, code, type } = req.body;
      if (!name || !code || !type) return res.status(400).json({ message: "name, code and type are required" });
      const dept = await storage.createDepartment({ hotelId: ctx.hotelId, tenantId: req.tenantId ?? undefined, name, code, type });
      res.status(201).json(dept);
    } catch (e) {
      res.status(500).json({ message: "Failed to create department" });
    }
  });

  app.patch("/api/departments/:id", requireRole("admin", "owner_admin"), async (req, res) => {
    try {
      const dept = await storage.updateDepartment(req.params.id, req.body);
      if (!dept) return res.status(404).json({ message: "Department not found" });
      res.json(dept);
    } catch (e) {
      res.status(500).json({ message: "Failed to update department" });
    }
  });

  app.delete("/api/departments/:id", requireRole("admin", "owner_admin"), async (req, res) => {
    try {
      await storage.deleteDepartment(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ message: "Failed to delete department" });
    }
  });

  // ═══════════ TAX CONFIGURATIONS ════════════════════════════

  app.get("/api/tax-configs", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const ctx = await getHotelContext(req.session.userId!);
      if (!ctx?.hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const configs = await storage.getTaxConfigsByHotel(ctx.hotelId, req.tenantId!);
      res.json(configs);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch tax configurations" });
    }
  });

  app.post("/api/tax-configs", requireRole("admin", "owner_admin"), async (req, res) => {
    try {
      const ctx = await getHotelContext(req.session.userId!);
      if (!ctx?.hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const { name, code, rate, isInclusive, appliesTo } = req.body;
      if (!name || !code || rate === undefined) return res.status(400).json({ message: "name, code and rate are required" });
      const config = await storage.createTaxConfig({ hotelId: ctx.hotelId, tenantId: req.tenantId ?? undefined, name, code, rate, isInclusive, appliesTo });
      res.status(201).json(config);
    } catch (e) {
      res.status(500).json({ message: "Failed to create tax configuration" });
    }
  });

  app.patch("/api/tax-configs/:id", requireRole("admin", "owner_admin"), async (req, res) => {
    try {
      const config = await storage.updateTaxConfig(req.params.id, req.body);
      if (!config) return res.status(404).json({ message: "Tax config not found" });
      res.json(config);
    } catch (e) {
      res.status(500).json({ message: "Failed to update tax config" });
    }
  });

  // ═══════════ CHART OF ACCOUNTS ═════════════════════════════

  app.get("/api/accounting/accounts", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const ctx = await getHotelContext(req.session.userId!);
      if (!ctx?.hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const accounts = await storage.getChartOfAccountsByHotel(ctx.hotelId, req.tenantId!);
      res.json(accounts);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch chart of accounts" });
    }
  });

  app.post("/api/accounting/accounts", requireRole("admin", "owner_admin"), async (req, res) => {
    try {
      const ctx = await getHotelContext(req.session.userId!);
      if (!ctx?.hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const { accountCode, accountName, accountType, normalBalance, parentId, description } = req.body;
      if (!accountCode || !accountName || !accountType || !normalBalance) {
        return res.status(400).json({ message: "accountCode, accountName, accountType and normalBalance are required" });
      }
      const account = await storage.createChartOfAccount({
        hotelId: ctx.hotelId,
        tenantId: req.tenantId ?? undefined,
        accountCode, accountName, accountType, normalBalance, parentId, description,
      });
      res.status(201).json(account);
    } catch (e) {
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // ═══════════ JOURNAL ENTRIES ════════════════════════════════

  app.get("/api/accounting/journal-entries", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const ctx = await getHotelContext(req.session.userId!);
      if (!ctx?.hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const limit = parseInt(String(req.query.limit ?? "100"));
      const entries = await storage.getJournalEntriesByHotel(ctx.hotelId, req.tenantId!, limit);
      res.json(entries);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.get("/api/accounting/journal-entries/:id/lines", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const lines = await storage.getJournalEntryLines(req.params.id);
      res.json(lines);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch journal entry lines" });
    }
  });

  // ═══════════ NIGHT AUDITS ══════════════════════════════════

  app.get("/api/night-audits", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const ctx = await getHotelContext(req.session.userId!);
      if (!ctx?.hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const audits = await storage.getNightAuditsByHotel(ctx.hotelId, req.tenantId!);
      res.json(audits);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch night audits" });
    }
  });

  app.post("/api/night-audits", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const ctx = await getHotelContext(req.session.userId!);
      if (!ctx?.hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const auditDate = req.body.auditDate ? new Date(req.body.auditDate) : new Date();
      const existing = await storage.getNightAuditByDate(ctx.hotelId, auditDate);
      if (existing) return res.status(409).json({ message: "Night audit already exists for this date", audit: existing });
      const hotel = await storage.getHotel(ctx.hotelId);
      const bookings = await storage.getBookingsByHotel(ctx.hotelId, req.tenantId!);
      const checkedIn = bookings.filter(b => b.status === "checked_in");
      const folios = await storage.getGuestFoliosByHotel(ctx.hotelId, req.tenantId!);
      const openFolios = folios.filter(f => f.status === "open");
      const totalRevenue = openFolios.reduce((s, f) => s + (f.totalCharges ?? 0), 0);
      const totalPayments = openFolios.reduce((s, f) => s + (f.totalPayments ?? 0), 0);
      const totalRooms = hotel?.totalRooms ?? 0;
      const occupancyRate = totalRooms > 0 ? Math.round((checkedIn.length / totalRooms) * 10000) : 0;
      const audit = await storage.createNightAudit({
        hotelId: ctx.hotelId,
        tenantId: req.tenantId ?? undefined,
        auditDate,
        status: "open",
        totalRevenue,
        totalPayments,
        roomNightsPosted: checkedIn.length,
        occupiedRooms: checkedIn.length,
        totalRooms,
        occupancyRate,
        notes: req.body.notes ?? undefined,
      });
      res.status(201).json(audit);
    } catch (e) {
      logger.error({ err: e }, "Error creating night audit");
      res.status(500).json({ message: "Failed to create night audit" });
    }
  });

  app.post("/api/night-audits/:id/close", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const audit = await storage.updateNightAudit(req.params.id, {
        status: "closed",
        closedAt: new Date(),
        closedBy: req.session.userId,
        notes: req.body.notes ?? undefined,
      });
      if (!audit) return res.status(404).json({ message: "Night audit not found" });
      res.json(audit);
    } catch (e) {
      res.status(500).json({ message: "Failed to close night audit" });
    }
  });

  // ═══════════ KPI ANALYTICS (SQL-BASED) ═════════════════════

  app.get("/api/finance/kpi", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const ctx = await getHotelContext(req.session.userId!);
      if (!ctx?.hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const { period = "month" } = req.query;
      const now = new Date();
      let startDate: Date;
      let endDate = now;
      if (period === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === "week") {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else if (period === "year") {
        startDate = new Date(now.getFullYear(), 0, 1);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      const summaries = await storage.getDailyFinancialSummaries(ctx.hotelId, req.tenantId!, 365);
      const periodSummaries = summaries.filter(s => s.summaryDate && new Date(s.summaryDate) >= startDate && new Date(s.summaryDate) <= endDate);
      const totalRevenue = periodSummaries.reduce((s, d) => s + (d.totalRevenue ?? 0), 0);
      const roomRevenue = periodSummaries.reduce((s, d) => s + (d.roomRevenue ?? 0), 0);
      const totalExpenses = periodSummaries.reduce((s, d) => s + (d.totalExpenses ?? 0), 0);
      const totalTax = periodSummaries.reduce((s, d) => s + (d.totalTax ?? 0), 0);
      const days = periodSummaries.length || 1;
      const avgOccupancy = periodSummaries.length > 0 ? periodSummaries.reduce((s, d) => s + (d.occupancyRate ?? 0), 0) / periodSummaries.length : 0;
      const avgAdr = periodSummaries.length > 0 ? periodSummaries.reduce((s, d) => s + (d.adr ?? 0), 0) / periodSummaries.length : 0;
      const hotel = await storage.getHotel(ctx.hotelId);
      const totalRooms = hotel?.totalRooms ?? 1;
      const revpar = totalRooms > 0 ? roomRevenue / totalRooms / days : 0;
      const gop = totalRevenue - totalExpenses;
      const gopPercent = totalRevenue > 0 ? (gop / totalRevenue) * 100 : 0;
      const folios = await storage.getGuestFoliosByHotel(ctx.hotelId, req.tenantId!);
      const openFolios = folios.filter(f => f.status === "open");
      const totalOutstanding = openFolios.reduce((s, f) => s + Math.max(0, f.balance ?? 0), 0);
      res.json({
        period,
        startDate,
        endDate,
        totalRevenue: totalRevenue / 100,
        roomRevenue: roomRevenue / 100,
        totalExpenses: totalExpenses / 100,
        totalTax: totalTax / 100,
        gop: gop / 100,
        gopPercent: Math.round(gopPercent * 100) / 100,
        revpar: revpar / 100,
        adr: avgAdr / 100,
        occupancyRate: Math.round(avgOccupancy) / 100,
        openFoliosCount: openFolios.length,
        totalOutstanding: totalOutstanding / 100,
      });
    } catch (e) {
      logger.error({ err: e }, "Error calculating KPI");
      res.status(500).json({ message: "Failed to calculate KPI" });
    }
  });

  // ═══════════ DAILY FINANCIAL SUMMARIES ═════════════════════

  app.get("/api/finance/daily-summaries", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const ctx = await getHotelContext(req.session.userId!);
      if (!ctx?.hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const limit = parseInt(String(req.query.limit ?? "30"));
      const summaries = await storage.getDailyFinancialSummaries(ctx.hotelId, req.tenantId!, limit);
      res.json(summaries.map(s => ({
        ...s,
        roomRevenue: (s.roomRevenue ?? 0) / 100,
        fbRevenue: (s.fbRevenue ?? 0) / 100,
        spaRevenue: (s.spaRevenue ?? 0) / 100,
        otherRevenue: (s.otherRevenue ?? 0) / 100,
        totalRevenue: (s.totalRevenue ?? 0) / 100,
        totalTax: (s.totalTax ?? 0) / 100,
        totalExpenses: (s.totalExpenses ?? 0) / 100,
        adr: (s.adr ?? 0) / 100,
        revpar: (s.revpar ?? 0) / 100,
        occupancyRate: (s.occupancyRate ?? 0) / 100,
      })));
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch daily summaries" });
    }
  });

  // ═══════════ INVOICE PDF DOWNLOAD ═══════════════════════════

  app.get("/api/folios/:id/invoice/pdf", requireAuth, async (req, res) => {
    try {
      const folio = await storage.getGuestFolio(req.params.id);
      if (!folio) return res.status(404).json({ message: "Folio not found" });
      const { generateFolioInvoicePdf } = await import("../services/folioPdfService");
      const pdfBuffer = await generateFolioInvoicePdf(req.params.id);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="invoice-${folio.folioNumber ?? folio.id}.pdf"`);
      res.end(pdfBuffer);
    } catch (e) {
      logger.error({ err: e }, "Error generating invoice PDF");
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // ═══════════ NIGHT AUDIT MANUAL TRIGGER ═════════════════════

  app.post("/api/night-audit/run", requireRole("admin", "owner_admin"), async (req, res) => {
    try {
      const ctx = await getHotelContext(req.session.userId!);
      if (!ctx?.hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const { auditDate } = req.body;
      const { runNightAuditForHotel } = await import("../services/nightAuditEngine");
      const parsedDate = auditDate ? new Date(auditDate) : undefined;
      const result = await runNightAuditForHotel(ctx.hotelId, req.tenantId!, parsedDate);
      res.json({ message: "Night audit completed", ...result });
    } catch (e) {
      logger.error({ err: e }, "Error running manual night audit");
      res.status(500).json({ message: "Failed to run night audit" });
    }
  });

  // ═══════════ CANCELLATION POLICIES CRUD ═════════════════════

  app.get("/api/cancellation-policies", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const ctx = await getHotelContext(req.session.userId!);
      if (!ctx?.hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const policies = await storage.getCancellationPoliciesByHotel(ctx.hotelId);
      res.json(policies);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch cancellation policies" });
    }
  });

  app.post("/api/cancellation-policies", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const ctx = await getHotelContext(req.session.userId!);
      if (!ctx?.hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const {
        name,
        freeCancellationHours = 24,
        noShowPenaltyType = "percent",
        noShowPenaltyValue = 10000,
        lateCancellationPenaltyType = "percent",
        lateCancellationPenaltyValue = 10000,
        isDefault = false,
      } = req.body;
      if (!name) return res.status(400).json({ message: "name is required" });
      const policy = await storage.createCancellationPolicy({
        hotelId: ctx.hotelId,
        tenantId: req.tenantId ?? undefined,
        name,
        freeCancellationHours,
        noShowPenaltyType,
        noShowPenaltyValue,
        lateCancellationPenaltyType,
        lateCancellationPenaltyValue,
        isDefault,
      });
      res.status(201).json(policy);
    } catch (e) {
      logger.error({ err: e }, "Error creating cancellation policy");
      res.status(500).json({ message: "Failed to create policy" });
    }
  });

  app.patch("/api/cancellation-policies/:id", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const updated = await storage.updateCancellationPolicy(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: "Policy not found" });
      res.json(updated);
    } catch (e) {
      res.status(500).json({ message: "Failed to update policy" });
    }
  });

  app.delete("/api/cancellation-policies/:id", requireRole("admin", "owner_admin"), async (req, res) => {
    try {
      await storage.deleteCancellationPolicy(req.params.id);
      res.json({ message: "Policy deleted" });
    } catch (e) {
      res.status(500).json({ message: "Failed to delete policy" });
    }
  });
}

// ── Exported service: auto-open folio on check-in ────────────
export async function autoOpenFolio(bookingId: string, hotelId: string, guestId: string, tenantId: string | null, propertyId: string | null): Promise<void> {
  try {
    const existing = await storage.getGuestFolioByBooking(bookingId);
    if (existing) return;
    const booking = await storage.getBooking(bookingId);
    if (!booking) return;
    const folio = await storage.createGuestFolio({
      bookingId,
      guestId,
      hotelId,
      propertyId: propertyId ?? undefined,
      tenantId: tenantId ?? undefined,
      folioNumber: generateFolioNumber(),
      status: "open",
      currency: booking.currency ?? "USD",
    });
    // Note: Room night charges are posted by the Night Audit Engine (per-night, with idempotency).
    // The folio opens empty — charges accumulate nightly via night audit or manually via reception.
    logger.info({ bookingId, folioId: folio.id }, "Guest folio auto-opened on check-in");
  } catch (e) {
    logger.error({ err: e, bookingId }, "Failed to auto-open guest folio");
  }
}

// ── Exported service: auto-close folio on check-out ──────────
export async function autoCloseFolio(bookingId: string): Promise<void> {
  try {
    const folio = await storage.getGuestFolioByBooking(bookingId);
    if (!folio || folio.status === "finalized") return;
    await storage.updateGuestFolio(folio.id, { status: "closed", closedAt: new Date() });
    await storage.recalculateFolioBalance(folio.id);
    logger.info({ bookingId, folioId: folio.id }, "Guest folio auto-closed on check-out");
  } catch (e) {
    logger.error({ err: e, bookingId }, "Failed to auto-close guest folio");
  }
}
