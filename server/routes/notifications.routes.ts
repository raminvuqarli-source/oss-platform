import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { asString } from "../utils/request";
import { requireAuth, requireRole } from "../middleware";

export function registerNotificationRoutes(app: Express): void {
  // Notifications Routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    const notifications = await storage.getNotificationsForUser(req.session.userId!, req.tenantId!);
    res.json(notifications);
  });

  app.get("/api/notifications/all", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user?.hotelId) {
      return res.status(400).json({ message: "No hotel assigned" });
    }
    const notifications = await storage.getNotificationsByHotel(user.hotelId, req.tenantId!);
    res.json(notifications);
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
