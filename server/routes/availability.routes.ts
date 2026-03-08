import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware";
import { logger } from "../utils/logger";
import { z } from "zod";
import { calculateDynamicPricesForRange } from "../services/dynamicPricingService";

const availabilityLogger = logger.child({ module: "availability" });

const searchSchema = z.object({
  propertyId: z.string().min(1),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  guests: z.coerce.number().int().positive().optional(),
});

export function registerAvailabilityRoutes(app: Express): void {

  app.get("/api/availability/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = searchSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid parameters",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { propertyId, checkIn, checkOut, guests } = parsed.data;

      if (new Date(checkIn) >= new Date(checkOut)) {
        return res.status(400).json({ message: "checkOut must be after checkIn" });
      }

      if (new Date(checkIn) < new Date(new Date().toISOString().split("T")[0])) {
        return res.status(400).json({ message: "checkIn cannot be in the past" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      if (user.role !== "oss_super_admin") {
        const property = await storage.getProperty(propertyId);
        if (!property) {
          return res.status(404).json({ message: "Property not found" });
        }
        if (property.ownerId !== user.ownerId && property.ownerId !== user.id) {
          return res.status(403).json({ message: "Access denied to this property" });
        }
      }

      const tenantId = req.tenantId || undefined;
      const availableUnits = await storage.searchAvailableUnits(propertyId, checkIn, checkOut, guests, tenantId);

      availabilityLogger.info({
        propertyId,
        checkIn,
        checkOut,
        guests,
        availableCount: availableUnits.length,
      }, "Availability search completed");

      const unitsWithPricing = await Promise.all(
        availableUnits.map(async (u) => {
          const dynamicPrices = await calculateDynamicPricesForRange(
            propertyId,
            tenantId || "",
            u.id,
            checkIn,
            checkOut,
          );
          const totalDynamicPrice = dynamicPrices.reduce((sum, d) => sum + d.finalPrice, 0);
          const avgDynamic = dynamicPrices.length > 0
            ? Math.round(totalDynamicPrice / dynamicPrices.length)
            : (u.pricePerNight || 0);

          return {
            id: u.id,
            unitNumber: u.unitNumber,
            unitType: u.unitType,
            name: u.name,
            floor: u.floor,
            capacity: u.capacity,
            pricePerNight: u.pricePerNight,
            dynamicPricePerNight: avgDynamic,
            totalDynamicPrice,
            amenities: u.amenities,
            description: u.description,
          };
        }),
      );

      res.json({
        propertyId,
        checkIn,
        checkOut,
        guests: guests || null,
        availableUnits: unitsWithPricing,
        totalAvailable: availableUnits.length,
      });
    } catch (err) {
      availabilityLogger.error({ err }, "Availability search failed");
      res.status(500).json({ message: "Failed to search availability" });
    }
  });

  app.get("/api/availability/unit/:unitId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { unitId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required (YYYY-MM-DD)" });
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate as string) || !dateRegex.test(endDate as string)) {
        return res.status(400).json({ message: "Dates must be in YYYY-MM-DD format" });
      }

      if (new Date(startDate as string) >= new Date(endDate as string)) {
        return res.status(400).json({ message: "endDate must be after startDate" });
      }

      const roomNightRecords = await storage.getRoomNightsByUnit(
        unitId as string,
        startDate as string,
        endDate as string,
      );

      res.json({
        unitId,
        startDate,
        endDate,
        occupiedDates: roomNightRecords.map(rn => ({
          date: rn.date,
          bookingId: rn.bookingId,
        })),
        totalOccupiedNights: roomNightRecords.length,
      });
    } catch (err) {
      availabilityLogger.error({ err }, "Unit availability lookup failed");
      res.status(500).json({ message: "Failed to get unit availability" });
    }
  });
}
