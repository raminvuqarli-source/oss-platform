import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { asString } from "../utils/request";
import { requireAuth, requireRole } from "../middleware";
import { resolveHotelContext } from "../utils/resolveHotelContext";

export function registerNotificationRoutes(app: Express): void {
  // Notifications Routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    const notifications = await storage.getNotificationsForUser(req.session.userId!, req.tenantId!);
    res.json(notifications);
  });

  app.get("/api/notifications/all", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    const { hotelIds, user } = await resolveHotelContext(req.session.userId!);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    if (hotelIds.length === 0) {
      return res.json([]);
    }

    const all: any[] = [];
    for (const hid of hotelIds) {
      const notes = await storage.getNotificationsByHotel(hid, req.tenantId!);
      all.push(...notes);
    }
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(all);
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    const id = asString(req.params.id);
    const existing = await storage.getNotification(id);
    if (!existing) {
      return res.status(404).json({ message: "Notification not found" });
    }
    if (existing.userId !== req.session.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const notification = await storage.markNotificationRead(id);
    res.json(notification);
  });

  app.post("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    await storage.markAllNotificationsRead(req.session.userId!);
    res.json({ message: "All notifications marked as read" });
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    const id = asString(req.params.id);
    const notification = await storage.getNotification(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    if (notification.userId !== req.session.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await storage.deleteNotification(id);
    res.json({ message: "Notification deleted" });
  });
}
