import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "../db";
import { z } from "zod";
import helmet from "helmet";
import cors from "cors";
import { authRateLimiter } from "../middleware/rateLimit";
import { storage } from "../storage";
import { loginSchema, registerSchema } from "@shared/schema";
import { hashPassword, verifyPassword, seedOssAdminUser } from "../services/auth.service";
import { authenticateRequest, resolveTenant, requireAuth, requireActiveSubscription } from "../middleware";
import { sendPasswordResetEmail, sendHotelWelcomeEmail } from "../email";

import crypto from "crypto";
import { applyPlanFeatures, PLAN_CODE_FEATURES } from "@shared/planFeatures";
import { PLAN_TYPE_TO_CODE, type PlanType } from "@shared/schema";
import { logger } from "../utils/logger";

const PgStore = connectPgSimple(session);

export const sessionStore = new PgStore({
  pool: pool,
  tableName: "session",
  createTableIfMissing: true,
});

declare module "express-session" {
  interface SessionData {
    userId: string;
    role?: string;
    demoSessionTenantId?: string;
  }
}

const hotelRegistrationSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["admin", "reception"]).optional().default("admin"),
  planCode: z.string().optional(),
  hotelData: z.object({
    name: z.string().min(2, "Hotel name is required"),
    country: z.string().min(1, "Country is required"),
    city: z.string().min(1, "City is required"),
    address: z.string().min(1, "Address is required"),
    phone: z.string().min(1, "Phone is required"),
    email: z.string().email("Valid hotel email is required"),
    totalRooms: z.coerce.number().min(1, "Total rooms must be at least 1"),
    postalCode: z.string().optional(),
    website: z.string().optional(),
    starRating: z.string().optional(),
    numberOfFloors: z.coerce.number().optional(),
    buildingType: z.string().optional(),
    primaryGuestType: z.string().optional(),
    hasSmartDevices: z.boolean().optional().default(false),
    smartDoorLocks: z.boolean().optional().default(false),
    smartHvac: z.boolean().optional().default(false),
    smartLighting: z.boolean().optional().default(false),
    pmsSystem: z.boolean().optional().default(false),
    bmsSystem: z.boolean().optional().default(false),
    iotSensors: z.boolean().optional().default(false),
    pmsSoftware: z.string().optional(),
    pmsOther: z.string().optional(),
    expectedSmartRoomCount: z.coerce.number().optional(),
    billingCurrency: z.string().optional(),
    billingContactEmail: z.string().email().optional().or(z.literal("")),
  }),
});

export async function registerAuthRoutes(httpServer: Server, app: Express): Promise<void> {
  await seedOssAdminUser();
  logger.info("OSS admin user check complete");

  const isProduction = process.env.NODE_ENV === "production";
  logger.info({ isProduction }, "Production mode configured");

  app.use(helmet({
    contentSecurityPolicy: false,
    frameguard: isProduction ? { action: "sameorigin" } : false,
  }));

  const allowedOrigins = [
    "https://ossaiproapp.com",
    "https://www.ossaiproapp.com",
  ];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  }));

  app.set("trust proxy", 1);

  app.use((req, res, next) => {
    const host = req.get('host') || '';
    if (host.startsWith('www.')) {
      const newHost = host.replace(/^www\./, '');
      const protocol = req.protocol;
      return res.redirect(301, `${protocol}://${newHost}${req.originalUrl}`);
    }
    next();
  });

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    if (isProduction) {
      throw new Error("SESSION_SECRET environment variable is required in production");
    }
    logger.warn("SESSION_SECRET not set, using dev fallback (not safe for production)");
  }

  const sessionConfig: session.SessionOptions = {
    store: sessionStore,
    secret: sessionSecret || "oss-hotel-dev-secret-key",
    resave: false,
    saveUninitialized: true,
    rolling: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  };

  logger.info({
    store: "PostgreSQL (connect-pg-simple)",
    cookieSecure: isProduction,
    cookieMaxAge: "7 days",
    sessionSecret: sessionSecret ? "loaded from env" : "using dev fallback",
  }, "Session configuration initialized");

  app.use(session(sessionConfig));


  const PUBLIC_PATHS = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/register-hotel",
    "/api/auth/demo-login",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/auth/logout",

    "/api/plans",
    "/api/smart-plans",
    "/api/quote-requests",
    "/api/welcome-stats",
    "/api/join-team",
    "/api/staff/accept-invite",
    "/api/staff/validate-invite",
    "/api/epoint/webhook",
    "/api/epoint/status",
    "/api/health",
    "/api/ai-chat",
  ];

  const SUBSCRIPTION_EXEMPT_PATHS = [
    "/api/auth/me",
    "/api/auth/logout",
    "/api/plans",
    "/api/smart-plans",
    "/api/subscription",
    "/api/billing",
    "/api/epoint",
    "/api/features",
    "/api/me/features",
    "/api/plan-type",
    "/api/onboarding",
    "/api/contracts",
    "/api/admin",
    "/api/oss-admin",
  ];

  app.use("/api", (req, res, next) => {
    const fullPath = `/api${req.path}`;
    if (PUBLIC_PATHS.some(p => fullPath === p || fullPath.startsWith(p + "/"))) {
      return next();
    }
    authenticateRequest(req, res, (err) => {
      if (err) return next(err);
      resolveTenant(req, res, (err2) => {
        if (err2) return next(err2);
        if (SUBSCRIPTION_EXEMPT_PATHS.some(p => fullPath === p || fullPath.startsWith(p + "/"))) {
          return next();
        }
        requireActiveSubscription(req, res, next);
      });
    });
  });

  app.post("/api/auth/register", authRateLimiter, async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      if (data.username.toLowerCase().startsWith("demo_")) {
        return res.status(400).json({ message: "This username prefix is reserved." });
      }

      if (data.role === "guest") {
        return res.status(403).json({ message: "Guest registration is not allowed. Please contact the hotel for credentials." });
      }
      
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPw = await hashPassword(data.password);
      let user = await storage.createUser({ ...data, password: hashedPw });

      if (data.role === "owner_admin" && !user.ownerId) {
        const owner = await storage.createOwner({
          name: data.fullName || data.username,
          email: data.email || `${data.username}@placeholder.local`,
          companyName: data.fullName ? `${data.fullName}'s Properties` : `${data.username}'s Properties`,
        });
        user = (await storage.updateUser(user.id, { ownerId: owner.id })) || user;
      }

      req.session.userId = user.id;
      req.session.role = user.role;
      delete req.session.demoSessionTenantId;
      req.session.touch();

      req.session.save((saveErr) => {
        if (saveErr) {
          logger.error({ err: saveErr }, "Session save error during registration");
          return res.status(500).json({ error: "session" });
        }
        logger.debug({ userId: user.id, role: user.role }, "Session saved after registration");
        const { password: _pw, ...userWithoutPassword } = user;
        res.setHeader("Cache-Control", "no-store");
        res.json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", authRateLimiter, async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(data.username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      let passwordValid = false;
      try {
        passwordValid = await verifyPassword(data.password, user.password);
      } catch {
        return res.status(401).json({ message: "Your password needs to be reset. Please use the 'Forgot Password' option." });
      }
      if (!passwordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.ownerId) {
        const owner = await storage.getOwner(user.ownerId);
        if (owner && (owner.status === "suspended" || owner.status === "deleted")) {
          const msg = owner.status === "suspended"
            ? "Your account has been suspended. Please contact support."
            : "Your account has been deactivated. Please contact support.";
          return res.status(403).json({ message: msg });
        }
      }

      req.session.userId = user.id;
      req.session.role = user.role;
      delete req.session.demoSessionTenantId;
      req.session.touch();

      if (user.ownerId) {
        const { getOwnerFeatures } = await import("../utils/planResolver");
        const loginResult = await getOwnerFeatures(user.ownerId);
        logger.info({ planCode: loginResult.planCode, features: loginResult.features.features, limits: loginResult.features.limits }, "Active plan resolved for login");
        if (!await storage.getSubscriptionByOwner(user.ownerId)) {
          logger.warn({ ownerId: user.ownerId }, "No subscription found for owner");
        }
      }

      storage.createAuditLog({
        ownerId: user.ownerId || undefined,
        userId: user.id,
        userRole: user.role,
        action: "user_login",
        entityType: "user",
        entityId: user.id,
        description: `User ${user.username} logged in`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      }).catch(() => {});

      req.session.save((saveErr) => {
        if (saveErr) {
          logger.error({ err: saveErr }, "Session save error during login");
          return res.status(500).json({ error: "session" });
        }
        logger.info({ username: user.username, role: user.role, isDemoMode: user.username.startsWith("demo_") }, "User logged in");
        const { password: _pw, ...userWithoutPassword } = user;
        res.setHeader("Cache-Control", "no-store");
        res.json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const DEMO_ROLE_MAP: Record<string, string> = {
    owner: "demo_owner",
    admin: "demo_admin",
    reception: "demo_reception",
    guest: "demo_guest1",
  };

  app.post("/api/auth/demo-login", authRateLimiter, async (req, res) => {
    const runtimeEnv = process.env["NODE_ENV"];
    const enableDemo = process.env["ENABLE_DEMO"] === "true";
    if (runtimeEnv === "production" && !enableDemo) {
      return res.status(403).json({ error: "Demo login disabled in production" });
    }

    try {
      const { role } = req.body;
      const username = DEMO_ROLE_MAP[role];
      if (!username) {
        return res.status(400).json({ message: "Invalid demo role" });
      }

      const { seedDemoData, ensureDemoUser } = await import("../seed");

      let existingOwner = await storage.getUserByUsername("demo_owner");
      if (!existingOwner) {
        logger.info("No demo_owner found, seeding full demo data");
        await seedDemoData();
        existingOwner = await storage.getUserByUsername("demo_owner");
      }

      if (existingOwner) {
        const ownerId = existingOwner.ownerId;
        const hotelId = existingOwner.hotelId;
        const propertyId = existingOwner.propertyId;

        if (ownerId) {
          const ownerRecord = await storage.getOwner(ownerId);
          if (!ownerRecord) {
            logger.info("Demo owner record missing, re-seeding");
            await seedDemoData();
          }
        }

        if (hotelId) {
          const hotelRecord = await storage.getHotel(hotelId);
          if (!hotelRecord) {
            logger.info("Demo hotel record missing, re-seeding");
            const owner = ownerId ? await storage.getOwner(ownerId) : null;
            const hotel = await storage.createHotel({
              name: "Grand Riviera Resort & Spa",
              address: "123 Oceanview Boulevard, Miami Beach, FL 33139",
              phone: "+14155550101",
              email: "info@grandriviera.com",
              ownerId: ownerId || "",
              totalRooms: 50,
              country: "United States",
              city: "Miami Beach",
              starRating: "5",
            });
            logger.info({ hotelId: hotel.id }, "Recreated demo hotel");
          }
        }

        if (propertyId) {
          const properties = await storage.getPropertiesByOwner(ownerId || "");
          if (properties.length === 0) {
            logger.info("Demo property missing, re-creating");
            const prop = await storage.createProperty({
              name: "Grand Riviera Resort & Spa",
              ownerId: ownerId || "",
              type: "resort",
              address: "123 Oceanview Boulevard, Miami Beach, FL 33139",
              phone: "+14155550101",
              email: "info@grandriviera.com",
              country: "United States",
              city: "Miami Beach",
              timezone: "America/New_York",
            });
            logger.info({ propertyId: prop.id }, "Recreated demo property");
          } else {
            const units = await storage.getUnitsByProperty(propertyId);
            if (units.length === 0) {
              logger.info("Demo units missing, re-creating rooms");
              const roomTypes = [
                { unitNumber: "101", unitCategory: "accommodation", unitType: "standard", status: "available", floor: 1, pricePerNight: 15000, capacity: 2 },
                { unitNumber: "102", unitCategory: "accommodation", unitType: "standard", status: "available", floor: 1, pricePerNight: 15000, capacity: 2 },
                { unitNumber: "201", unitCategory: "accommodation", unitType: "deluxe", status: "available", floor: 2, pricePerNight: 25000, capacity: 3 },
                { unitNumber: "202", unitCategory: "accommodation", unitType: "deluxe", status: "occupied", floor: 2, pricePerNight: 25000, capacity: 3 },
                { unitNumber: "301", unitCategory: "accommodation", unitType: "suite", status: "available", floor: 3, pricePerNight: 45000, capacity: 4 },
                { unitNumber: "302", unitCategory: "accommodation", unitType: "presidential_suite", status: "maintenance", floor: 3, pricePerNight: 75000, capacity: 4 },
              ];
              for (const room of roomTypes) {
                await storage.createUnit({
                  propertyId,
                  ownerId: ownerId || "",
                  unitNumber: room.unitNumber,
                  unitCategory: room.unitCategory,
                  unitType: room.unitType,
                  status: room.status,
                  floor: room.floor,
                  pricePerNight: room.pricePerNight,
                  capacity: room.capacity,
                  amenities: ["wifi", "tv", "minibar", "safe"],
                });
              }
              logger.info({ count: roomTypes.length }, "Recreated demo rooms");
            }
          }
        }
      }

      if (role !== "owner") {
        await ensureDemoUser(role);
      }

      let user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(500).json({ message: "Failed to create demo environment" });
      }

      const demoUserIds = await Promise.all(
        Object.values(DEMO_ROLE_MAP).map(async (uname) => {
          const u = await storage.getUserByUsername(uname);
          return u?.id;
        })
      );
      const validIds = demoUserIds.filter(Boolean) as string[];
      if (validIds.length > 0) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const ph = (offset = 0) => validIds.map((_, i) => `$${i + 1 + offset}`).join(", ");

          const demoBookingRows = await client.query(
            `SELECT id FROM bookings WHERE guest_id IN (${ph()})`,
            validIds
          );
          const demoBookingIds = demoBookingRows.rows.map((r: any) => r.id);
          const bph = demoBookingIds.length > 0
            ? demoBookingIds.map((_: any, i: number) => `$${i + 1}`).join(", ")
            : null;

          await client.query(
            `DELETE FROM chat_messages WHERE sender_id IN (${ph()}) OR guest_id IN (${ph(validIds.length)})`,
            [...validIds, ...validIds]
          );
          await client.query(
            `DELETE FROM service_requests WHERE guest_id IN (${ph()})`,
            validIds
          );
          await client.query(
            `DELETE FROM notifications WHERE user_id IN (${ph()})`,
            validIds
          );
          await client.query(
            `DELETE FROM door_action_logs WHERE guest_id IN (${ph()})`,
            validIds
          );
          await client.query(
            `DELETE FROM credential_logs WHERE guest_id IN (${ph()})`,
            validIds
          );
          await client.query(
            `DELETE FROM room_preparation_orders WHERE guest_id IN (${ph()})`,
            validIds
          );
          await client.query(
            `DELETE FROM no_show_records WHERE guest_id IN (${ph()})`,
            validIds
          );
          await client.query(
            `DELETE FROM audit_logs WHERE user_id IN (${ph()})`,
            validIds
          );

          if (bph) {
            await client.query(
              `DELETE FROM service_requests WHERE booking_id IN (${bph})`,
              demoBookingIds
            );
            await client.query(
              `DELETE FROM door_action_logs WHERE booking_id IN (${bph})`,
              demoBookingIds
            );
            await client.query(
              `DELETE FROM no_show_records WHERE booking_id IN (${bph})`,
              demoBookingIds
            );
            await client.query(
              `DELETE FROM room_settings WHERE booking_id IN (${bph})`,
              demoBookingIds
            );
          }

          await client.query(
            `DELETE FROM bookings WHERE guest_id IN (${ph()})`,
            validIds
          );

          await client.query("COMMIT");
          logger.info({ userCount: validIds.length }, "Cleaned up previous demo data");
        } catch (cleanupErr) {
          await client.query("ROLLBACK");
          logger.error({ err: cleanupErr }, "Demo cleanup transaction failed, rolled back");
        } finally {
          client.release();
        }
      }

      if (role === "guest" && user) {
        const ownerUser = await storage.getUserByUsername("demo_owner");
        const propertyId = user.propertyId || ownerUser?.propertyId || null;
        const ownerId = user.ownerId || ownerUser?.ownerId || null;
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        await storage.createBooking({
          guestId: user.id,
          roomNumber: "202",
          roomType: "deluxe",
          checkInDate: yesterday,
          checkOutDate: tomorrow,
          status: "booked",
          numberOfGuests: 2,
          specialRequests: "Extra pillows, late checkout if possible",
          nightlyRate: 25000,
          totalPrice: 50000,
          currency: "USD",
          ownerId: ownerId,
          propertyId: propertyId,
        });
        logger.info({ username: user.username }, "Created fresh demo booking for guest");
      }

      const demoSessionTenantId = `demo_session_${crypto.randomUUID()}`;

      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.demoSessionTenantId = demoSessionTenantId;
      req.session.touch();

      req.session.save((err) => {
        if (err) {
          logger.error({ err }, "Session save error during demo login");
          return res.status(500).json({ error: "session" });
        }
        logger.debug({ userId: user.id, role: user.role }, "Session saved after demo login");
        const { password: _pw, ...userWithoutPassword } = user;
        res.setHeader("Cache-Control", "no-store");
        res.json(userWithoutPassword);
      });
    } catch (error) {
      logger.error({ err: error }, "Demo login error");
      res.status(500).json({ message: "Demo login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const userId = req.session.userId;
    req.session.destroy((err) => {
      if (err) {
        logger.error({ err }, "Session destroy error");
      }
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
      });
      if (userId) {
        storage.createAuditLog({
          userId,
          action: "user_logout",
          entityType: "user",
          entityId: userId,
          description: "User logged out",
        }).catch(() => {});
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post("/api/auth/forgot-password", authRateLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (user) {
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await storage.createPasswordResetToken({
          userId: user.id,
          token,
          expiresAt,
        });

        sendPasswordResetEmail({
          to: email,
          resetToken: token,
          userName: user.fullName || user.username,
        }).catch((err) => logger.error({ err }, "Failed to send password reset email"));
      }

      res.json({ message: "If an account exists with this email, reset instructions have been sent." });
    } catch (error) {
      logger.error({ err: error }, "Forgot password error");
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  app.post("/api/auth/reset-password", authRateLimiter, async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.usedAt || new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      await storage.markPasswordResetTokenUsed(resetToken.id);

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      logger.error({ err: error }, "Reset password error");
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.get("/api/auth/me", authenticateRequest, async (req, res) => {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password: _pw, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.patch("/api/auth/language", requireAuth, async (req, res) => {
    try {
      const { language } = req.body;
      if (!language || typeof language !== "string") {
        return res.status(400).json({ message: "Language is required" });
      }
      const supportedLanguages = ["en", "az", "ar", "tr", "de", "es", "nl"];
      if (!supportedLanguages.includes(language)) {
        return res.status(400).json({ message: "Unsupported language" });
      }
      const user = await storage.updateUserLanguage(req.session.userId!, language);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      logger.error({ err: error }, "Error updating language");
      res.status(500).json({ message: "Failed to update language" });
    }
  });

  app.post("/api/auth/register-hotel", authRateLimiter, async (req, res) => {
    try {
      const validatedData = hotelRegistrationSchema.parse(req.body);
      const { username, password, fullName, email, role, hotelData, planCode: requestedPlanCode } = validatedData;

      if (username.toLowerCase().startsWith("demo_")) {
        return res.status(400).json({ message: "This username prefix is reserved." });
      }

      const staffRole = role === "reception" ? "reception" : "admin";
      
      const previousUserId = req.session?.userId || null;
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const owner = await storage.createOwner({
        name: fullName,
        email: email || hotelData.email,
        phone: hotelData.phone || null,
        companyName: hotelData.name,
        country: hotelData.country || null,
        city: hotelData.city || null,
        address: hotelData.address || null,
      });

      const property = await storage.createProperty({
        ownerId: owner.id,
        name: hotelData.name,
        type: "hotel",
        address: hotelData.address || null,
        phone: hotelData.phone || null,
        email: hotelData.email || null,
        country: hotelData.country || null,
        city: hotelData.city || null,
        postalCode: hotelData.postalCode || null,
        website: hotelData.website || null,
        starRating: hotelData.starRating || null,
        totalUnits: hotelData.totalRooms || null,
        numberOfFloors: hotelData.numberOfFloors || null,
        buildingType: hotelData.buildingType || null,
        primaryGuestType: hotelData.primaryGuestType || null,
        hasSmartDevices: hotelData.hasSmartDevices || false,
        smartDoorLocks: hotelData.smartDoorLocks || false,
        smartHvac: hotelData.smartHvac || false,
        smartLighting: hotelData.smartLighting || false,
        pmsSystem: hotelData.pmsSystem || false,
        bmsSystem: hotelData.bmsSystem || false,
        iotSensors: hotelData.iotSensors || false,
        pmsSoftware: hotelData.pmsSoftware || null,
        pmsOther: hotelData.pmsOther || null,
        expectedSmartRoomCount: hotelData.expectedSmartRoomCount || null,
        billingCurrency: hotelData.billingCurrency || null,
        billingContactEmail: hotelData.billingContactEmail || null,
      });

      const validPlanCodes = Object.keys(PLAN_CODE_FEATURES);
      const resolvedPlanCode = requestedPlanCode && validPlanCodes.includes(requestedPlanCode)
        ? requestedPlanCode
        : "CORE_STARTER";

      const CODE_TO_PLAN_TYPE: Record<string, PlanType> = Object.fromEntries(
        Object.entries(PLAN_TYPE_TO_CODE).map(([pt, pc]) => [pc, pt as PlanType])
      ) as Record<string, PlanType>;
      const resolvedPlanType: PlanType = CODE_TO_PLAN_TYPE[resolvedPlanCode] || "starter";

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);
      const planDefaults = applyPlanFeatures(resolvedPlanType);
      await storage.createSubscription({
        ownerId: owner.id,
        planType: "trial",
        planCode: resolvedPlanCode,
        ...planDefaults,
        trialEndsAt,
      });

      const hotel = await storage.createHotel({
        name: hotelData.name,
        address: hotelData.address || null,
        phone: hotelData.phone || null,
        email: hotelData.email || null,
        country: hotelData.country || null,
        city: hotelData.city || null,
        postalCode: hotelData.postalCode || null,
        website: hotelData.website || null,
        starRating: hotelData.starRating || null,
        totalRooms: hotelData.totalRooms || null,
        numberOfFloors: hotelData.numberOfFloors || null,
        buildingType: hotelData.buildingType || null,
        primaryGuestType: hotelData.primaryGuestType || null,
        hasSmartDevices: hotelData.hasSmartDevices || false,
        smartDoorLocks: hotelData.smartDoorLocks || false,
        smartHvac: hotelData.smartHvac || false,
        smartLighting: hotelData.smartLighting || false,
        pmsSystem: hotelData.pmsSystem || false,
        bmsSystem: hotelData.bmsSystem || false,
        iotSensors: hotelData.iotSensors || false,
        pmsSoftware: hotelData.pmsSoftware || null,
        pmsOther: hotelData.pmsOther || null,
        expectedSmartRoomCount: hotelData.expectedSmartRoomCount || null,
        billingCurrency: hotelData.billingCurrency || null,
        billingContactEmail: hotelData.billingContactEmail || null,
        ownerId: owner.id,
        propertyId: property.id,
      });
      
      const hashedRegPw = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedRegPw,
        fullName,
        email: email || hotelData.email || null,
        role: staffRole === "reception" ? "reception" : "owner_admin",
        hotelId: hotel.id,
        ownerId: owner.id,
        propertyId: property.id,
      });
      
      req.session.userId = user.id;
      req.session.role = user.role;
      delete req.session.demoSessionTenantId;
      req.session.touch();

      if (previousUserId) {
        const previousUser = await storage.getUser(previousUserId);
        if (previousUser && !previousUser.hotelId) {
          await storage.updateUser(previousUser.id, {
            hotelId: hotel.id,
            ownerId: owner.id,
            propertyId: property.id,
          });
        }
      }
      
      logger.info({ hotelName: hotelData.name }, "Hotel registered successfully");

      const recipientEmail = email || hotelData.email;
      if (recipientEmail) {
        try {
          const emailResult = await sendHotelWelcomeEmail({
            to: recipientEmail,
            ownerName: fullName,
            hotelName: hotelData.name,
          });
          if (emailResult.success) {
            logger.info({ to: recipientEmail }, "Welcome email sent");
          } else {
            logger.error({ error: emailResult.error }, "Welcome email failed");
          }
        } catch (emailError) {
          logger.error({ err: emailError }, "Welcome email failed");
        }
      }

      req.session.save((saveErr) => {
        if (saveErr) {
          logger.error({ err: saveErr }, "Session save error during hotel registration");
          return res.status(500).json({ error: "session" });
        }
        logger.debug({ userId: user.id, role: user.role }, "Session saved after hotel registration");
        const { password: _, ...userWithoutPassword } = user;
        res.setHeader("Cache-Control", "no-store");
        res.json({ user: userWithoutPassword, hotel, owner, property });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      logger.error({ err: error }, "Hotel registration error");
      res.status(500).json({ message: "Failed to register hotel" });
    }
  });
}
