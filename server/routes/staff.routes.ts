import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { asString } from "../utils/request";
import { z } from "zod";
import { createStaffInvitationSchema } from "@shared/schema";
import { hashPassword } from "../services/auth.service";
import { sendStaffInvitationEmail, sendBookingConfirmationEmail, sendStaffCreatedEmail } from "../email";
import { requireAuth, requireRole, requireFeature, resolveTenant, requireStaffLimit } from "../middleware";
import { logger } from "../utils/logger";
import { getJobQueue } from "../services/jobQueue";
import { enqueueOtaSync } from "../workers/otaSyncWorker";
import { validateBody } from "../middleware/validateBody";
import { createStaffSchema, createGuestSchema, updateStaffSchema, resetPasswordSchema, inviteStaffSchema } from "../validators/staff.validators";

async function deriveTenantId(req: Request, currentUser: any): Promise<string | null> {
  if (req.tenantId) return req.tenantId;
  if (currentUser?.tenantId) return currentUser.tenantId;
  if (currentUser?.ownerId) return currentUser.ownerId;
  if (currentUser?.hotelId) {
    const hotel = await storage.getHotel(currentUser.hotelId);
    if (hotel?.ownerId) return hotel.ownerId;
    if (hotel?.propertyId) {
      const property = await storage.getProperty(hotel.propertyId);
      return property?.ownerId || null;
    }
  }
  if (currentUser?.propertyId) {
    const property = await storage.getProperty(currentUser.propertyId);
    return property?.ownerId || null;
  }
  return null;
}

async function deriveGuestTenantId(guest: any): Promise<string | null> {
  if (guest.tenantId) return guest.tenantId;
  if (guest.hotelId) {
    const hotel = await storage.getHotel(guest.hotelId);
    if (hotel?.ownerId) return hotel.ownerId;
    if (hotel?.propertyId) {
      const property = await storage.getProperty(hotel.propertyId);
      return property?.ownerId || null;
    }
  }
  return null;
}

function generateGuestUsername(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GUEST-${code}`;
}

export function registerStaffRoutes(app: Express): void {

  app.get("/api/admin/staff", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      let hotelId = currentUser?.hotelId;

      if (!hotelId && currentUser?.propertyId) {
        const matchingHotel = await storage.getHotelByPropertyId(currentUser.propertyId);
        if (matchingHotel) {
          hotelId = matchingHotel.id;
          await storage.updateUser(currentUser!.id, { hotelId });
        }
      }

      if (!hotelId) {
        return res.json([]);
      }

      const hotelUsers = await storage.getUsersByHotel(hotelId, req.tenantId!);
      const staffMembers = hotelUsers.filter(u =>
        u.role === "admin" || u.role === "reception" || u.role === "staff"
      );

      const usersWithoutPasswords = staffMembers.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      logger.error({ err: error }, "Error fetching staff");
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.get("/api/users/staff", requireRole("admin", "reception", "owner_admin", "property_manager", "restaurant_manager", "kitchen_staff", "waiter", "restaurant_cleaner", "restaurant_cashier"), async (req, res) => {
    const currentUser = await storage.getUser(req.session.userId!);
    const allStaff: any[] = [];
    const seenIds = new Set<string>();
    const staffRoles = ["reception", "admin", "owner_admin", "staff", "property_manager", "restaurant_manager", "kitchen_staff", "waiter", "restaurant_cleaner", "restaurant_cashier"];

    const addStaffUsers = (users: any[]) => {
      for (const u of users) {
        if (staffRoles.includes(u.role) && !seenIds.has(u.id)) {
          seenIds.add(u.id);
          const { password, ...userWithoutPassword } = u;
          allStaff.push(userWithoutPassword);
        }
      }
    };

    if (currentUser?.propertyId) {
      const propUsers = await storage.getUsersByProperty(currentUser.propertyId);
      addStaffUsers(propUsers);
    } else if (currentUser?.hotelId) {
      if (req.tenantId) {
        const hotelUsers = await storage.getUsersByHotel(currentUser.hotelId, req.tenantId);
        addStaffUsers(hotelUsers);
      }
    }

    if (currentUser?.role === "owner_admin" && currentUser.ownerId) {
      const ownerProperties = await storage.getPropertiesByOwner(currentUser.ownerId);
      for (const prop of ownerProperties) {
        const propUsers = await storage.getUsersByProperty(prop.id);
        addStaffUsers(propUsers);
      }
      if (req.tenantId) {
        const ownerUsers = await storage.getUsersByOwner(currentUser.ownerId, req.tenantId);
        addStaffUsers(ownerUsers);
      }
    } else {
      const tenantId = req.tenantId || currentUser?.tenantId;
      if (tenantId) {
        const ownerAdmins = await storage.getOwnerAdminsByTenant(tenantId);
        addStaffUsers(ownerAdmins);
      }
    }

    res.json(allStaff);
  });

  app.get("/api/users/guests", resolveTenant, requireRole("admin", "reception", "owner_admin", "property_manager", "staff"), async (req, res) => {
    const currentUser = await storage.getUser(req.session.userId!);
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const hotelId = currentUser.hotelId || undefined;
    const tenantId = await deriveTenantId(req, currentUser) || undefined;
    if (!hotelId && !tenantId) {
      return res.json([]);
    }
    const guestUsers = await storage.getGuestUsers(hotelId || "", tenantId || "");
    const usersWithoutPasswords = guestUsers.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  });

  app.post("/api/admin/create-staff", requireRole("admin", "owner_admin", "property_manager", "oss_super_admin", "restaurant_manager"), requireFeature("staff_management"), validateBody(createStaffSchema), async (req, res) => {
    try {
      const { fullName, username, password, email } = req.body;
      if (username && username.toLowerCase().startsWith("demo_")) {
        return res.status(400).json({ message: "This username prefix is reserved." });
      }
      const rawRole = (req.body.role || req.body.staffRole || "").toString().toLowerCase().trim();
      const currentUser = await storage.getUser(req.session.userId!);

      let resolvedHotelId = currentUser?.hotelId;

      if (!resolvedHotelId && currentUser?.propertyId) {
        const matchingHotel = await storage.getHotelByPropertyId(currentUser.propertyId);
        if (matchingHotel) {
          resolvedHotelId = matchingHotel.id;
          await storage.updateUser(currentUser!.id, { hotelId: resolvedHotelId });
        }
      }

      if (!resolvedHotelId && currentUser?.role === "oss_super_admin") {
        const allHotels = await storage.adminGetAllHotels();
        if (allHotels.length > 0) {
          resolvedHotelId = allHotels[0].id;
          await storage.updateUser(currentUser!.id, { hotelId: resolvedHotelId });
        }
      }

      if (!resolvedHotelId) {
        return res.status(400).json({ message: "Please create a hotel first before adding staff" });
      }

      if (!fullName || !username || !password || !rawRole) {
        return res.status(400).json({ message: "Missing required fields: fullName, username, password, and role are required" });
      }

      const VALID_ROLES = ["admin", "manager", "reception", "cleaner", "front_desk", "restaurant_manager", "waiter", "kitchen_staff", "restaurant_cleaner", "restaurant_cashier"];
      if (!VALID_ROLES.includes(rawRole)) {
        return res.status(400).json({ message: `Invalid role "${rawRole}". Must be one of: ${VALID_ROLES.join(", ")}` });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const roleMapping: Record<string, string> = {
        front_desk: "reception",
        manager: "admin",
        cleaner: "staff",
        reception: "reception",
        admin: "admin",
        restaurant_manager: "restaurant_manager",
        waiter: "waiter",
        kitchen_staff: "kitchen_staff",
        restaurant_cleaner: "restaurant_cleaner",
        restaurant_cashier: "restaurant_cashier",
      };
      const userRole = roleMapping[rawRole] || "staff";

      const hashedStaffPw = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedStaffPw,
        fullName,
        email: email || null,
        role: userRole,
        hotelId: resolvedHotelId,
        propertyId: currentUser?.propertyId || null,
        ownerId: currentUser?.ownerId || null,
      });

      // Send welcome email with credentials if email provided
      if (email) {
        const property = currentUser?.propertyId
          ? await storage.getProperty(currentUser.propertyId).catch(() => null)
          : null;
        const propertyName = property?.name || "Your Property";
        sendStaffCreatedEmail({
          to: email,
          fullName,
          username,
          password,
          propertyName,
          role: userRole,
          invitedByName: currentUser?.fullName || currentUser?.username || "Admin",
        }).catch((err: any) => logger.error({ err }, "Failed to send staff welcome email"));
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      const msg = error?.message || "Failed to create staff member";
      logger.error({ err: error }, "Error creating staff");
      res.status(500).json({ message: msg });
    }
  });

  app.post("/api/staff/create-guest", resolveTenant, requireRole("reception", "admin", "owner_admin", "property_manager"), requireFeature("guest_management"), validateBody(createGuestSchema), async (req, res) => {
    try {
      
      const { fullName, email, phoneNumber, roomNumber, checkInDate, checkOutDate, password, paymentAmount, paymentStatus, paymentMethod, bookingNumber, bookingSource, numberOfGuests, nationality, passportNumber, specialNotes, nightlyRate, totalPrice, currency, discount, reservationStatus, transactionReference, paymentNotes, amountPaid, travelAgencyName } = req.body;
      const staffUser = await storage.getUser(req.session.userId!);
      if (!staffUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const missingFields = [];
      if (!fullName) missingFields.push("fullName");
      if (!email) missingFields.push("email");
      if (!phoneNumber) missingFields.push("phoneNumber");
      if (!roomNumber) missingFields.push("roomNumber");
      if (!checkInDate) missingFields.push("checkInDate");
      if (!checkOutDate) missingFields.push("checkOutDate");
      if (!password) missingFields.push("password");
      
      if (missingFields.length > 0) {
        return res.status(400).json({ message: `Missing fields: ${missingFields.join(", ")}` });
      }

      const parsedCheckIn = new Date(checkInDate);
      const parsedCheckOut = new Date(checkOutDate);
      if (isNaN(parsedCheckIn.getTime()) || isNaN(parsedCheckOut.getTime())) {
        return res.status(400).json({ message: "Invalid check-in or check-out date format" });
      }

      const phoneRegex = /^\+\d{7,15}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ message: "Phone must start with + followed by country code and number" });
      }

      let username = generateGuestUsername();
      let existingUser = await storage.getUserByUsername(username);
      let attempts = 0;
      while (existingUser && attempts < 10) {
        username = generateGuestUsername();
        existingUser = await storage.getUserByUsername(username);
        attempts++;
      }
      
      if (existingUser) {
        return res.status(500).json({ message: "Could not generate unique username. Please try again." });
      }

      const hashedGuestPw = await hashPassword(password);
      const guestTenantId = await deriveTenantId(req, staffUser);
      const user = await storage.createUser({
        username,
        fullName,
        password: hashedGuestPw,
        role: "guest",
        phone: phoneNumber,
        email,
        hotelId: staffUser.hotelId,
        tenantId: guestTenantId,
      });

      try {
        await storage.createCredentialLog({
          guestId: user.id,
          action: "created",
          performedBy: staffUser.id,
          performedByName: staffUser.fullName,
          notes: `Guest account created with username ${username}`,
          tenantId: guestTenantId,
        });
      } catch (credErr) {
        logger.warn({ err: credErr }, "createCredentialLog failed (table may not exist yet — run migration 0014)");
      }

      const trimmedRoomNumber = roomNumber.trim();
      const matchedUnit = await storage.findUnitForBooking({
        tenantId: guestTenantId,
        propertyId: staffUser.propertyId || null,
        roomNumber: trimmedRoomNumber,
        unitId: null,
      });

      const booking = await storage.createBooking({
        guestId: user.id,
        roomNumber: trimmedRoomNumber,
        roomType: "Standard",
        checkInDate: parsedCheckIn,
        checkOutDate: parsedCheckOut,
        status: reservationStatus || "confirmed",
        preCheckedIn: false,
        bookingNumber: bookingNumber || null,
        bookingSource: bookingSource || null,
        numberOfGuests: numberOfGuests ? parseInt(numberOfGuests) : null,
        nationality: nationality || null,
        passportNumber: passportNumber || null,
        specialNotes: specialNotes || null,
        nightlyRate: nightlyRate ? Math.round(parseFloat(nightlyRate) * 100) : null,
        totalPrice: totalPrice ? Math.round(parseFloat(totalPrice) * 100) : null,
        currency: currency || "USD",
        discount: discount ? Math.round(parseFloat(discount) * 100) : null,
        travelAgencyName: (bookingSource === "travel_agency" && travelAgencyName) ? travelAgencyName : null,
        tenantId: guestTenantId,
        ownerId: staffUser.ownerId || null,
        
        propertyId: staffUser.propertyId || null,
        unitId: matchedUnit?.id || null,
      });

      await storage.createRoomSettings({
        bookingId: booking.id,
        temperature: 22,
        lightsOn: false,
        lightsBrightness: 50,
        curtainsOpen: false,
        jacuzziOn: false,
        jacuzziTemperature: 38,
        welcomeMode: true,
        tenantId: guestTenantId,
      });

      await storage.createNotification({
        userId: user.id,
        title: "Welcome to O.S.S!",
        message: `Your room ${roomNumber} is ready. Check-in: ${parsedCheckIn.toLocaleDateString()}`,
        type: "info",
        tenantId: guestTenantId,
      });

      if (discount && parseFloat(discount) > 0) {
        const ownerId = staffUser.ownerId || (staffUser.role === "owner_admin" ? staffUser.id : null);
        if (ownerId) {
          const discountAmount = parseFloat(discount).toFixed(2);
          const currency = req.body.currency || "USD";
          await storage.createNotification({
            userId: ownerId,
            title: "Discount Applied on Booking",
            message: `Reception (${staffUser.fullName}) applied a ${discountAmount} ${currency} discount to room ${roomNumber} for guest ${fullName}.`,
            type: "warning",
            tenantId: guestTenantId,
          });
        }
      }

      let resetPasswordUrl: string | undefined;
      try {
        const crypto = await import("crypto");
        const resetToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await storage.createPasswordResetToken({
          userId: user.id,
          token: resetToken,
          expiresAt,
        });
        const appUrl = process.env.APP_BASE_URL || process.env.BASE_URL || "https://ossaiproapp.com";
        resetPasswordUrl = `${appUrl}/reset-password?token=${resetToken}`;
      } catch (err) {
        logger.error({ err }, "Failed to create password reset token for guest");
      }

      sendBookingConfirmationEmail({
        to: email,
        guestName: fullName,
        username,
        resetPasswordUrl,
        roomNumber,
        checkInDate,
        checkOutDate,
        totalPrice: totalPrice ? parseFloat(totalPrice).toFixed(2) : undefined,
        currency: currency || "USD",
      }).catch((err) => logger.error({ err }, "Failed to send booking confirmation email"));

      let transaction = null;
      const effectiveAmount = amountPaid || paymentAmount;
      let amountInCents = 0;

      if (effectiveAmount && parseFloat(effectiveAmount) > 0) {
        amountInCents = Math.round(parseFloat(effectiveAmount) * 100);
      } else if (paymentStatus && paymentStatus.toLowerCase() === "paid" && totalPrice && parseFloat(totalPrice) > 0) {
        amountInCents = Math.round(parseFloat(totalPrice) * 100);
      }

      if (amountInCents > 0) {
        const resolvedStatus = (paymentStatus && paymentStatus.toLowerCase() === "paid") ? "paid" : (paymentStatus || "pending");
        transaction = await storage.createFinancialTransaction({
          hotelId: staffUser.hotelId!,
          guestId: user.id,
          bookingId: booking.id,
          roomNumber,
          category: "room_booking",
          description: `Room ${roomNumber} booking payment`,
          amount: amountInCents,
          paymentMethod: paymentMethod || "cash",
          paymentStatus: resolvedStatus,
          transactionReference: transactionReference || null,
          notes: paymentNotes || null,
          createdBy: staffUser.id,
          createdByName: staffUser.fullName,
          tenantId: guestTenantId,
        });


        await storage.createFinancialAuditLog({
          hotelId: staffUser.hotelId!,
          transactionId: transaction.id,
          action: "created",
          performedBy: staffUser.id,
          performedByName: staffUser.fullName,
          newValues: { amount: amountInCents, status: resolvedStatus, method: paymentMethod },
          tenantId: guestTenantId,
        });

        try {
          const hotel = await storage.getHotel(staffUser.hotelId!);
          await storage.createRevenue({
            hotelId: staffUser.hotelId!,
            propertyId: hotel?.propertyId || staffUser.propertyId || null,
            ownerId: staffUser.ownerId || null,
            bookingId: booking.id,
            guestId: user.id,
            transactionId: transaction.id,
            roomNumber,
            category: "room_booking",
            description: `Room ${roomNumber} booking payment`,
            amount: amountInCents,
            currency: currency || "USD",
            paymentMethod: paymentMethod || "cash",
            paymentStatus: resolvedStatus,
            sourceType: "auto",
            createdBy: staffUser.id,
            createdByName: staffUser.fullName,
            tenantId: guestTenantId,
          });
          logger.info({ bookingId: booking.id, amount: amountInCents }, "Revenue record created for booking");
        } catch (revErr) {
          logger.error({ err: revErr }, "Auto-revenue creation failed");
        }
      }

      if (booking.propertyId) {
        try {
          const boss = await getJobQueue();
          await enqueueOtaSync(boss, booking.propertyId, guestTenantId, "push_availability", "booking_created");
        } catch (otaErr) {
          logger.warn({ err: otaErr, bookingId: booking.id }, "Failed to enqueue OTA availability sync after booking creation");
        }
      }

      res.json({ 
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
        }, 
        booking,
        credentials: {
          username: user.username,
        }
      });
    } catch (error: any) {
      logger.error({ err: error }, "Error creating guest");
      const errMsg = error?.message || "";
      if (errMsg.includes("OVERBOOKING_BLOCKED")) {
        return res.status(409).json({ message: "Bu otaq seçilmiş tarixlər üçün artıq rezerv edilib." });
      }
      if (errMsg.includes("ROOM_NOT_AVAILABLE")) {
        return res.status(409).json({ message: "Otaq bu tarixlər üçün mövcud deyil." });
      }
      if (error?.code === "23503") {
        return res.status(400).json({ message: "Bağlantı xətası: əlaqəli cədvəldə uyğun qeyd tapılmadı." });
      }
      if (error?.code === "42703") {
        return res.status(500).json({ message: `DB sütun xətası (VPS miqrasiya tələb olunur): ${errMsg}` });
      }
      if (error?.code === "42P01") {
        return res.status(500).json({ message: `DB cədvəl tapılmadı (VPS miqrasiya tələb olunur): ${errMsg}` });
      }
      res.status(500).json({ message: errMsg || "Qonaq hesabı yaradıla bilmədi." });
    }
  });

  app.get("/api/users/guests/:guestId/details", resolveTenant, requireRole("admin", "reception", "owner_admin", "property_manager", "staff"), async (req, res) => {
    try {
      const guestId = asString(req.params.guestId);
      const currentUser = await storage.getUser(req.session.userId!);
      
      const user = await storage.getGuestWithPassword(guestId);
      if (!user) {
        return res.status(404).json({ message: "Guest not found" });
      }
      
      const currentTenantId = await deriveTenantId(req, currentUser);
      const guestTenantId = await deriveGuestTenantId(user);
      if (currentUser?.hotelId && user.hotelId !== currentUser.hotelId) {
        return res.status(403).json({ message: "Access denied - guest belongs to another hotel" });
      }
      if (currentTenantId && guestTenantId && currentTenantId !== guestTenantId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const booking = await storage.getCurrentBookingForGuest(guestId);
      const serviceRequests = await storage.getServiceRequestsForGuest(guestId);
      const credentialLogs = await storage.getCredentialLogsForGuest(guestId);
      
      res.json({
        guest: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
        },
        credentials: {
          username: user.username,
        },
        booking: booking || null,
        serviceRequests: serviceRequests || [],
        credentialLogs: credentialLogs || [],
      });
    } catch (error) {
      logger.error({ err: error }, "Error fetching guest details");
      res.status(500).json({ message: "Failed to fetch guest details" });
    }
  });

  app.delete("/api/users/guests/:guestId", resolveTenant, requireRole("admin", "reception", "owner_admin", "property_manager", "staff"), async (req, res) => {
    try {
      const guestId = asString(req.params.guestId);
      const currentUser = await storage.getUser(req.session.userId!);
      
      const user = await storage.getUser(guestId);
      if (!user) {
        return res.status(404).json({ message: "Guest not found" });
      }
      
      if (user.role !== "guest") {
        return res.status(400).json({ message: "Can only delete guest accounts" });
      }
      
      const currentTenantId = await deriveTenantId(req, currentUser);
      const guestTenantId = await deriveGuestTenantId(user);
      if (currentUser?.hotelId && user.hotelId !== currentUser.hotelId) {
        return res.status(403).json({ message: "Access denied - guest belongs to another hotel" });
      }
      if (currentTenantId && guestTenantId && currentTenantId !== guestTenantId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteGuest(guestId);
      res.json({ message: "Guest deleted successfully" });
    } catch (error) {
      logger.error({ err: error }, "Error deleting guest");
      res.status(500).json({ message: "Failed to delete guest" });
    }
  });

  app.get("/api/properties/:propertyId/staff", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const propertyId = asString(req.params.propertyId);
      const property = await storage.getProperty(propertyId);
      if (!property) return res.status(404).json({ message: "Property not found" });

      if (user.role !== "owner_admin" && user.role !== "oss_super_admin") {
        if (user.propertyId !== propertyId) {
          return res.status(403).json({ message: "Forbidden" });
        }
      } else if (user.role === "owner_admin" && property.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const staffUsers = await storage.getUsersByProperty(propertyId);
      const invitations = await storage.getStaffInvitationsByProperty(propertyId);

      const staffList = staffUsers
        .filter(u => ["staff", "reception", "admin", "property_manager"].includes(u.role))
        .map(u => ({
          id: u.id,
          fullName: u.fullName,
          username: u.username,
          email: u.email,
          phone: u.phone,
          role: u.role,
          avatarUrl: u.avatarUrl,
          createdAt: u.createdAt,
          type: "member" as const,
        }));

      const pendingInvitations = invitations
        .filter(i => i.status === "pending")
        .map(i => ({
          id: i.id,
          email: i.email,
          staffRole: i.staffRole,
          status: i.status,
          createdAt: i.createdAt,
          type: "invitation" as const,
        }));

      res.json({ staff: staffList, invitations: pendingInvitations });
    } catch (error) {
      logger.error({ err: error }, "Error fetching property staff");
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post("/api/properties/:propertyId/staff/invite", requireRole("owner_admin"), requireFeature("staff_management"), requireStaffLimit(), validateBody(inviteStaffSchema), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const propertyId = asString(req.params.propertyId);
      const property = await storage.getProperty(propertyId);
      if (!property) return res.status(404).json({ message: "Property not found" });

      if (property.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "You can only invite staff to your own properties" });
      }

      const data = createStaffInvitationSchema.parse({ ...req.body, propertyId });

      const existingInvitation = await storage.getStaffInvitationByEmail(propertyId, data.email);
      if (existingInvitation && existingInvitation.status === "pending") {
        return res.status(400).json({ message: "An invitation is already pending for this email" });
      }

      const token = crypto.randomUUID();

      const invitation = await storage.createStaffInvitation({
        propertyId,
        ownerId: user.ownerId!,
        email: data.email,
        staffRole: data.staffRole,
        status: "pending",
        invitedBy: user.id,
        inviteToken: token,
      });

      storage.createAuditLog({
        ownerId: user.ownerId || undefined,
        userId: user.id,
        userRole: user.role,
        action: "staff_invited",
        entityType: "staff_invitation",
        entityId: invitation.id,
        description: `Invited ${data.email} as ${data.staffRole} to property ${property.name}`,
      }).catch(() => {});

      sendStaffInvitationEmail({
        to: data.email,
        staffRole: data.staffRole,
        propertyName: property.name,
        inviteToken: token,
        invitedByName: user.fullName || user.username,
      }).catch((err) => logger.error({ err }, "Failed to send staff invitation email"));

      res.json(invitation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      logger.error({ err: error }, "Error inviting staff");
      res.status(500).json({ message: "Failed to send invitation" });
    }
  });

  app.post("/api/properties/:propertyId/staff/create", requireRole("owner_admin", "admin", "oss_super_admin", "restaurant_manager"), requireFeature("staff_management"), requireStaffLimit(), validateBody(createStaffSchema), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const propertyId = asString(req.params.propertyId);
      const property = await storage.getProperty(propertyId);
      if (!property) return res.status(404).json({ message: "Property not found" });

      if (user.role !== "oss_super_admin" && property.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "You can only create staff for your own properties" });
      }

      const { fullName, username, password, email } = req.body;
      const rawRole = (req.body.staffRole || req.body.role || "").toString().toLowerCase().trim();

      if (!fullName || !username || !password || !rawRole) {
        return res.status(400).json({ message: "Missing required fields: fullName, username, password, and role are required" });
      }

      const VALID_ROLES = ["admin", "manager", "reception", "cleaner", "front_desk", "restaurant_manager", "waiter", "kitchen_staff", "restaurant_cleaner", "restaurant_cashier"];
      if (!VALID_ROLES.includes(rawRole)) {
        return res.status(400).json({ message: `Invalid staff role "${rawRole}". Must be one of: ${VALID_ROLES.join(", ")}` });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const roleMapping: Record<string, string> = {
        front_desk: "reception",
        manager: "admin",
        cleaner: "staff",
        reception: "reception",
        admin: "admin",
        restaurant_manager: "restaurant_manager",
        waiter: "waiter",
        kitchen_staff: "kitchen_staff",
        restaurant_cleaner: "restaurant_cleaner",
        restaurant_cashier: "restaurant_cashier",
      };

      const userRole = roleMapping[rawRole] || "staff";

      const matchingHotel = await storage.getHotelByPropertyId(propertyId);

      const hashedNewStaffPw = await hashPassword(password);
      const newUser = await storage.createUser({
        username,
        password: hashedNewStaffPw,
        role: userRole,
        fullName,
        email: email || null,
        propertyId,
        ownerId: user.ownerId!,
        hotelId: matchingHotel?.id || null,
      });

      const baseSalaryRaw = req.body.baseSalary;
      const baseSalaryCents = baseSalaryRaw ? Math.round(parseFloat(String(baseSalaryRaw)) * 100) : 0;
      if (baseSalaryCents > 0 && matchingHotel?.id) {
        const empTaxRate = req.body.employeeTaxRate ? parseInt(String(req.body.employeeTaxRate), 10) : 0;
        const addlExpenses = req.body.additionalExpensesMonthly ? Math.round(parseFloat(String(req.body.additionalExpensesMonthly)) * 100) : 0;
        storage.createPayrollConfig({
          staffId: newUser.id,
          staffName: fullName,
          staffRole: rawRole,
          baseSalary: baseSalaryCents,
          currency: "USD",
          frequency: "monthly",
          employeeTaxRate: empTaxRate,
          additionalExpensesMonthly: addlExpenses,
          hotelId: matchingHotel.id,
          propertyId,
          ownerId: user.ownerId!,
          tenantId: req.tenantId || null,
          isActive: true,
          createdBy: user.id,
        }).catch((err: any) => logger.error({ err }, "Failed to auto-create payroll config for new staff"));
      }

      storage.createAuditLog({
        ownerId: user.ownerId || undefined,
        userId: user.id,
        userRole: user.role,
        action: "staff_created",
        entityType: "user",
        entityId: newUser.id,
        description: `Created ${fullName} as ${rawRole} for property ${property.name}`,
      }).catch(() => {});

      const { password: _, ...userWithoutPassword } = newUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      const msg = error?.message || "Failed to create staff account";
      logger.error({ err: error }, "Error creating property staff");
      res.status(500).json({ message: msg });
    }
  });

  app.get("/api/staff/validate-invite", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).json({ valid: false, message: "Token is required" });
      }
      const invitation = await storage.getStaffInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ valid: false, message: "Invalid invitation link" });
      }
      if (invitation.status !== "pending") {
        return res.status(400).json({ valid: false, status: invitation.status, message: "This invitation has already been used" });
      }
      res.json({ valid: true, email: invitation.email, staffRole: invitation.staffRole });
    } catch (error) {
      logger.error({ err: error }, "Error validating invitation");
      res.status(500).json({ valid: false, message: "Failed to validate invitation" });
    }
  });

  app.post("/api/staff/accept-invite", async (req, res) => {
    try {
      const { token, username, password, fullName } = req.body;

      if (!token || !username || !password || !fullName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const invitation = await storage.getStaffInvitationByToken(token);
      if (!invitation || invitation.status !== "pending") {
        return res.status(400).json({ message: "Invalid or expired invitation" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const roleMapping: Record<string, string> = {
        front_desk: "reception",
        manager: "admin",
        cleaner: "staff",
        restaurant_manager: "restaurant_manager",
        waiter: "waiter",
        kitchen_staff: "kitchen_staff",
      };

      const userRole = roleMapping[invitation.staffRole] || invitation.staffRole || "staff";

      const matchingHotel = invitation.propertyId
        ? await storage.getHotelByPropertyId(invitation.propertyId)
        : null;

      const hashedInvitePw = await hashPassword(password);
      const newUser = await storage.createUser({
        username,
        password: hashedInvitePw,
        role: userRole,
        fullName,
        email: invitation.email,
        propertyId: invitation.propertyId,
        ownerId: invitation.ownerId,
        hotelId: matchingHotel?.id || null,
      });

      await storage.updateStaffInvitation(invitation.id, {
        status: "accepted",
        acceptedBy: newUser.id,
        updatedAt: new Date(),
      });

      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) logger.error({ err }, "Session regeneration error");
          req.session.userId = newUser.id;
          req.session.save((saveErr) => {
            if (saveErr) reject(saveErr);
            else resolve();
          });
        });
      });

      storage.createAuditLog({
        ownerId: invitation.ownerId,
        userId: newUser.id,
        userRole: newUser.role,
        action: "staff_joined",
        entityType: "user",
        entityId: newUser.id,
        description: `${fullName} joined as ${invitation.staffRole} via invitation`,
      }).catch(() => {});

      const { password: _, ...userWithoutPassword } = newUser;
      res.json(userWithoutPassword);
    } catch (error) {
      logger.error({ err: error }, "Error accepting invitation");
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  app.delete("/api/staff/:staffId", requireRole("owner_admin", "admin", "oss_super_admin"), async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) return res.status(401).json({ message: "Unauthorized" });

      const staffId = asString(req.params.staffId);
      const staffUser = await storage.getUser(staffId);

      if (!staffUser) return res.status(404).json({ message: "Staff member not found" });

      if (currentUser.role !== "oss_super_admin" && staffUser.ownerId !== currentUser.ownerId) {
        return res.status(403).json({ message: "Cannot delete staff from another property" });
      }

      if (staffUser.role === "owner_admin") {
        return res.status(400).json({ message: "Cannot delete an owner admin account" });
      }

      await storage.deleteUser(staffId);

      storage.createAuditLog({
        ownerId: currentUser.ownerId || undefined,
        userId: currentUser.id,
        userRole: currentUser.role,
        action: "staff_deleted",
        entityType: "user",
        entityId: staffId,
        description: `Deleted staff member ${staffUser.fullName || staffUser.username}`,
      }).catch(() => {});

      res.json({ message: "Staff member deleted" });
    } catch (error) {
      logger.error({ err: error }, "Error deleting staff member");
      res.status(500).json({ message: "Failed to delete staff member" });
    }
  });

  app.delete("/api/properties/:propertyId/staff/:staffId", requireRole("owner_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const propertyId = asString(req.params.propertyId);
      const staffId = asString(req.params.staffId);

      const property = await storage.getProperty(propertyId);
      if (!property || property.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const staffUser = await storage.getUser(staffId);
      if (staffUser && staffUser.propertyId === propertyId) {
        await storage.updateUser(staffId, { propertyId: null as any, ownerId: null as any });
      }

      res.json({ message: "Staff member removed" });
    } catch (error) {
      logger.error({ err: error }, "Error removing staff");
      res.status(500).json({ message: "Failed to remove staff member" });
    }
  });

  app.delete("/api/properties/:propertyId/invitations/:invitationId", requireRole("owner_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const propertyId = asString(req.params.propertyId);
      const invitationId = asString(req.params.invitationId);

      const property = await storage.getProperty(propertyId);
      if (!property || property.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteStaffInvitation(invitationId);
      res.json({ message: "Invitation cancelled" });
    } catch (error) {
      logger.error({ err: error }, "Error cancelling invitation");
      res.status(500).json({ message: "Failed to cancel invitation" });
    }
  });

  app.get("/api/properties/:propertyId/staff/:staffId", requireRole("owner_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const propertyId = asString(req.params.propertyId);
      const staffId = asString(req.params.staffId);

      const property = await storage.getProperty(propertyId);
      if (!property || property.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const staffUser = await storage.getUser(staffId);
      if (!staffUser || staffUser.propertyId !== propertyId) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      const { password: _, ...staffWithoutPassword } = staffUser;
      res.json(staffWithoutPassword);
    } catch (error) {
      logger.error({ err: error }, "Error fetching staff member");
      res.status(500).json({ message: "Failed to fetch staff member" });
    }
  });

  app.patch("/api/properties/:propertyId/staff/:staffId", requireRole("owner_admin"), validateBody(updateStaffSchema), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const propertyId = asString(req.params.propertyId);
      const staffId = asString(req.params.staffId);

      const property = await storage.getProperty(propertyId);
      if (!property || property.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const staffUser = await storage.getUser(staffId);
      if (!staffUser || staffUser.propertyId !== propertyId) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      const allowedUpdates: Record<string, any> = {};
      if (req.body.fullName) allowedUpdates.fullName = req.body.fullName;
      if (req.body.email !== undefined) allowedUpdates.email = req.body.email;
      if (req.body.phone !== undefined) allowedUpdates.phone = req.body.phone;

      if (req.body.role) {
        const validRoles = ["reception", "admin", "staff"];
        if (!validRoles.includes(req.body.role)) {
          return res.status(400).json({ message: "Invalid role" });
        }
        allowedUpdates.role = req.body.role;
      }

      const updated = await storage.updateUser(staffId, allowedUpdates);
      if (!updated) return res.status(500).json({ message: "Failed to update staff member" });

      storage.createAuditLog({
        ownerId: user.ownerId || undefined,
        userId: user.id,
        userRole: user.role,
        action: "staff_updated",
        entityType: "user",
        entityId: staffId,
        description: `Updated staff member ${updated.fullName} on property ${property.name}`,
      }).catch(() => {});

      const { password: _, ...staffWithoutPassword } = updated;
      res.json(staffWithoutPassword);
    } catch (error) {
      logger.error({ err: error }, "Error updating staff");
      res.status(500).json({ message: "Failed to update staff member" });
    }
  });

  app.post("/api/properties/:propertyId/staff/:staffId/reset-password", requireRole("owner_admin"), validateBody(resetPasswordSchema), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const propertyId = asString(req.params.propertyId);
      const staffId = asString(req.params.staffId);

      const property = await storage.getProperty(propertyId);
      if (!property || property.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const staffUser = await storage.getUser(staffId);
      if (!staffUser || staffUser.propertyId !== propertyId) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const hashedPw = await hashPassword(newPassword);
      await storage.updateUser(staffId, { password: hashedPw });

      storage.createAuditLog({
        ownerId: user.ownerId || undefined,
        userId: user.id,
        userRole: user.role,
        action: "staff_password_reset",
        entityType: "user",
        entityId: staffId,
        description: `Reset password for staff member ${staffUser.fullName} on property ${property.name}`,
      }).catch(() => {});

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      logger.error({ err: error }, "Error resetting staff password");
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.post("/api/properties/:propertyId/invitations/:invitationId/resend", requireRole("owner_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const propertyId = asString(req.params.propertyId);
      const invitationId = asString(req.params.invitationId);

      const property = await storage.getProperty(propertyId);
      if (!property || property.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const invitations = await storage.getStaffInvitationsByProperty(propertyId);
      const invitation = invitations.find(i => i.id === invitationId);
      if (!invitation || invitation.status !== "pending") {
        return res.status(404).json({ message: "Pending invitation not found" });
      }

      const newToken = crypto.randomUUID();
      await storage.updateStaffInvitation(invitationId, {
        inviteToken: newToken,
        updatedAt: new Date(),
      });

      sendStaffInvitationEmail({
        to: invitation.email,
        staffRole: invitation.staffRole,
        propertyName: property.name,
        inviteToken: newToken,
        invitedByName: user.fullName || user.username,
      }).catch((err) => logger.error({ err }, "Failed to resend staff invitation email"));

      res.json({ message: "Invitation resent successfully" });
    } catch (error) {
      logger.error({ err: error }, "Error resending invitation");
      res.status(500).json({ message: "Failed to resend invitation" });
    }
  });
}
