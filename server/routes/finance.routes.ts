import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { asString } from "../utils/request";
import { requireAuth, requireRole } from "../middleware";
import { logger } from "../utils/logger";

export function registerFinanceRoutes(app: Express): void {

  // ============== FINANCIAL TRANSACTION ROUTES ==============

  // Reception: Get all transactions (for their hotel)
  app.get("/api/finance/transactions", requireRole("reception", "admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      let hotelId = user?.hotelId;
      if (!hotelId && user?.propertyId) {
        const matchingHotel = await storage.getHotelByPropertyId(user.propertyId);
        if (matchingHotel) {
          hotelId = matchingHotel.id;
          await storage.updateUser(user.id, { hotelId });
        }
      }
      if (!hotelId) {
        return res.status(400).json({ message: "No hotel assigned" });
      }
      const transactions = await storage.getFinancialTransactionsByHotel(hotelId, req.tenantId!);
      res.json(transactions);
    } catch (error) {
      logger.error({ err: error }, "Error fetching transactions");
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Reception: Create a new transaction
  app.post("/api/finance/transactions", requireRole("reception"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.hotelId) {
        return res.status(400).json({ message: "No hotel assigned" });
      }

      const validCategories = ["room_booking", "room_service", "housekeeping", "late_checkout", "damage_charge", "minibar", "spa", "restaurant", "laundry", "parking", "other"];
      const validPaymentStatuses = ["paid", "unpaid", "pending"];
      const validPaymentMethods = ["cash", "card", "online", "room_charge", "other"];

      const { guestId, bookingId, roomNumber, category, description, amount, paymentStatus, paymentMethod, notes } = req.body;

      // Validate required fields
      if (!category || !description || amount === undefined) {
        return res.status(400).json({ message: "Category, description, and amount are required" });
      }

      // Validate amount is a non-negative number
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount < 0) {
        return res.status(400).json({ message: "Amount must be a non-negative number" });
      }

      // Validate category
      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }

      // Validate payment status if provided
      if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ message: "Invalid payment status" });
      }

      // Validate payment method if provided
      if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({ message: "Invalid payment method" });
      }

      const transaction = await storage.createFinancialTransaction({
        hotelId: user.hotelId,
        guestId: guestId || null,
        bookingId: bookingId || null,
        roomNumber: roomNumber || null,
        category,
        description,
        amount: Math.round(amount * 100),
        paymentStatus: paymentStatus || "pending",
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        createdBy: user.id,
        createdByName: user.fullName,
        tenantId: req.tenantId || null,
      });

      await storage.createFinancialAuditLog({
        hotelId: user.hotelId,
        transactionId: transaction.id,
        action: "created",
        performedBy: user.id,
        performedByName: user.fullName,
        newValues: transaction,
        tenantId: req.tenantId || null,
      });

      try {
        const hotel = await storage.getHotel(user.hotelId);
        await storage.createRevenue({
          hotelId: user.hotelId,
          propertyId: hotel?.propertyId || user.propertyId || null,
          ownerId: user.ownerId || null,
          bookingId: bookingId || null,
          guestId: guestId || null,
          transactionId: transaction.id,
          roomNumber: roomNumber || null,
          category,
          description,
          amount: Math.round(amount * 100),
          currency: "USD",
          paymentMethod: paymentMethod || null,
          paymentStatus: paymentStatus || "pending",
          sourceType: "auto",
          createdBy: user.id,
          createdByName: user.fullName,
          tenantId: req.tenantId || null,
        });
      } catch (revErr) {
        logger.error({ err: revErr }, "Auto-revenue from transaction failed");
      }

      res.json(transaction);
    } catch (error) {
      logger.error({ err: error }, "Error creating transaction");
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Reception: Update a transaction
  app.patch("/api/finance/transactions/:id", requireRole("reception"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.hotelId) {
        return res.status(400).json({ message: "No hotel assigned" });
      }

      const id = asString(req.params.id);
      const existingTransaction = await storage.getFinancialTransaction(id);
      
      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (existingTransaction.hotelId !== user.hotelId) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (req.tenantId && existingTransaction.tenantId && existingTransaction.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (existingTransaction.paymentStatus === "voided") {
        return res.status(400).json({ message: "Cannot edit a voided transaction" });
      }

      const { guestId, bookingId, roomNumber, category, description, amount, paymentStatus, paymentMethod, notes } = req.body;

      const updates: Record<string, any> = {};
      if (guestId !== undefined) updates.guestId = guestId;
      if (bookingId !== undefined) updates.bookingId = bookingId;
      if (roomNumber !== undefined) updates.roomNumber = roomNumber;
      if (category !== undefined) updates.category = category;
      if (description !== undefined) updates.description = description;
      if (amount !== undefined) updates.amount = Math.round(amount * 100);
      if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;
      if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
      if (notes !== undefined) updates.notes = notes;

      const updatedTransaction = await storage.updateFinancialTransaction(id, updates);

      // Create audit log
      await storage.createFinancialAuditLog({
        hotelId: user.hotelId,
        transactionId: id,
        action: "updated",
        performedBy: user.id,
        performedByName: user.fullName,
        previousValues: existingTransaction,
        newValues: updatedTransaction,
        tenantId: req.tenantId || null,
      });

      res.json(updatedTransaction);
    } catch (error) {
      logger.error({ err: error }, "Error updating transaction");
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  // Reception: Void a transaction
  app.post("/api/finance/transactions/:id/void", requireRole("reception"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.hotelId) {
        return res.status(400).json({ message: "No hotel assigned" });
      }

      const id = asString(req.params.id);
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: "Void reason is required" });
      }

      const existingTransaction = await storage.getFinancialTransaction(id);
      
      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      if (existingTransaction.hotelId !== user.hotelId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const voidedTransaction = await storage.voidFinancialTransaction(id, user.id, reason);

      // Create audit log
      await storage.createFinancialAuditLog({
        hotelId: user.hotelId,
        transactionId: id,
        action: "voided",
        performedBy: user.id,
        performedByName: user.fullName,
        previousValues: existingTransaction,
        newValues: voidedTransaction,
        tenantId: req.tenantId || null,
      });

      res.json(voidedTransaction);
    } catch (error) {
      logger.error({ err: error }, "Error voiding transaction");
      res.status(500).json({ message: "Failed to void transaction" });
    }
  });

  // Admin: Get financial analytics
  app.get("/api/finance/analytics", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      let hotelId = user?.hotelId;
      if (!hotelId && user?.propertyId) {
        const matchingHotel = await storage.getHotelByPropertyId(user.propertyId);
        if (matchingHotel) {
          hotelId = matchingHotel.id;
          await storage.updateUser(user.id, { hotelId });
        }
      }
      if (!hotelId) {
        return res.status(400).json({ message: "No hotel assigned" });
      }

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Get all transactions
      const allTransactions = await storage.getFinancialTransactionsByHotel(hotelId, req.tenantId!);
      const validTransactions = allTransactions.filter(t => t.paymentStatus !== "voided");

      // Calculate revenue metrics
      const todayTransactions = validTransactions.filter(t => t.createdAt && t.createdAt >= startOfToday);
      const weekTransactions = validTransactions.filter(t => t.createdAt && t.createdAt >= startOfWeek);
      const monthTransactions = validTransactions.filter(t => t.createdAt && t.createdAt >= startOfMonth);
      const prevMonthTransactions = validTransactions.filter(t => 
        t.createdAt && t.createdAt >= startOfPrevMonth && t.createdAt <= endOfPrevMonth
      );

      const sumAmount = (transactions: typeof validTransactions) => 
        transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      const dailyRevenue = sumAmount(todayTransactions);
      const weeklyRevenue = sumAmount(weekTransactions);
      const monthlyRevenue = sumAmount(monthTransactions);
      const prevMonthRevenue = sumAmount(prevMonthTransactions);

      // Service vs booking revenue
      const serviceRevenue = sumAmount(validTransactions.filter(t => t.category !== "room_booking"));
      const bookingRevenue = sumAmount(validTransactions.filter(t => t.category === "room_booking"));

      // Monthly trend
      const monthlyTrend = prevMonthRevenue > 0 
        ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
        : 0;

      // Service distribution
      const serviceDistribution: Record<string, number> = {};
      for (const t of validTransactions) {
        serviceDistribution[t.category] = (serviceDistribution[t.category] || 0) + (t.amount || 0);
      }

      // Get no-show records
      const noShowRecords = await storage.getNoShowRecordsByHotel(hotelId, req.tenantId!);
      const noShowCount = noShowRecords.length;
      const noShowRevenueLoss = noShowRecords.reduce((sum, r) => sum + (r.estimatedRevenueLoss || 0), 0);

      // Get hotel info for occupancy calculation
      const hotel = await storage.getHotel(hotelId);
      const totalRooms = hotel?.totalRooms || 0;
      const bookings = await storage.getBookingsByHotel(hotelId, req.tenantId!);
      const activeBookings = bookings.filter(b => b.status === "checked_in");
      const occupancyRate = totalRooms > 0 ? (activeBookings.length / totalRooms) * 100 : 0;
      const revPar = totalRooms > 0 ? monthlyRevenue / totalRooms : 0;

      res.json({
        dailyRevenue: dailyRevenue / 100,
        weeklyRevenue: weeklyRevenue / 100,
        monthlyRevenue: monthlyRevenue / 100,
        serviceRevenue: serviceRevenue / 100,
        bookingRevenue: bookingRevenue / 100,
        monthlyTrend,
        occupancyRate,
        totalRooms,
        bookedRooms: activeBookings.length,
        revPar: revPar / 100,
        noShowCount,
        noShowRevenueLoss: noShowRevenueLoss / 100,
        serviceDistribution: Object.entries(serviceDistribution).map(([category, amount]) => ({
          category,
          amount: amount / 100,
        })),
        recentTransactions: allTransactions.slice(0, 10).map(t => ({
          ...t,
          amount: t.amount / 100,
        })),
      });
    } catch (error) {
      logger.error({ err: error }, "Error fetching analytics");
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Backfill: Create financial transactions for existing paid bookings without one
  app.post("/api/finance/backfill", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      let hotelId = user?.hotelId;
      if (!hotelId && user?.propertyId) {
        const matchingHotel = await storage.getHotelByPropertyId(user!.propertyId);
        if (matchingHotel) hotelId = matchingHotel.id;
      }
      if (!hotelId) {
        return res.status(400).json({ message: "No hotel assigned" });
      }

      const allBookings = await storage.getBookingsByHotel(hotelId, req.tenantId!);
      const existingTransactions = await storage.getFinancialTransactionsByHotel(hotelId, req.tenantId!);
      const bookingsWithTransaction = new Set(existingTransactions.map(t => t.bookingId).filter(Boolean));

      let created = 0;
      let skipped = 0;

      for (const booking of allBookings) {
        if (bookingsWithTransaction.has(booking.id)) {
          skipped++;
          continue;
        }
        if (!booking.totalPrice || booking.totalPrice <= 0) {
          skipped++;
          continue;
        }

        try {
          const transaction = await storage.createFinancialTransaction({
            hotelId,
            guestId: booking.guestId,
            bookingId: booking.id,
            roomNumber: booking.roomNumber,
            category: "room_booking",
            description: `Room ${booking.roomNumber} booking payment (backfill)`,
            amount: booking.totalPrice,
            paymentMethod: "cash",
            paymentStatus: "paid",
            transactionReference: null,
            notes: "Auto-generated backfill for existing paid booking",
            createdBy: user!.id,
            createdByName: user!.fullName,
            tenantId: req.tenantId || null,
          });

          try {
            const hotel = await storage.getHotel(hotelId);
            await storage.createRevenue({
              hotelId,
              propertyId: hotel?.propertyId || user!.propertyId || null,
              ownerId: user!.ownerId || null,
              bookingId: booking.id,
              guestId: booking.guestId,
              transactionId: transaction.id,
              roomNumber: booking.roomNumber,
              category: "room_booking",
              description: `Room ${booking.roomNumber} booking payment (backfill)`,
              amount: booking.totalPrice,
              currency: booking.currency || "USD",
              paymentMethod: "cash",
              paymentStatus: "paid",
              sourceType: "auto",
              createdBy: user!.id,
              createdByName: user!.fullName,
              tenantId: req.tenantId || null,
            });
          } catch (revErr) {
            logger.error({ err: revErr, bookingId: booking.id }, "Revenue creation failed during backfill");
          }

          created++;
        } catch (err) {
          logger.error({ err, bookingId: booking.id }, "Finance backfill failed for booking");
        }
      }

      res.json({ created, skipped, total: allBookings.length });
    } catch (error) {
      logger.error({ err: error }, "Error running backfill");
      res.status(500).json({ message: "Failed to run backfill" });
    }
  });

  // Admin: Get audit logs
  app.get("/api/finance/audit-logs", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      let hotelId = user?.hotelId;
      if (!hotelId && user?.propertyId) {
        const matchingHotel = await storage.getHotelByPropertyId(user.propertyId);
        if (matchingHotel) {
          hotelId = matchingHotel.id;
          await storage.updateUser(user.id, { hotelId });
        }
      }
      if (!hotelId) {
        return res.status(400).json({ message: "No hotel assigned" });
      }
      const logs = await storage.getFinancialAuditLogs(hotelId, req.tenantId!);
      res.json(logs);
    } catch (error) {
      logger.error({ err: error }, "Error fetching audit logs");
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Reception: Create no-show record
  app.post("/api/finance/no-show", requireRole("reception"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.hotelId) {
        return res.status(400).json({ message: "No hotel assigned" });
      }

      const { bookingId, guestId, roomNumber, expectedCheckIn, estimatedRevenueLoss, notes } = req.body;

      if (!bookingId || !guestId || !roomNumber || !expectedCheckIn) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const record = await storage.createNoShowRecord({
        hotelId: user.hotelId,
        bookingId,
        guestId,
        roomNumber,
        expectedCheckIn: new Date(expectedCheckIn),
        estimatedRevenueLoss: estimatedRevenueLoss ? Math.round(estimatedRevenueLoss * 100) : null,
        recordedBy: user.id,
        recordedByName: user.fullName,
        notes: notes || null,
        tenantId: req.tenantId || null,
      });

      await storage.createFinancialAuditLog({
        hotelId: user.hotelId,
        transactionId: record.id,
        action: "no_show_recorded",
        performedBy: user.id,
        performedByName: user.fullName,
        newValues: record,
        tenantId: req.tenantId || null,
      });

      res.json(record);
    } catch (error) {
      logger.error({ err: error }, "Error creating no-show record");
      res.status(500).json({ message: "Failed to create no-show record" });
    }
  });
}
