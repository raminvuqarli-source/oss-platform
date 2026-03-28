import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { asString } from "../utils/request";
import { logger } from "../utils/logger";
import {
  unitCategoryTypes, hotels, type User, type UnitCategory,
  units, devices, bookings, serviceRequests, chatMessages,
  doorActionLogs, roomSettings, roomPreparationOrders,
  noShowRecords, auditLogs, analyticsSnapshots, staffInvitations,
  revenues, expenses, payrollConfigs, payrollEntries, cashAccounts,
  recurringExpenses, escalations, escalationReplies, credentialLogs,
  properties, users,
} from "@shared/schema";
import { db } from "../db";
import { eq, inArray } from "drizzle-orm";
import { requireAuth, requireRole, requireFeature, requirePropertyLimit, requireUnitLimit } from "../middleware";
import { applyPlanFeatures } from "@shared/planFeatures";
import { getJobQueue } from "../services/jobQueue";
import { enqueueOtaSync } from "../workers/otaSyncWorker";
import { validateBody } from "../middleware/validateBody";
import { createUnitSchema, updateUnitSchema } from "../validators/unit.validators";

export function registerTenantRoutes(app: Express): void {
  // ===================== MULTI-TENANT MANAGEMENT ROUTES =====================

  // Helper: check if user is owner_admin for a given ownerId
  function isOwnerOrAdmin(user: User, ownerId?: string): boolean {
    if (user.role === "oss_super_admin") return true;
    if (user.role === "owner_admin" && user.ownerId === ownerId) return true;
    return false;
  }

  // Owner: Get own owner profile
  app.get("/api/owners/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) {
        return res.status(404).json({ message: "No owner profile found" });
      }
      const owner = await storage.getOwner(user.ownerId);
      if (!owner) {
        return res.status(404).json({ message: "Owner not found" });
      }
      res.json(owner);
    } catch (error) {
      logger.error({ err: error }, "Failed to fetch owner profile");
      res.status(500).json({ message: "Failed to fetch owner profile" });
    }
  });

  // Owner: Update own profile
  app.patch("/api/owners/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId || !["owner_admin", "oss_super_admin"].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      const updated = await storage.updateOwner(user.ownerId, req.body);
      res.json(updated);
    } catch (error) {
      logger.error({ err: error }, "Failed to update owner profile");
      res.status(500).json({ message: "Failed to update owner profile" });
    }
  });

  // Properties: List properties for current owner
  app.get("/api/properties", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      if (user.role === "oss_super_admin") {
        const allProps = await storage.adminGetAllProperties();
        return res.json(allProps);
      }
      if (!user.ownerId) {
        return res.json([]);
      }
      const props = await storage.getPropertiesByOwner(user.ownerId);
      res.json(props);
    } catch (error) {
      logger.error({ err: error }, "Failed to fetch properties");
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // Properties: Get single property
  app.get("/api/properties/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const property = await storage.getProperty(asString(req.params.id));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (user.role !== "oss_super_admin" && property.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(property);
    } catch (error) {
      logger.error({ err: error }, "Failed to fetch property");
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  // Properties: Create new property
  app.post("/api/properties", requireAuth, requirePropertyLimit(), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      if (!["owner_admin", "oss_super_admin"].includes(user.role)) {
        return res.status(403).json({ message: "Only owners can create properties" });
      }
      let ownerId = user.role === "oss_super_admin" ? (req.body.ownerId || user.ownerId) : user.ownerId;

      if (!ownerId && user.role === "owner_admin") {
        const owner = await storage.createOwner({
          name: user.fullName || user.username,
          email: user.email || `${user.username}@placeholder.local`,
          companyName: user.fullName ? `${user.fullName}'s Properties` : `${user.username}'s Properties`,
        });
        await storage.updateUser(user.id, { ownerId: owner.id });
        ownerId = owner.id;
      }

      if (!ownerId) {
        return res.status(400).json({ message: "Owner account not found. Please contact support." });
      }

      const { ownerId: _bodyOwnerId, id: _id, createdAt: _ca, ...propertyData } = req.body;
      const property = await storage.createProperty({ ...propertyData, ownerId });
      await storage.ensureDefaultRatePlan(property.id, property.tenantId || ownerId);
      res.status(201).json(property);
    } catch (error: any) {
      logger.error({ err: error }, "Property creation error");
      const message = error?.message?.includes("violates") 
        ? "Invalid property data. Please check all fields and try again."
        : "Failed to create property. Please try again.";
      res.status(500).json({ message });
    }
  });

  // Properties: Update property
  app.patch("/api/properties/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const property = await storage.getProperty(asString(req.params.id));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (user.role !== "oss_super_admin" && property.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const updated = await storage.updateProperty(asString(req.params.id), req.body);
      res.json(updated);
    } catch (error) {
      logger.error({ err: error }, "Failed to update property");
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  // Properties: Delete property (permanent with cascading cleanup)
  app.delete("/api/properties/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const propertyId = asString(req.params.id);
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (user.role !== "oss_super_admin" && user.role !== "owner_admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      if (user.role === "owner_admin" && property.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const propertyBookings = await storage.getBookingsByProperty(propertyId);
      const activeBookings = propertyBookings.filter(b => b.status === "checked_in" || b.status === "confirmed");
      
      if (activeBookings.length > 0) {
        return res.status(400).json({ message: "Cannot delete property with active bookings. Please check out all guests first." });
      }

      const bookingIds = propertyBookings.map(b => b.id);
      const guestIds = [...new Set(propertyBookings.map(b => b.guestId).filter(Boolean))];

      const propertyHotels = await db.select({ id: hotels.id }).from(hotels).where(eq(hotels.propertyId, propertyId));
      const hotelIds = propertyHotels.map(h => h.id);

      await db.transaction(async (tx) => {
        if (bookingIds.length > 0) {
          await tx.delete(serviceRequests).where(inArray(serviceRequests.bookingId, bookingIds));
          await tx.delete(roomSettings).where(inArray(roomSettings.bookingId, bookingIds));
          await tx.delete(doorActionLogs).where(inArray(doorActionLogs.bookingId, bookingIds));
          await tx.delete(noShowRecords).where(inArray(noShowRecords.bookingId, bookingIds));
          await tx.delete(bookings).where(inArray(bookings.id, bookingIds));
        }

        if (guestIds.length > 0) {
          await tx.delete(credentialLogs).where(inArray(credentialLogs.guestId, guestIds as string[]));
        }

        if (hotelIds.length > 0) {
          const propertyEscalations = await tx.select({ id: escalations.id }).from(escalations).where(inArray(escalations.hotelId, hotelIds));
          const escalationIds = propertyEscalations.map(e => e.id);
          if (escalationIds.length > 0) {
            await tx.delete(escalationReplies).where(inArray(escalationReplies.escalationId, escalationIds));
            await tx.delete(escalations).where(inArray(escalations.id, escalationIds));
          }
        }

        await tx.delete(chatMessages).where(eq(chatMessages.propertyId, propertyId));
        await tx.delete(roomPreparationOrders).where(eq(roomPreparationOrders.propertyId, propertyId));
        await tx.delete(units).where(eq(units.propertyId, propertyId));
        await tx.delete(devices).where(eq(devices.propertyId, propertyId));
        await tx.delete(staffInvitations).where(eq(staffInvitations.propertyId, propertyId));
        await tx.delete(revenues).where(eq(revenues.propertyId, propertyId));
        await tx.delete(expenses).where(eq(expenses.propertyId, propertyId));
        await tx.delete(recurringExpenses).where(eq(recurringExpenses.propertyId, propertyId));
        await tx.delete(cashAccounts).where(eq(cashAccounts.propertyId, propertyId));
        await tx.delete(payrollEntries).where(eq(payrollEntries.propertyId, propertyId));
        await tx.delete(payrollConfigs).where(eq(payrollConfigs.propertyId, propertyId));
        await tx.delete(analyticsSnapshots).where(eq(analyticsSnapshots.propertyId, propertyId));
        await tx.delete(auditLogs).where(eq(auditLogs.propertyId, propertyId));

        await tx.update(users).set({ propertyId: null }).where(eq(users.propertyId, propertyId));
        if (hotelIds.length > 0) {
          await tx.update(users).set({ hotelId: null }).where(inArray(users.hotelId, hotelIds));
        }

        await tx.delete(hotels).where(eq(hotels.propertyId, propertyId));

        await tx.delete(properties).where(eq(properties.id, propertyId));
      });

      logger.info({ propertyId, propertyName: property.name, username: user.username }, "Property permanently deleted");
      res.json({ message: "Property permanently deleted" });
    } catch (error) {
      logger.error({ err: error }, "Failed to delete property");
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // Units: List units for a property
  app.get("/api/properties/:propertyId/units", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const property = await storage.getProperty(asString(req.params.propertyId));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (user.role !== "oss_super_admin" && property.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const unitsList = await storage.getUnitsByProperty(asString(req.params.propertyId));
      res.json(unitsList);
    } catch (error) {
      logger.error({ err: error }, "Failed to fetch units");
      res.status(500).json({ message: "Failed to fetch units" });
    }
  });

  // Units: Create unit
  app.post("/api/properties/:propertyId/units", requireAuth, validateBody(createUnitSchema), requireUnitLimit(), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      if (!["owner_admin", "property_manager", "admin", "oss_super_admin"].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      const property = await storage.getProperty(asString(req.params.propertyId));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (user.role !== "oss_super_admin" && property.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const category = (req.body.unitCategory || "accommodation") as UnitCategory;
      const validCategories = Object.keys(unitCategoryTypes);
      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: `Invalid unit category: ${category}` });
      }
      const validTypes = unitCategoryTypes[category];
      const unitType = req.body.unitType || validTypes[0];
      if (!validTypes.includes(unitType)) {
        return res.status(400).json({ message: `Invalid unit type '${unitType}' for category '${category}'` });
      }
      const unit = await storage.createUnit({
        ...req.body,
        unitCategory: category,
        unitType,
        propertyId: asString(req.params.propertyId),
        ownerId: property.ownerId,
      });
      res.status(201).json(unit);
    } catch (error) {
      logger.error({ err: error }, "Failed to create unit");
      res.status(500).json({ message: "Failed to create unit" });
    }
  });

  // Units: Update unit
  app.patch("/api/units/:id", requireAuth, validateBody(updateUnitSchema), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const unit = await storage.getUnit(asString(req.params.id));
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      if (user.role !== "oss_super_admin" && unit.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (req.body.unitCategory || req.body.unitType) {
        const cat = (req.body.unitCategory || unit.unitCategory || "accommodation") as UnitCategory;
        const validCats = Object.keys(unitCategoryTypes);
        if (!validCats.includes(cat)) {
          return res.status(400).json({ message: `Invalid unit category: ${cat}` });
        }
        if (req.body.unitType) {
          const validTypes = unitCategoryTypes[cat];
          if (!validTypes.includes(req.body.unitType)) {
            return res.status(400).json({ message: `Invalid unit type '${req.body.unitType}' for category '${cat}'` });
          }
        }
      }
      const updated = await storage.updateUnit(asString(req.params.id), req.body);

      if (req.body.pricePerNight !== undefined && updated?.propertyId) {
        try {
          const boss = await getJobQueue();
          await enqueueOtaSync(boss, updated.propertyId, req.tenantId || null, "push_rates", "unit_price_updated");
        } catch (otaErr) {
          logger.warn({ err: otaErr, unitId: req.params.id }, "Failed to enqueue OTA rates sync after unit price update");
        }
      }

      res.json(updated);
    } catch (error) {
      logger.error({ err: error }, "Failed to update unit");
      res.status(500).json({ message: "Failed to update unit" });
    }
  });

  // Units: Delete unit
  app.delete("/api/units/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const unit = await storage.getUnit(asString(req.params.id));
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      if (user.role !== "oss_super_admin" && unit.ownerId !== user.ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteUnit(asString(req.params.id));
      res.json({ message: "Unit deleted" });
    } catch (error) {
      logger.error({ err: error }, "Failed to delete unit");
      res.status(500).json({ message: "Failed to delete unit" });
    }
  });

  // Devices: List devices for a property
  app.get("/api/properties/:propertyId/devices", requireAuth, async (req, res) => {
    try {
      const property = await storage.getProperty(asString(req.params.propertyId));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (req.tenantUser?.role !== "oss_super_admin" && property.ownerId !== req.tenantId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const devicesList = await storage.getDevicesByProperty(asString(req.params.propertyId));
      res.json(devicesList);
    } catch (error) {
      logger.error({ err: error }, "Failed to fetch devices");
      res.status(500).json({ message: "Failed to fetch devices" });
    }
  });

  // Devices: Create device
  app.post("/api/properties/:propertyId/devices", requireAuth, requireFeature("smart_controls"), async (req, res) => {
    try {
      if (!req.tenantUser || !["owner_admin", "property_manager", "admin", "oss_super_admin"].includes(req.tenantUser.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      const property = await storage.getProperty(asString(req.params.propertyId));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      if (req.tenantUser?.role !== "oss_super_admin" && property.ownerId !== req.tenantId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const device = await storage.createDevice({
        ...req.body,
        propertyId: asString(req.params.propertyId),
        ownerId: property.ownerId,
      });
      res.status(201).json(device);
    } catch (error) {
      logger.error({ err: error }, "Failed to create device");
      res.status(500).json({ message: "Failed to create device" });
    }
  });

  // Devices: Update device
  app.patch("/api/devices/:id", requireAuth, async (req, res) => {
    try {
      const device = await storage.getDevice(asString(req.params.id));
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      if (req.tenantUser?.role !== "oss_super_admin" && device.ownerId !== req.tenantId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const updated = await storage.updateDevice(asString(req.params.id), req.body);
      res.json(updated);
    } catch (error) {
      logger.error({ err: error }, "Failed to update device");
      res.status(500).json({ message: "Failed to update device" });
    }
  });

  // Devices: Delete device
  app.delete("/api/devices/:id", requireAuth, async (req, res) => {
    try {
      const device = await storage.getDevice(asString(req.params.id));
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      if (req.tenantUser?.role !== "oss_super_admin" && device.ownerId !== req.tenantId) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteDevice(asString(req.params.id));
      res.json({ message: "Device deleted" });
    } catch (error) {
      logger.error({ err: error }, "Failed to delete device");
      res.status(500).json({ message: "Failed to delete device" });
    }
  });

  app.get("/api/plan-type", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.json({ planType: "starter", smartPlanType: "none" });

      if (user.username?.startsWith("demo_")) {
        return res.json({ planType: "pro", smartPlanType: "smart_lite" });
      }

      let ownerId = user.ownerId;
      if (!ownerId && user.hotelId) {
        const hotel = await storage.getHotel(user.hotelId);
        if (hotel?.ownerId) ownerId = hotel.ownerId;
      }
      if (!ownerId) return res.json({ planType: "starter", smartPlanType: "none" });

      const sub = await storage.getSubscriptionByOwner(ownerId);
      if (!sub) return res.json({ planType: "starter", smartPlanType: "none" });

      const effectivePlanType = sub.planType || "starter";

      res.json({ planType: effectivePlanType, smartPlanType: sub.smartPlanType || "none" });
    } catch (error) {
      res.json({ planType: "starter", smartPlanType: "none" });
    }
  });

  // Subscriptions: Get current owner subscription
  app.get("/api/subscriptions/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.ownerId) {
        return res.status(404).json({ message: "No subscription found" });
      }
      const sub = await storage.getSubscriptionByOwner(user.ownerId);
      if (!sub) {
        return res.status(404).json({ message: "No subscription found" });
      }
      res.json(sub);
    } catch (error) {
      logger.error({ err: error }, "Failed to fetch subscription");
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Owner Dashboard: Analytics summary
  app.get("/api/owner/analytics", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !["owner_admin", "oss_super_admin"].includes(user.role) || !user.ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const props = await storage.getPropertiesByOwner(user.ownerId);
      const allUnits = await storage.getUnitsByOwner(user.ownerId);
      const allDevices = await storage.getDevicesByOwner(user.ownerId);
      const staffUsers = await storage.getUsersByOwner(user.ownerId, req.tenantId!);
      const subscription = await storage.getSubscriptionByOwner(user.ownerId);

      const totalUnits = allUnits.length;
      const occupiedUnits = allUnits.filter(u => u.status === "occupied").length;
      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
      const onlineDevices = allDevices.filter(d => d.status === "online").length;
      const staff = staffUsers.filter(u => u.role !== "guest");

      res.json({
        totalProperties: props.length,
        totalUnits,
        occupiedUnits,
        occupancyRate,
        totalDevices: allDevices.length,
        onlineDevices,
        totalStaff: staff.length,
        subscription: subscription ? { planType: subscription.planType, featureFlags: subscription.featureFlags } : null,
        properties: props.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          city: p.city,
          country: p.country,
          totalUnits: p.totalUnits,
          isActive: p.isActive,
        })),
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to fetch owner analytics");
      res.status(500).json({ message: "Failed to fetch owner analytics" });
    }
  });

  // Backward Compatibility: Migrate existing hotel data to owner/property structure
  app.post("/api/admin/migrate-hotel", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const allHotels = await storage.adminGetAllHotels();
      let migrated = 0;
      for (const hotel of allHotels) {
        if (hotel.ownerId) continue;

        const allUsers = await storage.adminGetAllUsers();
        const staffUsers = allUsers.filter(u => u.hotelId === hotel.id);
        const adminUser = staffUsers.find(u => u.role === "admin") || staffUsers[0];

        const owner = await storage.createOwner({
          name: adminUser?.fullName || hotel.name,
          email: adminUser?.email || hotel.email || "unknown@hotel.com",
          phone: hotel.phone || null,
          companyName: hotel.name,
          country: hotel.country || null,
          city: hotel.city || null,
          address: hotel.address || null,
        });

        const property = await storage.createProperty({
          ownerId: owner.id,
          name: hotel.name,
          type: "hotel",
          address: hotel.address || null,
          phone: hotel.phone || null,
          email: hotel.email || null,
          country: hotel.country || null,
          city: hotel.city || null,
          totalUnits: hotel.totalRooms || null,
        });

        const starterDefaults = applyPlanFeatures("starter");
        await storage.createSubscription({
          ownerId: owner.id,
          planType: "starter",
          ...starterDefaults,
        });

        await db.update(hotels).set({ ownerId: owner.id, propertyId: property.id }).where(eq(hotels.id, hotel.id));

        for (const u of staffUsers) {
          await storage.updateUser(u.id, { ownerId: owner.id, propertyId: property.id });
        }

        migrated++;
      }
      res.json({ message: `Migrated ${migrated} hotels`, migrated });
    } catch (error) {
      logger.error({ err: error }, "Migration error");
      res.status(500).json({ message: "Migration failed" });
    }
  });
}
