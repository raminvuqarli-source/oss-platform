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
import { createDemoToken } from "../demoTokenStore";

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
    isChannexEnabled: z.boolean().optional().default(false),
    channexPropertyUuid: z.string().optional(),
    channexRoomCount: z.coerce.number().int().positive().optional(),
    totalMonthlySubscriptionFee: z.coerce.number().nonnegative().optional(),
  }),
  // Marketing referral fields
  referral: z.object({
    source: z.enum(["google", "instagram", "linkedin", "event", "staff_referral", "existing_client", "other"]),
    staffReferralCode: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
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
    name: "oss.sid",
    resave: false,
    saveUninitialized: false,
    rolling: false,
    proxy: isProduction,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
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
    "/api/webhooks/channex",
    "/api/public",
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
    housekeeping: "demo_housekeeping",
    kitchen: "demo_kitchen",
    maintenance: "demo_maintenance",
    restaurant_manager: "demo_restaurant_manager",
    waiter: "demo_waiter",
    restaurant_cleaner: "demo_restaurant_cleaner",
    restaurant_cashier: "demo_restaurant_cashier",
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
          try {
            const ownerRecord = await storage.getOwner(ownerId);
            if (!ownerRecord) {
              logger.info("Demo owner record missing, re-seeding");
              await seedDemoData();
            }
          } catch (ownerErr: any) {
            logger.error({ err: ownerErr?.message, step: "getOwner" }, "Demo login step failed");
            throw ownerErr;
          }
        }

        if (hotelId) {
          let hotelRecord: any;
          try {
            hotelRecord = await storage.getHotel(hotelId);
          } catch (hotelErr: any) {
            logger.error({ err: hotelErr?.message, step: "getHotel", hotelId }, "Demo login step failed");
            throw hotelErr;
          }
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

        // Always check by ownerId (not propertyId) so re-seed works even after cleanup sets propertyId=null
        if (ownerId) {
          const properties = await storage.getPropertiesByOwner(ownerId);
          if (properties.length === 0) {
            logger.info("Demo property missing, re-creating");
            const prop = await storage.createProperty({
              name: "Grand Riviera Resort & Spa",
              ownerId: ownerId,
              type: "resort",
              address: "123 Oceanview Boulevard, Miami Beach, FL 33139",
              phone: "+14155550101",
              email: "info@grandriviera.com",
              country: "United States",
              city: "Miami Beach",
              timezone: "America/New_York",
            });
            // Assign fresh propertyId to all demo users under this owner
            await pool.query(
              `UPDATE users SET property_id = $1 WHERE owner_id = $2`,
              [prop.id, ownerId]
            );
            // Create demo rooms in the new property
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
                propertyId: prop.id,
                ownerId,
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
            logger.info({ propertyId: prop.id, rooms: roomTypes.length }, "Recreated demo property with rooms");
          } else {
            // Property exists — check if rooms are present
            const activePropertyId = properties[0].id;
            const units = await storage.getUnitsByProperty(activePropertyId);
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
                  propertyId: activePropertyId,
                  ownerId,
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
          const ph = (offset = 0) => validIds.map((_, i) => `$${i + 1 + offset}`).join(", ");

          // credential_logs may not exist on older VPS — delete separately before transaction
          try {
            await client.query(
              `DELETE FROM credential_logs WHERE guest_id IN (${ph()})`,
              validIds
            );
          } catch (credCleanErr) {
            logger.warn({ err: credCleanErr }, "credential_logs demo cleanup skipped (table may not exist yet)");
          }

          await client.query("BEGIN");

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

          // Clean up extra staff users created during previous demo sessions
          if (existingOwner?.ownerId) {
            const demoUsernames = Object.values(DEMO_ROLE_MAP);
            const usernamesPh = demoUsernames.map((_: string, i: number) => `$${i + 2}`).join(", ");
            await client.query(
              `DELETE FROM users WHERE owner_id = $1 AND username NOT IN (${usernamesPh})`,
              [existingOwner.ownerId, ...demoUsernames]
            );
          }

          // Clean up extra properties created during previous demo sessions
          // Strategy: keep the OLDEST property (the original seed), delete all others
          if (existingOwner?.ownerId) {
            const demoOwnerId = existingOwner.ownerId;

            // Find the oldest property (original demo property)
            const oldestPropResult = await client.query(
              `SELECT id FROM properties WHERE owner_id = $1 ORDER BY created_at ASC LIMIT 1`,
              [demoOwnerId]
            );
            const originalPropId: string | null = oldestPropResult.rows[0]?.id ?? null;

            // Find all extra (non-original) properties
            const extraPropsResult = originalPropId
              ? await client.query(
                  `SELECT id FROM properties WHERE owner_id = $1 AND id != $2`,
                  [demoOwnerId, originalPropId]
                )
              : await client.query(
                  `SELECT id FROM properties WHERE owner_id = $1`,
                  [demoOwnerId]
                );
            const extraPropIds: string[] = extraPropsResult.rows.map((r: any) => r.id);

            if (extraPropIds.length > 0) {
              const epph = extraPropIds.map((_: any, i: number) => `$${i + 1}`).join(", ");
              // Delete POS / restaurant data for extra properties
              try {
                await client.query(`DELETE FROM pos_order_items WHERE order_id IN (SELECT id FROM pos_orders WHERE property_id IN (${epph}))`, extraPropIds);
                await client.query(`DELETE FROM pos_orders WHERE property_id IN (${epph})`, extraPropIds);
                await client.query(`DELETE FROM pos_menu_items WHERE property_id IN (${epph})`, extraPropIds);
                await client.query(`DELETE FROM pos_menu_categories WHERE property_id IN (${epph})`, extraPropIds);
                await client.query(`DELETE FROM waiter_calls WHERE property_id IN (${epph})`, extraPropIds);
                await client.query(`DELETE FROM restaurant_cleaning_tasks WHERE property_id IN (${epph})`, extraPropIds);
                await client.query(`DELETE FROM restaurant_staff_profiles WHERE property_id IN (${epph})`, extraPropIds);
              } catch (_posErr) { /* tables may not exist yet on older deployments */ }
              await client.query(`DELETE FROM bookings WHERE property_id IN (${epph})`, extraPropIds);
              await client.query(`DELETE FROM units WHERE property_id IN (${epph})`, extraPropIds);
              // Point any staff reassigned to extra properties back to original
              if (originalPropId) {
                const updateEpph = extraPropIds.map((_: any, i: number) => `$${i + 3}`).join(", ");
                await client.query(
                  `UPDATE users SET property_id = $1 WHERE owner_id = $2 AND property_id IN (${updateEpph})`,
                  [originalPropId, demoOwnerId, ...extraPropIds]
                );
              }
              await client.query(`DELETE FROM properties WHERE id IN (${epph})`, extraPropIds);
              logger.info({ count: extraPropIds.length }, "Cleaned up extra demo properties");
            }

            // Reset the original property name/address back to demo defaults
            if (originalPropId) {
              await client.query(
                `UPDATE properties SET name = $1, address = $2, type = $3 WHERE id = $4`,
                ["Grand Riviera Resort & Spa", "123 Oceanview Boulevard, Miami Beach, FL 33139", "resort", originalPropId]
              );
              // Also ensure all demo users point to the original property
              await client.query(
                `UPDATE users SET property_id = $1 WHERE owner_id = $2 AND (property_id IS NULL OR property_id != $1)`,
                [originalPropId, demoOwnerId]
              );
              // Reset rooms: wipe all bookings + units for original property, then recreate fresh 6
              await client.query(`DELETE FROM bookings WHERE property_id = $1`, [originalPropId]);
              await client.query(`DELETE FROM units WHERE property_id = $1`, [originalPropId]);
              const demoRooms = [
                ["101", "accommodation", "standard",           "available",   1, 15000, 2],
                ["102", "accommodation", "standard",           "available",   1, 15000, 2],
                ["201", "accommodation", "deluxe",             "available",   2, 25000, 3],
                ["202", "accommodation", "deluxe",             "occupied",    2, 25000, 3],
                ["301", "accommodation", "suite",              "available",   3, 45000, 4],
                ["302", "accommodation", "presidential_suite", "maintenance", 3, 75000, 4],
              ];
              for (const [un, uc, ut, st, fl, ppn, cap] of demoRooms) {
                await client.query(
                  `INSERT INTO units (id, property_id, owner_id, unit_number, unit_category, unit_type, status, floor, price_per_night, capacity, amenities)
                   VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, ARRAY['wifi','tv','minibar','safe'])`,
                  [originalPropId, demoOwnerId, un, uc, ut, st, fl, ppn, cap]
                );
              }
              logger.info({ propertyId: originalPropId }, "Reset demo property name and rooms");
            }
          }

          await client.query("COMMIT");
          logger.info({ userCount: validIds.length }, "Cleaned up previous demo data");
        } catch (cleanupErr) {
          await client.query("ROLLBACK");
          logger.error({ err: cleanupErr }, "Demo cleanup transaction failed, rolled back");
        } finally {
          client.release();
        }
      }

      // ─── Recreate fresh demo data after every login cleanup ───────────────
      try {
        if (existingOwner?.ownerId && existingOwner?.hotelId) {
          const demoOwnerId = existingOwner.ownerId;
          const demoHotelId = existingOwner.hotelId;
          const demoProperties = await storage.getPropertiesByOwner(demoOwnerId);
          const demoPropId = demoProperties[0]?.id;
          const DEMO_TENANT = demoOwnerId;

          if (demoPropId) {
            const [guest1, guest2, restCleanerUser, restMgrUser, waiterUser] = await Promise.all([
              storage.getUserByUsername("demo_guest1"),
              storage.getUserByUsername("demo_guest2"),
              storage.getUserByUsername("demo_restaurant_cleaner"),
              storage.getUserByUsername("demo_restaurant_manager"),
              storage.getUserByUsername("demo_waiter"),
            ]);

            const today2 = new Date();
            const yesterday2 = new Date(today2); yesterday2.setDate(today2.getDate() - 1);
            const tomorrow2 = new Date(today2); tomorrow2.setDate(today2.getDate() + 1);
            const nextWeek2 = new Date(today2); nextWeek2.setDate(today2.getDate() + 7);

            // Recreate bookings
            let booking1: any = null;
            if (guest1) {
              booking1 = await storage.createBooking({
                guestId: guest1.id, roomNumber: "202", roomType: "deluxe",
                checkInDate: yesterday2, checkOutDate: tomorrow2,
                status: "checked_in", numberOfGuests: 2,
                specialRequests: "Extra yastıq, gec yoxlama",
                nightlyRate: 25000, totalPrice: 50000, currency: "USD",
                ownerId: demoOwnerId, propertyId: demoPropId,
              });
              await storage.createRoomSettings({
                bookingId: booking1.id, temperature: 22, lightsOn: true,
                lightsBrightness: 70, curtainsOpen: true, jacuzziOn: false,
                jacuzziTemperature: 38, welcomeMode: false,
              });
            }
            if (guest2) {
              await storage.createBooking({
                guestId: guest2.id, roomNumber: "301", roomType: "suite",
                checkInDate: tomorrow2, checkOutDate: nextWeek2,
                status: "confirmed", numberOfGuests: 3,
                specialRequests: "Hava limanından transfer",
                nightlyRate: 45000, totalPrice: 270000, currency: "USD",
                ownerId: demoOwnerId, propertyId: demoPropId,
              });
            }

            // Recreate service requests
            if (guest1 && booking1) {
              await storage.createServiceRequest({
                guestId: guest1.id, bookingId: booking1.id,
                roomNumber: "202", requestType: "housekeeping",
                description: "Extra towels requested for room 202",
                status: "in_progress", priority: "medium",
                ownerId: demoOwnerId, propertyId: demoPropId,
              });
              await storage.createServiceRequest({
                guestId: guest1.id, bookingId: booking1.id,
                roomNumber: "202", requestType: "room_service",
                description: "Deliver breakfast to room 202 at 08:00",
                status: "pending", priority: "normal",
                ownerId: demoOwnerId, propertyId: demoPropId,
              });
            }

            // Recreate role-appropriate notifications for each demo user
            const hotelRoleUsernames = [
              DEMO_ROLE_MAP.owner, DEMO_ROLE_MAP.admin, DEMO_ROLE_MAP.reception,
              DEMO_ROLE_MAP.housekeeping, DEMO_ROLE_MAP.maintenance,
            ];
            const restaurantRoleUsernames = [
              DEMO_ROLE_MAP.restaurant_manager, DEMO_ROLE_MAP.waiter,
              DEMO_ROLE_MAP.kitchen, DEMO_ROLE_MAP.restaurant_cleaner, DEMO_ROLE_MAP.restaurant_cashier,
            ];

            // Hotel staff: booking + service request notifications
            for (const uname of hotelRoleUsernames) {
              const u = await storage.getUserByUsername(uname);
              if (!u) continue;
              await storage.createNotification({
                userId: u.id,
                title: "New Booking",
                message: `Michael Chen reserved room 301 for ${tomorrow2.toLocaleDateString("en-GB")} - ${nextWeek2.toLocaleDateString("en-GB")}`,
                type: "booking", read: false,
              });
              await storage.createNotification({
                userId: u.id,
                title: "Service Request",
                message: "Sarah Johnson (Room 202) requested extra towels",
                type: "service_request", read: false,
              });
            }

            // Restaurant staff: order + task notifications relevant to their role
            for (const uname of restaurantRoleUsernames) {
              const u = await storage.getUserByUsername(uname);
              if (!u) continue;
              await storage.createNotification({
                userId: u.id,
                title: "New Order",
                message: "Table 3 — Sarah Johnson: Steak, Lemonade x2, Tiramisu (₼87.00)",
                type: "info", read: false,
              });
              await storage.createNotification({
                userId: u.id,
                title: "Order Ready",
                message: "Table 7 — Michael Chen's order is ready, waiter needed",
                type: "info", read: false,
              });
            }

            // Ensure restaurant menu exists
            const existingMenuCats = await storage.getPosMenuCategories(demoPropId);
            if (existingMenuCats.length === 0) {
              const mc1 = await storage.createPosMenuCategory({ tenantId: DEMO_TENANT, propertyId: demoPropId, name: "Breakfast", sortOrder: 0 });
              const mc2 = await storage.createPosMenuCategory({ tenantId: DEMO_TENANT, propertyId: demoPropId, name: "Main Dishes", sortOrder: 1 });
              const mc3 = await storage.createPosMenuCategory({ tenantId: DEMO_TENANT, propertyId: demoPropId, name: "Drinks", sortOrder: 2 });
              const mc4 = await storage.createPosMenuCategory({ tenantId: DEMO_TENANT, propertyId: demoPropId, name: "Desserts", sortOrder: 3 });
              const menuItemDefs = [
                { categoryId: mc1.id, name: "Full English Breakfast", priceCents: 2500, description: "Eggs, sausage, toast" },
                { categoryId: mc1.id, name: "Pancakes", priceCents: 1800, description: "With maple syrup" },
                { categoryId: mc1.id, name: "Granola & Yogurt", priceCents: 1200, description: "With fresh fruit" },
                { categoryId: mc2.id, name: "Grilled Chicken", priceCents: 3500, description: "With mashed potato" },
                { categoryId: mc2.id, name: "Steak", priceCents: 5500, description: "With roasted vegetables" },
                { categoryId: mc2.id, name: "Grilled Fish", priceCents: 4200, description: "With lemon butter" },
                { categoryId: mc2.id, name: "Vegetarian Pasta", priceCents: 2800, description: "With seasonal vegetables" },
                { categoryId: mc3.id, name: "Lemonade", priceCents: 600, description: "Homemade" },
                { categoryId: mc3.id, name: "Tea", priceCents: 400, description: "With milk" },
                { categoryId: mc3.id, name: "Espresso", priceCents: 700, description: "Italian roast" },
                { categoryId: mc3.id, name: "Mineral Water", priceCents: 350, description: "0.5L" },
                { categoryId: mc4.id, name: "Chocolate Cake", priceCents: 1400, description: "With chocolate sauce" },
                { categoryId: mc4.id, name: "Ice Cream", priceCents: 900, description: "3 scoops" },
                { categoryId: mc4.id, name: "Tiramisu", priceCents: 1800, description: "Classic Italian" },
              ];
              for (const mi of menuItemDefs) {
                await storage.createPosMenuItem({ tenantId: DEMO_TENANT, propertyId: demoPropId, ...mi });
              }
              logger.info("Created demo restaurant menu (post-cleanup)");
            }

            // Ensure restaurant cleaning tasks exist
            const existingTasks = await storage.getRestaurantCleaningTasks(demoPropId);
            if (existingTasks.length === 0 && restCleanerUser && restMgrUser) {
              await storage.createRestaurantCleaningTask({ tenantId: DEMO_TENANT, propertyId: demoPropId, description: "Wipe down tables — East hall", location: "East Hall", assignedToId: restCleanerUser.id, createdById: restMgrUser.id, status: "pending" });
              await storage.createRestaurantCleaningTask({ tenantId: DEMO_TENANT, propertyId: demoPropId, description: "Mop kitchen floor", location: "Kitchen", assignedToId: restCleanerUser.id, createdById: restMgrUser.id, status: "in_progress" });
              await storage.createRestaurantCleaningTask({ tenantId: DEMO_TENANT, propertyId: demoPropId, description: "Disinfect bar area", location: "Bar", assignedToId: restCleanerUser.id, createdById: restMgrUser.id, status: "done" });
              logger.info("Created demo restaurant cleaning tasks (post-cleanup)");
            }

            // Ensure payroll configs exist for all demo staff
            const staffPayrollDefs = [
              { username: "demo_housekeeping", name: "Nina Torres", role: "staff", salary: 250000, tax: 0 },
              { username: "demo_maintenance", name: "Dave Park", role: "staff", salary: 270000, tax: 0 },
              { username: "demo_restaurant_manager", name: "Sofia Reyes", role: "restaurant_manager", salary: 480000, tax: 140 },
              { username: "demo_waiter", name: "Luca Bianchi", role: "waiter", salary: 280000, tax: 140 },
              { username: "demo_kitchen", name: "Carlos Mendez", role: "kitchen_staff", salary: 320000, tax: 140 },
              { username: "demo_restaurant_cleaner", name: "Ana Lima", role: "restaurant_cleaner", salary: 220000, tax: 0 },
              { username: "demo_restaurant_cashier", name: "Omar Faruk", role: "restaurant_cashier", salary: 300000, tax: 140 },
            ];
            for (const sp of staffPayrollDefs) {
              const su = await storage.getUserByUsername(sp.username);
              if (!su) continue;
              const existing = await storage.getPayrollConfigByStaff(su.id);
              if (!existing) {
                await storage.createPayrollConfig({
                  hotelId: demoHotelId, ownerId: demoOwnerId, propertyId: demoPropId,
                  staffId: su.id, staffName: sp.name, staffRole: sp.role,
                  baseSalary: sp.salary, frequency: "monthly", employeeTaxRate: sp.tax,
                });
              }
            }

            // Ensure fresh POS orders exist for restaurant demos
            const existingOrders = await storage.getPosOrders(demoPropId, { settlementStatus: "pending" });
            if (existingOrders.length === 0 && waiterUser) {
              await storage.createPosOrder({
                tenantId: DEMO_TENANT, propertyId: demoPropId,
                tableNumber: "3", guestName: "Sarah Johnson",
                orderType: "dine_in", waiterId: waiterUser.id,
                kitchenStatus: "cooking", settlementStatus: "pending", totalCents: 8700,
              }, [
                { itemName: "Biftek", quantity: 1, unitPriceCents: 5500, totalCents: 5500 },
                { itemName: "Limonad", quantity: 2, unitPriceCents: 600, totalCents: 1200 },
                { itemName: "Tiramisu", quantity: 1, unitPriceCents: 1800, totalCents: 1800 },
              ]);
              await storage.createPosOrder({
                tenantId: DEMO_TENANT, propertyId: demoPropId,
                tableNumber: "7", guestName: "Michael Chen",
                orderType: "dine_in", waiterId: waiterUser.id,
                kitchenStatus: "ready", settlementStatus: "pending", totalCents: 4550,
              }, [
                { itemName: "Qril Balıq", quantity: 1, unitPriceCents: 4200, totalCents: 4200 },
                { itemName: "Mineral Su", quantity: 1, unitPriceCents: 350, totalCents: 350 },
              ]);
              await storage.createPosOrder({
                tenantId: DEMO_TENANT, propertyId: demoPropId,
                roomNumber: "202", guestName: "Sarah Johnson",
                orderType: "room_service", waiterId: waiterUser.id,
                kitchenStatus: "delivered", settlementStatus: "pending", totalCents: 3900,
              }, [
                { itemName: "Grilled Chicken", quantity: 1, unitPriceCents: 3500, totalCents: 3500 },
                { itemName: "Tea", quantity: 1, unitPriceCents: 400, totalCents: 400 },
              ]);
              logger.info("Created demo POS orders (post-cleanup)");
            }
          }
        }
      } catch (demoRecreateErr) {
        logger.error({ err: demoRecreateErr }, "Failed to recreate demo data after cleanup — continuing anyway");
      }

      if (role === "guest" && user) {
        try {
          const ownerUser = await storage.getUserByUsername("demo_owner");
          const propertyId = user.propertyId || ownerUser?.propertyId || null;
          const ownerId = user.ownerId || ownerUser?.ownerId || null;
          const today = new Date();
          const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
          const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
          const demoBooking = await storage.createBooking({
            guestId: user.id,
            roomNumber: "202",
            roomType: "deluxe",
            checkInDate: yesterday,
            checkOutDate: tomorrow,
            status: "checked_in",
            numberOfGuests: 2,
            specialRequests: "Extra pillows, late checkout if possible",
            nightlyRate: 25000,
            totalPrice: 50000,
            currency: "USD",
            ownerId: ownerId,
            propertyId: propertyId,
          });
          await storage.createRoomSettings({
            bookingId: demoBooking.id,
            temperature: 22,
            lightsOn: true,
            lightsBrightness: 70,
            curtainsOpen: true,
            jacuzziOn: false,
            jacuzziTemperature: 38,
            welcomeMode: true,
          });
          logger.info({ username: user.username }, "Created fresh demo booking and room settings for guest");
        } catch (bookingErr: any) {
          logger.error({
            err: bookingErr,
            errMessage: bookingErr?.message,
            errCode: bookingErr?.code,
            guestId: user.id,
            username: user.username,
          }, "Failed to create demo guest booking — continuing with login anyway");
        }
      }

      const demoSessionTenantId = `demo_session_${crypto.randomUUID()}`;

      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.demoSessionTenantId = demoSessionTenantId;
      req.session.touch();

      const demoToken = createDemoToken(user.id, user.role, demoSessionTenantId);

      req.session.save((err) => {
        if (err) {
          logger.error({ err }, "Session save error during demo login");
          return res.status(500).json({ error: "session" });
        }
        logger.debug({ userId: user.id, role: user.role }, "Session saved after demo login");
        const { password: _pw, ...userWithoutPassword } = user;
        res.setHeader("Cache-Control", "no-store");
        res.json({ ...userWithoutPassword, _demoToken: demoToken });
      });
    } catch (error: any) {
      logger.error({ err: error?.message, stack: error?.stack, code: error?.code, detail: error?.detail }, "Demo login error");
      res.status(500).json({ message: "Demo login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const userId = req.session.userId;
    req.session.destroy((err) => {
      if (err) {
        logger.error({ err }, "Session destroy error");
      }
      res.clearCookie("oss.sid", {
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

        const emailResult = await sendPasswordResetEmail({
          to: email,
          resetToken: token,
          userName: user.fullName || user.username,
        });
        if (!emailResult.success) {
          logger.error({ error: emailResult.error }, "Password reset email delivery failed");
          return res.status(500).json({
            message: "Your account was found but the reset email could not be delivered. Please contact support.",
            debug: process.env.NODE_ENV !== "production" ? emailResult.error : undefined,
          });
        }
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
    // Resolve owner tenantType so frontend can distinguish hotel vs standalone restaurant
    let tenantType: string | null = null;
    try {
      const ownerId = (user as any).ownerId;
      if (ownerId) {
        const owner = await storage.getOwner(ownerId);
        tenantType = (owner as any)?.tenantType ?? null;
      }
    } catch {}
    res.json({ ...userWithoutPassword, tenantType });
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
      const { username, password, fullName, email, role, hotelData, planCode: requestedPlanCode, referral } = validatedData;

      if (username.toLowerCase().startsWith("demo_")) {
        return res.status(400).json({ message: "This username prefix is reserved." });
      }

      const staffRole = role === "reception" ? "reception" : "admin";
      
      const previousUserId = req.session?.userId || null;
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Resolve referral staff if a referral code was provided
      let referralStaffId: string | null = null;
      if (referral?.source === "staff_referral" && referral.staffReferralCode) {
        const staffMember = await storage.getUserByReferralCode(referral.staffReferralCode.trim().toUpperCase());
        if (!staffMember) {
          return res.status(400).json({ message: "Invalid staff referral code. Please check the code and try again." });
        }
        referralStaffId = staffMember.id;
      }
      
      const owner = await storage.createOwner({
        name: fullName,
        email: email || hotelData.email,
        phone: hotelData.phone || null,
        companyName: hotelData.name,
        country: hotelData.country || null,
        city: hotelData.city || null,
        address: hotelData.address || null,
        referralSource: referral?.source || null,
        referralStaffId: referralStaffId || null,
        referralNotes: referral?.notes || null,
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

      // Check if this email previously had a trial that was deleted (abuse prevention)
      const registrantEmail = (email || hotelData.email || "").toLowerCase();
      const isAbuseEmail = registrantEmail ? await storage.isTrialEmailDeleted(registrantEmail) : false;

      const trialEndsAt = new Date();
      if (!isAbuseEmail) {
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);
      }
      // If abuse detected: subscription starts as "active" (paid required immediately) with no trial
      const planType: PlanType = isAbuseEmail ? resolvedPlanType : "trial";
      const planDefaults = applyPlanFeatures(resolvedPlanType);
      await storage.createSubscription({
        ownerId: owner.id,
        planType,
        planCode: resolvedPlanCode,
        ...planDefaults,
        trialEndsAt: isAbuseEmail ? null : trialEndsAt,
        isActive: !isAbuseEmail,
        status: isAbuseEmail ? "expired" : "trial",
      } as any);

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
        isChannexEnabled: hotelData.isChannexEnabled || false,
        channexPropertyUuid: hotelData.channexPropertyUuid || null,
        channexRoomCount: hotelData.channexRoomCount || null,
        channexAddonPrice: (() => {
          if (!hotelData.isChannexEnabled) return null;
          if (resolvedPlanCode === "CORE_PRO") return Math.max(50, 2 * (hotelData.channexRoomCount || 25));
          if (resolvedPlanCode === "CORE_GROWTH") return 30;
          return 20;
        })(),
        totalMonthlySubscriptionFee: hotelData.totalMonthlySubscriptionFee
          ? String(hotelData.totalMonthlySubscriptionFee)
          : null,
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

      // Create referral commission record if a valid staff referral was made
      if (referralStaffId) {
        storage.createReferralCommission({
          staffUserId: referralStaffId,
          ownerId: owner.id,
          status: "pending",
        }).catch((err) => logger.error({ err }, "Failed to create referral commission"));
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

  // ======== RESTAURANT-ONLY REGISTRATION ========
  const restaurantRegistrationSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Valid email is required"),
    planCode: z.enum(["REST_CAFE", "REST_BISTRO", "REST_CHAIN"]).optional().default("REST_CAFE"),
    restaurantData: z.object({
      name: z.string().min(2, "Restaurant name is required"),
      city: z.string().optional(),
      phone: z.string().optional(),
      country: z.string().optional(),
      address: z.string().optional(),
      tableCount: z.number().optional(),
    }),
  });

  app.post("/api/auth/register-restaurant", authRateLimiter, async (req, res) => {
    try {
      const validated = restaurantRegistrationSchema.parse(req.body);
      const { username, password, fullName, email, planCode, restaurantData } = validated;

      if (username.toLowerCase().startsWith("demo_")) {
        return res.status(400).json({ message: "This username prefix is reserved." });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const owner = await storage.createOwner({
        name: fullName,
        email,
        phone: restaurantData.phone || null,
        companyName: restaurantData.name,
        country: restaurantData.country || null,
        city: restaurantData.city || null,
        address: restaurantData.address || null,
        tenantType: "restaurant_only",
      } as any);

      const property = await storage.createProperty({
        ownerId: owner.id,
        name: restaurantData.name,
        type: "restaurant",
        address: restaurantData.address || null,
        phone: restaurantData.phone || null,
        email: email || null,
        country: restaurantData.country || null,
        city: restaurantData.city || null,
      });

      // Minimal hotel record needed for tenant resolution compatibility
      const hotel = await storage.createHotel({
        name: restaurantData.name,
        address: restaurantData.address || null,
        phone: restaurantData.phone || null,
        email: email || null,
        country: restaurantData.country || null,
        city: restaurantData.city || null,
        ownerId: owner.id,
        propertyId: property.id,
      } as any);

      const planCodeResolved = planCode || "REST_CAFE";
      const CODE_TO_PLAN_TYPE: Record<string, PlanType> = {
        REST_CAFE: "restaurant_cafe",
        REST_BISTRO: "restaurant_bistro",
        REST_CHAIN: "restaurant_chain",
      };
      const planType: PlanType = CODE_TO_PLAN_TYPE[planCodeResolved] || "restaurant_cafe";
      const planDefaults = applyPlanFeatures("starter"); // use starter defaults for limits

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);
      await storage.createSubscription({
        ownerId: owner.id,
        planType: "trial",
        planCode: planCodeResolved,
        ...planDefaults,
        trialEndsAt,
        isActive: false,
        status: "trial",
      } as any);

      const hashedPw = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPw,
        fullName,
        email: email || null,
        role: "owner_admin",
        hotelId: hotel.id,
        ownerId: owner.id,
        propertyId: property.id,
      });

      req.session.userId = user.id;
      req.session.role = user.role;
      delete req.session.demoSessionTenantId;

      req.session.save((saveErr) => {
        if (saveErr) {
          logger.error({ err: saveErr }, "Session save error during restaurant registration");
          return res.status(500).json({ error: "session" });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.setHeader("Cache-Control", "no-store");
        res.json({ user: userWithoutPassword, hotel, owner, property });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      logger.error({ err: error }, "Restaurant registration error");
      res.status(500).json({ message: "Failed to register restaurant" });
    }
  });
}
