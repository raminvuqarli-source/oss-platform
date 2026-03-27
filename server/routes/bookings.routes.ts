import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { asString } from "../utils/request";
import { requireAuth, requireRole, resolveTenant, requireTenant } from "../middleware";
import { type SmartFeature, type SmartPlanType, hasSmartFeature } from "@shared/planFeatures";
import { logger } from "../utils/logger";
import { getJobQueue } from "../services/jobQueue";
import { enqueueOtaSync } from "../workers/otaSyncWorker";
import { validateBody } from "../middleware/validateBody";
import { updateBookingSchema, arrivalInfoSchema, precheckSchema, roomSettingsSchema, doorControlSchema, unitStatusSchema } from "../validators/booking.validators";
import { autoOpenFolio, autoCloseFolio } from "./folio.routes";
import { applyCancellationPolicy } from "../services/cancellationPolicyEngine";

export function registerBookingRoutes(app: Express): void {
  // Bookings Routes - filtered by hotel
  app.get("/api/bookings", requireRole("admin", "reception", "owner_admin", "property_manager", "staff"), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.hotelId) {
      return res.status(400).json({ message: "No hotel assigned" });
    }
    const bookings = await storage.getBookingsByHotel(user.hotelId, req.tenantId!);
    res.json(bookings);
  });

  app.get("/api/bookings/current", requireAuth, async (req, res) => {
    try {
      const booking = await storage.getCurrentBookingForGuest(req.session.userId!);
      if (!booking) {
        return res.status(404).json({ message: "No current booking found" });
      }
      res.json(booking);
    } catch (error: any) {
      logger.error({ err: error }, "Error fetching current booking");
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.patch("/api/bookings/:id", requireAuth, validateBody(updateBookingSchema), async (req, res) => {
    const id = asString(req.params.id);
    const booking = await storage.getBooking(id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    if (req.tenantUser?.role === "guest") {
      if (booking.guestId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { status, preCheckedIn, ...safeFields } = req.body;
      const updatedBooking = await storage.updateBooking(id, safeFields);
      return res.json(updatedBooking);
    } else if (req.tenantUser?.role !== "oss_super_admin") {
      if (booking.ownerId !== req.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    
    const updatedBooking = await storage.updateBooking(id, req.body);
    if (req.body.status && ["checked_in", "checked_out", "cancelled", "no_show"].includes(req.body.status)) {
      await storage.updateUnitStatusFromBooking(id);
      if (["cancelled", "no_show"].includes(req.body.status)) {
        await storage.deleteRoomNightsByBooking(id);
        logger.info({ bookingId: id, newStatus: req.body.status }, "Room nights released on cancellation");
        if (updatedBooking) {
          (async () => {
            try {
              let hotelId: string | undefined;
              if (updatedBooking.propertyId) {
                const hotel = await storage.getHotelByPropertyId(updatedBooking.propertyId);
                hotelId = hotel?.id;
              }
              if (!hotelId && updatedBooking.ownerId) {
                const owner = await storage.getOwner(updatedBooking.ownerId);
                if (owner?.hotelId) hotelId = owner.hotelId;
              }
              if (hotelId) {
                await applyCancellationPolicy(updatedBooking, req.body.status as "cancelled" | "no_show", hotelId);
              }
            } catch (err) {
              logger.error({ err, bookingId: id }, "applyCancellationPolicy failed");
            }
          })();
        }
      }
      if (req.body.status === "checked_in" && updatedBooking) {
        (async () => {
          try {
            let hotelId: string | undefined;
            if (updatedBooking.propertyId) {
              const hotel = await storage.getHotelByPropertyId(updatedBooking.propertyId);
              hotelId = hotel?.id;
            }
            if (!hotelId && updatedBooking.ownerId) {
              const owner = await storage.getOwner(updatedBooking.ownerId);
              if (owner?.hotelId) hotelId = owner.hotelId;
            }
            if (hotelId) {
              await autoOpenFolio(id, hotelId, updatedBooking.guestId, req.tenantId || null, updatedBooking.propertyId || null);
            }
          } catch (err) {
            logger.error({ err, bookingId: id }, "autoOpenFolio failed");
          }
        })();
      }
      if (req.body.status === "checked_out") {
        autoCloseFolio(id).catch(err =>
          logger.error({ err, bookingId: id }, "autoCloseFolio failed")
        );
      }
      if (updatedBooking?.propertyId) {
        try {
          const boss = await getJobQueue();
          await enqueueOtaSync(boss, updatedBooking.propertyId, req.tenantId || null, "push_availability", `booking_${req.body.status}`);
        } catch (otaErr) {
          logger.warn({ err: otaErr, bookingId: id }, "Failed to enqueue OTA availability sync");
        }
      }
    }

    const datesChanged = req.body.checkInDate || req.body.checkOutDate || req.body.unitId;
    if (datesChanged && updatedBooking && updatedBooking.unitId && updatedBooking.checkInDate && updatedBooking.checkOutDate) {
      const currentStatus = updatedBooking.status || "";
      if (!["cancelled", "no_show", "checked_out"].includes(currentStatus)) {
        try {
          await storage.reconcileRoomNights(
            id,
            updatedBooking.unitId,
            new Date(updatedBooking.checkInDate),
            new Date(updatedBooking.checkOutDate),
            updatedBooking.tenantId,
            updatedBooking.propertyId,
          );
          logger.info({ bookingId: id }, "Room nights reconciled after booking update");
          if (updatedBooking.propertyId) {
            try {
              const boss = await getJobQueue();
              await enqueueOtaSync(boss, updatedBooking.propertyId, req.tenantId || null, "push_availability", "booking_modified");
            } catch (otaErr) {
              logger.warn({ err: otaErr, bookingId: id }, "Failed to enqueue OTA availability sync after booking modification");
            }
          }
        } catch (err: any) {
          if (err.message?.includes("ROOM_NOT_AVAILABLE")) {
            return res.status(409).json({ message: "Room not available for the updated dates" });
          }
          throw err;
        }
      }
    }

    res.json(updatedBooking);
  });

  app.post("/api/bookings/:id/arrival-info", requireAuth, validateBody(arrivalInfoSchema), async (req, res) => {
    try {
      const id = asString(req.params.id);
      const booking = await storage.getBooking(id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.guestId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (booking.status === "arrival_info_submitted" || booking.status === "checked_in") {
        return res.status(400).json({ message: "Arrival information already submitted" });
      }

      if (booking.status === "checked_out") {
        return res.status(400).json({ message: "Booking already checked out" });
      }

      const { arrivalTime, preCheckNotes } = req.body;

      if (!arrivalTime) {
        return res.status(400).json({ message: "Expected arrival time is required" });
      }

      const updatedBooking = await storage.updateBooking(id, {
        status: "arrival_info_submitted",
        arrivalTime,
        preCheckNotes: preCheckNotes || null,
      });
      res.json(updatedBooking);
    } catch (error) {
      logger.error({ err: error }, "Arrival info submission error");
      res.status(500).json({ message: "Failed to submit arrival information" });
    }
  });

  app.post("/api/bookings/:id/precheck", requireAuth, validateBody(precheckSchema), async (req, res) => {
    try {
      const id = asString(req.params.id);
      logger.debug({ bookingId: id, userId: req.session.userId, contentLength: req.headers['content-length'], bodyKeys: Object.keys(req.body || {}) }, "Starting precheck");

      const booking = await storage.getBooking(id);

      if (!booking) {
        logger.debug({ bookingId: id }, "Precheck: booking not found");
        return res.status(404).json({ message: "Booking not found" });
      }

      logger.debug({ bookingId: booking.id, status: booking.status, guestId: booking.guestId }, "Precheck: booking found");

      if (booking.guestId !== req.session.userId) {
        logger.debug({ guestId: booking.guestId, userId: req.session.userId }, "Precheck: forbidden - guest mismatch");
        return res.status(403).json({ message: "Forbidden" });
      }

      if (booking.status === "precheck_submitted" || booking.status === "checked_in") {
        logger.debug({ status: booking.status }, "Precheck: already submitted");
        return res.status(400).json({ message: "Online check-in already submitted" });
      }

      if (booking.status === "checked_out" || booking.status === "cancelled") {
        return res.status(400).json({ message: "Booking is no longer active" });
      }

      const {
        passportNumber,
        nationality,
        dateOfBirth,
        guestAddress,
        numberOfGuests,
        specialRequests,
        guestSignatureBase64,
        idDocumentBase64,
      } = req.body;

      logger.debug({
        hasPassport: !!passportNumber,
        hasNationality: !!nationality,
        hasDateOfBirth: !!dateOfBirth,
        hasGuestAddress: !!guestAddress,
        numberOfGuests,
        hasSpecialRequests: !!specialRequests,
        signatureLength: guestSignatureBase64?.length || 0,
        idDocLength: idDocumentBase64?.length || 0,
      }, "Precheck fields");

      if (!passportNumber || !nationality || !dateOfBirth) {
        return res.status(400).json({ message: "Passport number, nationality and date of birth are required" });
      }

      if (!guestSignatureBase64) {
        return res.status(400).json({ message: "Digital signature is required" });
      }

      const maxBase64Size = 5 * 1024 * 1024;
      if (guestSignatureBase64 && guestSignatureBase64.length > maxBase64Size) {
        return res.status(400).json({ message: "Signature image is too large (max 5MB)" });
      }
      if (idDocumentBase64 && idDocumentBase64.length > maxBase64Size) {
        return res.status(400).json({ message: "ID document image is too large (max 5MB)" });
      }

      const updatedBooking = await storage.updateBooking(id, {
        status: "precheck_submitted",
        passportNumber,
        nationality,
        dateOfBirth,
        guestAddress: guestAddress || null,
        numberOfGuests: numberOfGuests ? parseInt(numberOfGuests, 10) : null,
        specialRequests: specialRequests || null,
        guestSignatureBase64,
        idDocumentBase64: idDocumentBase64 || null,
      });

      logger.info({ bookingId: id }, "Booking updated to precheck_submitted");

      await storage.autoCheckinIfReady(id);
      const finalBooking = await storage.getBooking(id);
      res.json(finalBooking || updatedBooking);
    } catch (error: any) {
      logger.error({ err: error }, "Precheck error");
      res.status(500).json({ message: "Failed to submit online check-in: " + (error?.message || "Unknown error") });
    }
  });

  app.post("/api/bookings/:id/confirm-checkin", requireRole("admin", "reception", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const id = asString(req.params.id);
      const booking = await storage.getBooking(id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (booking.status !== "booked" && booking.status !== "arrival_info_submitted" && booking.status !== "precheck_submitted") {
        return res.status(400).json({ message: "Booking cannot be checked in from current status" });
      }

      const updatedBooking = await storage.updateBooking(id, {
        status: "checked_in",
        preCheckedIn: true,
      });
      await storage.updateUnitStatusFromBooking(id);
      res.json(updatedBooking);
    } catch (error) {
      logger.error({ err: error }, "Confirm check-in error");
      res.status(500).json({ message: "Failed to confirm check-in" });
    }
  });

  // Room Settings Routes
  app.get("/api/room-settings/:bookingId", requireAuth, async (req, res) => {
    const bookingId = asString(req.params.bookingId);
    const booking = await storage.getBooking(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    if (req.tenantUser?.role === "guest") {
      if (booking.guestId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else if (req.tenantUser?.role !== "oss_super_admin") {
      if (!req.tenantId) return res.status(403).json({ message: "Forbidden" });
    }
    
    let settings = await storage.getRoomSettings(bookingId);
    
    if (!settings) {
      settings = await storage.createRoomSettings({
        bookingId,
        temperature: 22,
        lightsOn: false,
        lightsBrightness: 50,
        curtainsOpen: false,
        jacuzziOn: false,
        jacuzziTemperature: 38,
        welcomeMode: true,
        tenantId: req.tenantId || null,
      });
    }
    
    res.json(settings);
  });

  app.patch("/api/room-settings/:bookingId", requireAuth, validateBody(roomSettingsSchema), async (req, res) => {
    const bookingId = asString(req.params.bookingId);
    const booking = await storage.getBooking(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    if (req.tenantUser?.role === "guest") {
      if (booking.guestId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else if (req.tenantUser?.role !== "oss_super_admin") {
      if (!req.tenantId) return res.status(403).json({ message: "Forbidden" });
    }

    const settingToFeature: Record<string, SmartFeature> = {
      temperature: "ac_control",
      lightsOn: "light_control",
      lightsBrightness: "light_control",
      bathroomLightsOn: "light_control",
      bathroomLightsBrightness: "light_control",
      hallLightsOn: "light_control",
      hallLightsBrightness: "light_control",
      nonDimmableLightsOn: "light_control",
      curtainsOpen: "curtains",
      curtainsPosition: "curtains",
      jacuzziOn: "jacuzzi",
      jacuzziTemperature: "jacuzzi",
      doorLocked: "smart_lock",
      welcomeMode: "welcome_mode",
    };

    const user = req.tenantUser || (await storage.getUser(req.session.userId!));
    if (user && user.role !== "oss_super_admin" && !user.username?.startsWith("demo_")) {
      if (booking.tenantId && req.tenantId && booking.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      let ownerId = user.ownerId;
      if (!ownerId && user.hotelId) {
        const hotel = await storage.getHotel(user.hotelId);
        if (hotel?.ownerId) ownerId = hotel.ownerId;
      }
      if (!ownerId) {
        return res.status(403).json({ message: "Unable to resolve subscription owner. Access denied." });
      }
      const sub = await storage.getSubscriptionByOwner(ownerId);
      const smartPlan = ((sub?.smartPlanType) || "none") as SmartPlanType;
      for (const key of Object.keys(req.body)) {
        const feature = settingToFeature[key];
        if (feature && !hasSmartFeature(smartPlan, feature)) {
          return res.status(403).json({
            error: "SMART_PLAN_LIMIT",
            message: "This smart feature is not included in your current smart plan.",
            feature,
            currentSmartPlan: smartPlan,
          });
        }
      }
    }
    
    let settings = await storage.getRoomSettings(bookingId);
    
    if (!settings) {
      settings = await storage.createRoomSettings({
        bookingId,
        ...req.body,
        tenantId: req.tenantId || null,
      });
    } else {
      settings = await storage.updateRoomSettings(bookingId, req.body);
    }
    
    res.json(settings);
  });

  // Door Control Routes
  app.post("/api/door/:bookingId/control", requireAuth, validateBody(doorControlSchema), async (req, res) => {
    try {
      const bookingId = asString(req.params.bookingId);
      const { action } = req.body;
      
      if (!action || !["open", "close"].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'open' or 'close'" });
      }
      
      const user = await storage.getUser(req.session.userId!);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.guestId !== req.session.userId && user?.role === "guest") {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (user && user.role !== "oss_super_admin" && !user.username?.startsWith("demo_")) {
        if (booking.tenantId && req.tenantId && booking.tenantId !== req.tenantId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        let ownerId = user.ownerId;
        if (!ownerId && user.hotelId) {
          const hotel = await storage.getHotel(user.hotelId);
          if (hotel?.ownerId) ownerId = hotel.ownerId;
        }
        if (!ownerId) {
          return res.status(403).json({ message: "Unable to resolve subscription owner. Access denied." });
        }
        const sub = await storage.getSubscriptionByOwner(ownerId);
        const smartPlan = ((sub?.smartPlanType) || "none") as SmartPlanType;
        if (!hasSmartFeature(smartPlan, "smart_lock")) {
          return res.status(403).json({
            error: "SMART_PLAN_LIMIT",
            message: "Smart lock is not included in your current smart plan.",
            feature: "smart_lock",
            currentSmartPlan: smartPlan,
          });
        }
      }
      
      // Update door lock state
      const doorLocked = action === "close";
      const settings = await storage.updateRoomSettings(bookingId, { doorLocked });
      
      await storage.createDoorActionLog({
        bookingId,
        guestId: booking.guestId,
        roomNumber: booking.roomNumber,
        action,
        performedBy: user?.role === "guest" ? "guest" : user?.fullName || "staff",
        tenantId: req.tenantId || null,
      });
      
      
      
      res.json({ 
        success: true, 
        message: `Door ${action === "open" ? "unlocked" : "locked"} successfully`,
        doorLocked,
        settings 
      });
    } catch (error) {
      logger.error({ err: error }, "Door control error");
      res.status(500).json({ message: "Failed to control door" });
    }
  });

  // Get door action logs (admin only) - filtered by hotel
  app.get("/api/door-logs", requireRole("admin", "owner_admin", "property_manager"), requireTenant, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.hotelId) {
      return res.status(400).json({ message: "No hotel assigned" });
    }
    const logs = await storage.getDoorActionLogsByHotel(user.hotelId, req.tenantId!);
    res.json(logs);
  });

  app.get("/api/door-logs/:roomNumber", requireRole("admin", "reception", "owner_admin", "property_manager"), requireTenant, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.hotelId) {
      return res.status(400).json({ message: "No hotel assigned" });
    }
    const allLogs = await storage.getDoorActionLogsByHotel(user.hotelId, req.tenantId!);
    const roomLogs = allLogs.filter(log => log.roomNumber === asString(req.params.roomNumber));
    res.json(roomLogs);
  });

  app.get("/api/door-activity/:propertyId", requireRole("owner_admin", "admin", "property_manager"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const propertyId = asString(req.params.propertyId);

      const property = await storage.getProperty(propertyId);
      if (!property) return res.status(404).json({ message: "Property not found" });

      if (user.tenantId && property.tenantId !== user.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (user.role === "owner_admin" && user.ownerId && property.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const propertyUnits = await storage.getUnitsByProperty(propertyId);
      const propertyRoomNumbers = new Set(propertyUnits.map(u => u.unitNumber));

      const propertyBookings = await storage.getBookingsByProperty(propertyId);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const roomActivityMap: Record<string, { opensToday: number; closesToday: number; currentlyLocked: boolean }> = {};

      for (const unit of propertyUnits) {
        roomActivityMap[unit.unitNumber] = { opensToday: 0, closesToday: 0, currentlyLocked: true };
      }

      const activeBookings = propertyBookings.filter(b => b.status === "confirmed" || b.status === "checked_in");

      for (const booking of activeBookings) {
        const roomNumber = booking.roomNumber;
        if (!roomNumber || !propertyRoomNumbers.has(roomNumber)) continue;

        const settings = await storage.getRoomSettings(booking.id);
        if (settings) {
          roomActivityMap[roomNumber].currentlyLocked = settings.doorLocked ?? true;
        }
      }

      const hotel = await storage.getHotelByPropertyId(propertyId);
      if (hotel) {
        const allLogs = await storage.getDoorActionLogsByHotel(hotel.id, req.tenantId!);
        const todayLogs = allLogs.filter(log =>
          log.createdAt && new Date(log.createdAt) >= todayStart && propertyRoomNumbers.has(log.roomNumber)
        );

        for (const log of todayLogs) {
          if (log.action === "open") {
            roomActivityMap[log.roomNumber].opensToday++;
          } else if (log.action === "close") {
            roomActivityMap[log.roomNumber].closesToday++;
          }
        }
      }

      res.json(roomActivityMap);
    } catch (error) {
      logger.error({ err: error }, "Error fetching door activity");
      res.status(500).json({ message: "Failed to fetch door activity" });
    }
  });

  app.get("/api/units/status", requireRole("admin", "reception", "owner_admin", "property_manager", "staff"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const propertyId = req.query.propertyId as string | undefined;
      let unitsList: any[] = [];

      if (propertyId) {
        unitsList = await storage.getUnitsByProperty(propertyId);
      } else if (user.propertyId) {
        unitsList = await storage.getUnitsByProperty(user.propertyId);
      } else if (user.ownerId) {
        unitsList = await storage.getUnitsByOwner(user.ownerId);
      }

      if (req.tenantId && !req.tenantId.startsWith("demo_session_")) {
        unitsList = unitsList.filter(u => u.tenantId === req.tenantId);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const activeStatuses = ["booked", "confirmed", "precheck_submitted", "arrival_info_submitted", "checked_in"];
      const allBookings = user.hotelId ? await storage.getBookingsByHotel(user.hotelId, req.tenantId!) : [];
      const todayBookings = allBookings.filter(b =>
        activeStatuses.includes(b.status) &&
        new Date(b.checkInDate) < tomorrow &&
        new Date(b.checkOutDate) >= today
      );

      const result = unitsList.map(unit => {
        const activeBooking = todayBookings.find(b =>
          b.roomNumber.trim() === unit.unitNumber.trim() ||
          b.unitId === unit.id
        );
        return {
          id: unit.id,
          unitNumber: unit.unitNumber,
          unitType: unit.unitType,
          status: unit.status,
          floor: unit.floor,
          capacity: unit.capacity,
          propertyId: unit.propertyId,
          hasActiveBooking: !!activeBooking,
          activeBookingStatus: activeBooking?.status || null,
          activeGuestName: null,
        };
      });

      res.json(result);
    } catch (error) {
      logger.error({ err: error }, "Error fetching unit status");
      res.status(500).json({ message: "Failed to fetch room status" });
    }
  });

  app.patch("/api/units/:id/status", requireRole("admin", "reception", "owner_admin", "property_manager", "staff"), validateBody(unitStatusSchema), async (req, res) => {
    try {
      const unitId = asString(req.params.id);
      const { status } = req.body;

      const allowedStatuses = ["ready", "dirty", "cleaning", "occupied", "out_of_order"];
      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}` });
      }

      const unit = await storage.getUnit(unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }

      if (req.tenantId && !req.tenantId.startsWith("demo_session_") && unit.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updated = await storage.updateUnit(unitId, { status });
      logger.info({ unitNumber: unit.unitNumber, status }, "Room status manually updated");

      if (unit.propertyId) {
        try {
          const boss = await getJobQueue();
          await enqueueOtaSync(boss, unit.propertyId, req.tenantId || null, "push_availability", "room_status_changed");
        } catch (otaErr) {
          logger.warn({ err: otaErr, unitId }, "Failed to enqueue OTA availability sync after room status change");
        }
      }

      res.json(updated);
    } catch (error) {
      logger.error({ err: error }, "Error updating unit status");
      res.status(500).json({ message: "Failed to update room status" });
    }
  });
}
