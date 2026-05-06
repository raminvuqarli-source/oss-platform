import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { asString } from "../utils/request";
import { z } from "zod";
import { insertRoomPreparationOrderSchema } from "@shared/schema";
import { requireAuth, requireRole } from "../middleware";
import { logger } from "../utils/logger";
import { broadcastToUser } from "../websocket/index";

export function registerRoomPrepRoutes(app: Express): void {
  // Guest: Create a room preparation order
  app.post("/api/room-prep-orders", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "guest") {
        return res.status(403).json({ message: "Only guests can create preparation orders" });
      }
      const booking = await storage.getCurrentBookingForGuest(user.id);
      if (!booking) {
        return res.status(400).json({ message: "No active booking found" });
      }
      const validated = insertRoomPreparationOrderSchema.parse({
        ...req.body,
        guestId: user.id,
        hotelId: user.hotelId,
        roomNumber: booking.roomNumber,
        preferredDatetime: req.body.preferredDatetime ? new Date(req.body.preferredDatetime) : undefined,
        tenantId: req.tenantId || user.tenantId || null,
      });
      const order = await storage.createRoomPreparationOrder(validated);

      // Notify admin/reception staff about new order
      const effectiveTenantId = req.tenantId || user.tenantId;
      const staffUsers = effectiveTenantId
        ? await storage.getUsersByHotel(user.hotelId!, effectiveTenantId)
        : [];
      const adminReceptionStaff = staffUsers.filter(u => u.role === "admin" || u.role === "reception");
      for (const staff of adminReceptionStaff) {
        await storage.createNotification({
          userId: staff.id,
          title: "New Room Preparation Order",
          message: `Guest ${user.fullName} (Room ${booking.roomNumber}) has requested a ${order.occasionType.replace(/_/g, ' ')} preparation.`,
          type: "room_prep",
          actionUrl: "/admin/room-prep-orders",
          tenantId: effectiveTenantId || null,
        });
        // Real-time WebSocket push so reception sees it immediately
        broadcastToUser(String(staff.id), {
          type: "room_prep_new",
          order: {
            id: order.id,
            guestName: user.fullName,
            roomNumber: booking.roomNumber,
            occasionType: order.occasionType,
          },
        });
      }

      res.status(201).json(order);
    } catch (error) {
      logger.error({ err: error }, "Error creating room preparation order");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create preparation order" });
    }
  });

  // Guest: Get own preparation orders
  app.get("/api/room-prep-orders/my", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const orders = await storage.getRoomPreparationOrdersByGuest(user.id, req.tenantId!);
      res.json(orders);
    } catch (error) {
      logger.error({ err: error }, "Error fetching guest prep orders");
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Admin/Reception: Get hotel preparation orders (enriched with guest names)
  app.get("/api/room-prep-orders/hotel", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !["admin", "reception"].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      let hotelId = user.hotelId;
      if (!hotelId && user.propertyId) {
        const matchingHotel = await storage.getHotelByPropertyId(user.propertyId);
        if (matchingHotel) {
          hotelId = matchingHotel.id;
          await storage.updateUser(user.id, { hotelId });
        }
      }
      if (!hotelId) {
        return res.json([]);
      }
      const orders = await storage.getRoomPreparationOrdersByHotel(hotelId, req.tenantId!);
      const enriched = await Promise.all(orders.map(async (order) => {
        const guest = await storage.getUser(order.guestId);
        return { ...order, guestName: guest?.fullName || "Unknown Guest" };
      }));
      res.json(enriched);
    } catch (error) {
      logger.error({ err: error }, "Error fetching hotel prep orders");
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // OSS Super Admin: Get all preparation orders
  app.get("/api/room-prep-orders/all", requireRole("oss_super_admin"), async (_req: Request, res: Response) => {
    try {
      const orders = await storage.adminGetAllRoomPreparationOrders();
      res.json(orders);
    } catch (error) {
      logger.error({ err: error }, "Error fetching all prep orders");
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // OSS Super Admin: Analytics for preparation orders
  app.get("/api/room-prep-orders/analytics", requireRole("oss_super_admin"), async (_req: Request, res: Response) => {
    try {
      const orders = await storage.adminGetAllRoomPreparationOrders();
      const byOccasion: Record<string, number> = {};
      const byAddOn: Record<string, number> = {};
      let totalRevenue = 0;
      let completedCount = 0;

      orders.forEach(order => {
        byOccasion[order.occasionType] = (byOccasion[order.occasionType] || 0) + 1;
        if (order.addOns) {
          order.addOns.forEach(addon => {
            if (addon) byAddOn[addon] = (byAddOn[addon] || 0) + 1;
          });
        }
        if (order.price && ["delivered", "ready"].includes(order.status)) {
          totalRevenue += order.price;
          completedCount++;
        }
      });

      res.json({
        totalOrders: orders.length,
        completedOrders: completedCount,
        totalRevenue,
        byOccasion,
        byAddOn,
        byStatus: orders.reduce((acc, o) => {
          acc[o.status] = (acc[o.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      });
    } catch (error) {
      logger.error({ err: error }, "Error fetching prep analytics");
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin/Reception: Update preparation order (status, price, staff, notes)
  app.patch("/api/room-prep-orders/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !["admin", "reception"].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      const orderId = asString(req.params.id);
      const existing = await storage.getRoomPreparationOrder(orderId);
      if (!existing) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (user.hotelId && existing.hotelId !== user.hotelId) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (req.tenantId && existing.tenantId && existing.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const allowedFields = ["status", "price", "staffAssigned", "adminNotes", "rejectionReason"];
      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      const updated = await storage.updateRoomPreparationOrder(orderId, updates);

      // Notify guest of status change
      if (req.body.status && req.body.status !== existing.status) {
        const statusMessages: Record<string, string> = {
          accepted: "Your room preparation order has been accepted!",
          in_preparation: "Your room preparation is now being prepared.",
          ready: "Your room preparation is ready!",
          delivered: "Your room preparation has been delivered. Enjoy!",
          rejected: `Your room preparation order was declined. ${req.body.rejectionReason || ''}`,
        };
        const message = statusMessages[req.body.status] || `Your room preparation order status changed to ${req.body.status}.`;
        await storage.createNotification({
          userId: existing.guestId,
          title: "Room Preparation Update",
          message,
          type: "room_prep",
          actionUrl: "/guest/room-prep",
          tenantId: req.tenantId || null,
        });
      }

      res.json(updated);
    } catch (error) {
      logger.error({ err: error }, "Error updating room preparation order");
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Get single room preparation order by ID
  app.get("/api/room-prep-orders/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const order = await storage.getRoomPreparationOrder(asString(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      // Guests can only see their own orders
      if (user.role === "guest" && order.guestId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      // Admin/reception can only see their hotel's orders
      if (["admin", "reception"].includes(user.role) && user.hotelId && order.hotelId !== user.hotelId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(order);
    } catch (error) {
      logger.error({ err: error }, "Error fetching prep order");
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });
}
