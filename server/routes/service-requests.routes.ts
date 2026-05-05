import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { asString } from "../utils/request";
import type { ServiceRequest } from "@shared/schema";
import { requireAuth, requireRole } from "../middleware";
import { logger } from "../utils/logger";
import { broadcastToUser } from "../websocket/index";

export function registerServiceRequestRoutes(app: Express): void {
  // Service Requests Routes
  app.get("/api/service-requests", requireAuth, async (req, res) => {
    const requests = await storage.getServiceRequestsForGuest(req.session.userId!);
    res.json(requests);
  });

  app.get("/api/service-requests/all", requireRole("admin", "reception", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      let hotelId = user?.hotelId;
      if (!hotelId && user?.propertyId) {
        const matchingHotel = await storage.getHotelByPropertyId(user.propertyId);
        if (matchingHotel) {
          hotelId = matchingHotel.id;
          await storage.updateUser(user.id, { hotelId });
        }
      }
      if (hotelId) {
        const requests = await storage.getServiceRequestsByHotel(hotelId, req.tenantId!);
        return res.json(requests);
      }
      if (user?.role === "owner_admin" && user.ownerId) {
        const ownerProperties = await storage.getPropertiesByOwner(user.ownerId);
        const ownerHotelIds = new Set<string>();
        for (const prop of ownerProperties) {
          const hotel = await storage.getHotelByPropertyId(prop.id);
          if (hotel) ownerHotelIds.add(hotel.id);
        }
        const allRequests: ServiceRequest[] = [];
        for (const hotelId of Array.from(ownerHotelIds)) {
          const requests = await storage.getServiceRequestsByHotel(hotelId, req.tenantId!);
          allRequests.push(...requests);
        }
        allRequests.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
        return res.json(allRequests);
      }
      return res.json([]);
    } catch (error) {
      logger.error({ err: error }, "Error fetching service requests");
      res.status(500).json({ message: "Failed to fetch service requests" });
    }
  });

  app.post("/api/service-requests", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      const booking = await storage.getCurrentBookingForGuest(req.session.userId!);
      
      const request = await storage.createServiceRequest({
        guestId: req.session.userId!,
        bookingId: booking?.id || "",
        roomNumber: booking?.roomNumber || "Unknown",
        requestType: req.body.requestType,
        description: req.body.description,
        status: "pending",
        priority: req.body.priority || "normal",
        tenantId: req.tenantId || user?.tenantId || null,
        ownerId: user?.ownerId || null,
      });

      // Resolve hotelId: from user, then from booking
      const hotelId = user?.hotelId || (booking as any)?.hotelId || null;

      // Resolve authoritative tenantId from hotel's ownerId — staff are stored under ownerId
      let staffTenantId: string | null = req.tenantId || user?.tenantId || (booking as any)?.tenantId || null;
      if (hotelId) {
        try {
          const hotel = await storage.getHotel(hotelId);
          if (hotel?.ownerId) staffTenantId = hotel.ownerId;
        } catch {}
      }

      const notifTitle = "🔔 Yeni Servis Sorğusu";
      const notifMsg = `Otaq ${request.roomNumber}: ${request.requestType.replace(/_/g, " ")} — ${request.description}`;

      if (hotelId && staffTenantId) {
        try {
          const hotelUsers = await storage.getUsersByHotel(hotelId, staffTenantId);
          const hotelStaff = hotelUsers.filter(u =>
            ["reception", "admin", "staff", "property_manager", "owner_admin"].includes(u.role)
          );
          for (const staff of hotelStaff) {
            await storage.createNotification({
              userId: staff.id,
              title: notifTitle,
              message: notifMsg,
              type: "service_request",
              actionUrl: "/reception-dashboard?view=requests",
              tenantId: staffTenantId,
            });
            broadcastToUser(String(staff.id), {
              type: "new_notification",
              title: notifTitle,
              message: notifMsg,
              actionUrl: "/reception-dashboard?view=requests",
            });
          }
          logger.info({ hotelId, staffCount: hotelStaff.length }, "Service request notifications sent");
        } catch (err) {
          logger.error({ err }, "Error sending service request notifications");
        }
      } else if (staffTenantId) {
        // fallback: notify owner admins of the tenant
        try {
          const ownerAdmins = await storage.getOwnerAdminsByTenant(staffTenantId);
          for (const admin of ownerAdmins) {
            await storage.createNotification({
              userId: admin.id,
              title: notifTitle,
              message: notifMsg,
              type: "service_request",
              actionUrl: "/reception-dashboard?view=requests",
              tenantId: staffTenantId,
            });
            broadcastToUser(String(admin.id), {
              type: "new_notification",
              title: notifTitle,
              message: notifMsg,
              actionUrl: "/reception-dashboard?view=requests",
            });
          }
        } catch (err) {
          logger.error({ err }, "Error sending service request notifications (fallback)");
        }
      } else {
        logger.warn({ userId: req.session.userId, hotelId }, "Could not resolve tenantId for service request notification");
      }

      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to create request" });
    }
  });

  app.patch("/api/service-requests/:id", requireRole("admin", "reception", "owner_admin", "property_manager"), async (req, res) => {
    const id = asString(req.params.id);
    const existing = await storage.getServiceRequest(id);
    if (!existing) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (req.tenantUser?.role !== "oss_super_admin") {
      if (existing.ownerId !== req.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const request = await storage.updateServiceRequest(id, req.body);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    await storage.createNotification({
      userId: request.guestId,
      title: "Request Updated",
      message: `Your ${request.requestType.replace("_", " ")} request has been ${request.status}`,
      type: request.status === "completed" ? "success" : "info",
      tenantId: req.tenantId || null,
    });

    res.json(request);
  });
}
