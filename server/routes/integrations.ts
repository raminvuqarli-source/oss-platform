import type { Express } from "express";
import { authenticateRequest } from "../middleware";
import { storage } from "../storage";
import { getJobQueue } from "../services/jobQueue";
import { BOOKING_SYNC_QUEUE, type BookingSyncJobData } from "../workers/bookingSyncWorker";
import { logger } from "../utils/logger";

export function registerIntegrationRoutes(app: Express) {
  app.get("/api/integrations/booking/sync", (_req, res) => {
    res.json({
      status: "ready",
      method: "POST",
      description: "Send POST request with JSON body: { hotelId, tenantId, icalUrl }. Returns 202 with jobId for async processing.",
    });
  });

  app.post("/api/integrations/booking/sync", authenticateRequest, async (req, res) => {
    try {
      const { hotelId, tenantId, icalUrl } = req.body;

      if (!hotelId || typeof hotelId !== "string") {
        return res.status(400).json({ success: false, error: "hotelId is required" });
      }
      if (!tenantId || typeof tenantId !== "string") {
        return res.status(400).json({ success: false, error: "tenantId is required" });
      }
      if (!icalUrl || typeof icalUrl !== "string") {
        return res.status(400).json({ success: false, error: "icalUrl is required" });
      }

      const boss = await getJobQueue();
      const jobId = await boss.send(BOOKING_SYNC_QUEUE, {
        hotelId,
        tenantId,
        icalUrl,
      } as BookingSyncJobData, {
        singletonKey: `${hotelId}`,
        retryLimit: 3,
        expireInSeconds: 300,
      });

      if (!jobId) {
        return res.status(409).json({
          success: false,
          error: "A sync job for this hotel is already in progress",
        });
      }

      logger.info({ jobId, hotelId }, "Booking sync job queued");

      res.status(202).json({
        success: true,
        jobId,
        message: "Sync job queued for background processing",
      });
    } catch (error: any) {
      logger.error({ err: error }, "Booking sync queue error");
      res.status(500).json({ success: false, error: error?.message || "Failed to queue sync job" });
    }
  });

  app.get("/api/calendar/bookings", authenticateRequest, async (req, res) => {
    try {
      const tenantId = (req as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant not resolved" });
      }

      const hotelId = req.query.hotelId as string;
      if (!hotelId) {
        return res.status(400).json({ message: "hotelId query parameter is required" });
      }

      const bookings = await storage.getExternalBookingsByHotel(hotelId, tenantId);
      res.json(bookings);
    } catch (error: any) {
      logger.error({ err: error }, "Get calendar bookings error");
      res.status(500).json({ message: error?.message || "Failed to fetch calendar bookings" });
    }
  });

  app.get("/api/calendar/bookings/:id", authenticateRequest, async (req, res) => {
    try {
      const tenantId = (req as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant not resolved" });
      }

      const booking = await storage.getExternalBooking(req.params.id as string);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.tenantId !== tenantId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(booking);
    } catch (error: any) {
      logger.error({ err: error }, "Get calendar booking error");
      res.status(500).json({ message: error?.message || "Failed to fetch booking" });
    }
  });

  app.delete("/api/calendar/bookings/:id", authenticateRequest, async (req, res) => {
    try {
      const tenantId = (req as any).tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant not resolved" });
      }

      const booking = await storage.getExternalBooking(req.params.id as string);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.tenantId !== tenantId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteExternalBooking(req.params.id as string);
      res.json({ success: true });
    } catch (error: any) {
      logger.error({ err: error }, "Delete calendar booking error");
      res.status(500).json({ success: false, error: error?.message || "Failed to delete booking" });
    }
  });
}
