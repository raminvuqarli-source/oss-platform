import type { Express } from "express";
import { storage } from "../storage";
import { authenticateRequest, requireRole } from "../middleware";
import { logger } from "../utils/logger";

function asString(val: unknown): string {
  return String(val ?? "");
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function calculateStaffPerformance(staffId: string, hotelId: string, tenantId: string | null) {
  const period = getCurrentPeriod();
  const staffUser = await storage.getUser(staffId);
  if (!staffUser) return null;

  const allRequests = await storage.getServiceRequestsByHotel(hotelId, tenantId!);
  const staffRequests = allRequests.filter((r: any) => r.assignedTo === staffId);
  const totalAssigned = staffRequests.length;
  const completed = staffRequests.filter((r: any) => r.status === "completed").length;
  const taskCompletionScore = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 50;

  const resolvedRequests = staffRequests.filter((r: any) => r.status === "completed" || r.status === "resolved");
  let serviceQualityScore = 50;
  if (resolvedRequests.length > 0) {
    const avgResponseQuality = Math.min(100, (resolvedRequests.length / Math.max(1, totalAssigned)) * 100);
    serviceQualityScore = avgResponseQuality;
  }

  const messageStatuses = await storage.getStaffMessageStatusByStaff(staffId);
  const totalMessages = messageStatuses.length;
  const readMessages = messageStatuses.filter(s => s.isRead).length;
  const messageResponseScore = totalMessages > 0 ? (readMessages / totalMessages) * 100 : 50;

  const daysSinceCreation = staffUser.createdAt 
    ? Math.max(1, Math.floor((Date.now() - new Date(staffUser.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 30;
  const activityScore = Math.min(100, Math.max(20, 50 + (daysSinceCreation > 7 ? 30 : 0) + (totalAssigned > 0 ? 20 : 0)));

  const feedbacks = await storage.getStaffFeedbackByStaff(staffId);
  const manualAdjustment = feedbacks.reduce((sum, f) => sum + (f.scoreImpact || 0), 0);

  const rawScore = 
    messageResponseScore * 0.25 +
    taskCompletionScore * 0.35 +
    serviceQualityScore * 0.25 +
    activityScore * 0.15;

  const totalScore = Math.max(0, Math.min(100, rawScore + manualAdjustment));

  return await storage.upsertStaffPerformanceScore({
    staffId,
    hotelId,
    tenantId,
    messageResponseScore,
    taskCompletionScore,
    serviceQualityScore,
    activityScore,
    manualAdjustment,
    totalScore,
    period,
  });
}

export function registerStaffPerformanceRoutes(app: Express) {
  const ALL_STAFF_ROLES = [
    "admin", "reception", "staff", "property_manager",
    "restaurant_manager", "waiter", "kitchen_staff",
    "restaurant_cleaner", "restaurant_cashier",
  ];

  app.post("/api/staff-messages/broadcast", authenticateRequest, requireRole("owner_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const { messageText } = req.body;
      if (!messageText || !messageText.trim()) {
        return res.status(400).json({ message: "Message text is required" });
      }

      let hotelId = user.hotelId;
      if (!hotelId && user.ownerId) {
        const ownerProperties = await storage.getPropertiesByOwner(user.ownerId);
        for (const prop of ownerProperties) {
          const hotel = await storage.getHotelByPropertyId(prop.id);
          if (hotel) {
            hotelId = hotel.id;
            break;
          }
        }
      }

      if (!hotelId) {
        return res.status(400).json({ message: "No hotel found" });
      }

      const message = await storage.createStaffMessage({
        hotelId,
        tenantId: user.tenantId,
        senderRole: "owner",
        senderId: user.id,
        messageText: messageText.trim(),
      });

      // Gather all staff across all sources (same pattern as performance endpoint)
      const seenStaffIds = new Set<string>();
      const staffMembers: any[] = [];

      const addStaffForBroadcast = (users: any[]) => {
        for (const u of users) {
          if (!seenStaffIds.has(u.id) && ALL_STAFF_ROLES.includes(u.role)) {
            seenStaffIds.add(u.id);
            staffMembers.push(u);
          }
        }
      };

      if (user.ownerId) {
        const ownerProperties = await storage.getPropertiesByOwner(user.ownerId);
        for (const prop of ownerProperties) {
          const propUsers = await storage.getUsersByProperty(prop.id);
          addStaffForBroadcast(propUsers);
        }
        if (req.tenantId) {
          const ownerUsers = await storage.getUsersByOwner(user.ownerId, req.tenantId);
          addStaffForBroadcast(ownerUsers);
        }
      }
      if (hotelId && req.tenantId) {
        const hotelUsers = await storage.getUsersByHotel(hotelId, req.tenantId);
        addStaffForBroadcast(hotelUsers);
      }
      if (user.propertyId) {
        const propUsers = await storage.getUsersByProperty(user.propertyId);
        addStaffForBroadcast(propUsers);
      }

      for (const staff of staffMembers) {
        await storage.createStaffMessageStatus({
          messageId: message.id,
          staffId: staff.id,
          isRead: false,
        });

        await storage.createNotification({
          userId: staff.id,
          tenantId: user.tenantId,
          title: "Yeni mesaj",
          message: messageText.trim().substring(0, 100),
          type: "info",
        });
      }

      res.json({ message, recipientCount: staffMembers.length });
    } catch (error) {
      logger.error({ err: error }, "Error broadcasting message");
      res.status(500).json({ message: "Failed to send broadcast message" });
    }
  });

  app.get("/api/staff-messages/hotel", authenticateRequest, requireRole("owner_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      let hotelId = user.hotelId;
      if (!hotelId && user.ownerId) {
        const ownerProperties = await storage.getPropertiesByOwner(user.ownerId);
        for (const prop of ownerProperties) {
          const hotel = await storage.getHotelByPropertyId(prop.id);
          if (hotel) {
            hotelId = hotel.id;
            break;
          }
        }
      }

      if (!hotelId) return res.json([]);

      const messages = await storage.getStaffMessagesByHotel(hotelId);

      const messagesWithStats = await Promise.all(messages.map(async (msg) => {
        const statuses = await storage.getStaffMessageStatusByMessage(msg.id);
        const totalRecipients = statuses.length;
        const readCount = statuses.filter(s => s.isRead).length;
        const unreadCount = totalRecipients - readCount;
        return { ...msg, totalRecipients, readCount, unreadCount };
      }));

      res.json(messagesWithStats);
    } catch (error) {
      logger.error({ err: error }, "Error fetching staff messages");
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/staff-messages/inbox", authenticateRequest, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const statuses = await storage.getStaffMessageStatusByStaff(user.id);

      const messagesWithStatus = await Promise.all(statuses.map(async (status) => {
        const hotelId = user.hotelId;
        if (!hotelId) return null;
        const allMessages = await storage.getStaffMessagesByHotel(hotelId);
        const msg = allMessages.find(m => m.id === status.messageId);
        if (!msg) return null;
        return { ...msg, isRead: status.isRead, readAt: status.readAt };
      }));

      res.json(messagesWithStatus.filter(Boolean));
    } catch (error) {
      logger.error({ err: error }, "Error fetching inbox");
      res.status(500).json({ message: "Failed to fetch inbox" });
    }
  });

  app.post("/api/staff-messages/:messageId/read", authenticateRequest, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      await storage.markStaffMessageRead(asString(req.params.messageId), user.id);
      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error }, "Error marking message as read");
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  app.get("/api/staff-performance/hotel", authenticateRequest, requireRole("owner_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      let hotelId = user.hotelId;
      const seenIds = new Set<string>();
      const allStaff: any[] = [];

      const addStaff = (users: any[]) => {
        for (const u of users) {
          if (!seenIds.has(u.id) && ALL_STAFF_ROLES.includes(u.role)) {
            seenIds.add(u.id);
            allStaff.push(u);
          }
        }
      };

      // Fetch by ownerId (covers all properties)
      if (user.ownerId) {
        const ownerProperties = await storage.getPropertiesByOwner(user.ownerId);
        for (const prop of ownerProperties) {
          const propUsers = await storage.getUsersByProperty(prop.id);
          addStaff(propUsers);
          if (!hotelId) {
            const hotel = await storage.getHotelByPropertyId(prop.id);
            if (hotel) hotelId = hotel.id;
          }
        }
        if (req.tenantId) {
          const ownerUsers = await storage.getUsersByOwner(user.ownerId, req.tenantId);
          addStaff(ownerUsers);
        }
      }

      // Also fetch by hotelId as fallback
      if (hotelId && req.tenantId) {
        const hotelUsers = await storage.getUsersByHotel(hotelId, req.tenantId);
        addStaff(hotelUsers);
      }

      // Also fetch by propertyId if set on the owner
      if (user.propertyId) {
        const propUsers = await storage.getUsersByProperty(user.propertyId);
        addStaff(propUsers);
      }

      if (allStaff.length === 0) return res.json([]);

      const resolvedHotelId = hotelId || "unknown";
      const performanceData = await Promise.all(allStaff.map(async (staff) => {
        const score = await calculateStaffPerformance(staff.id, resolvedHotelId, req.tenantId!);
        const feedbacks = await storage.getStaffFeedbackByStaff(staff.id);
        return {
          staffId: staff.id,
          fullName: staff.fullName,
          role: staff.role,
          email: staff.email,
          score: score ? {
            totalScore: score.totalScore,
            messageResponseScore: score.messageResponseScore,
            taskCompletionScore: score.taskCompletionScore,
            serviceQualityScore: score.serviceQualityScore,
            activityScore: score.activityScore,
            manualAdjustment: score.manualAdjustment,
            period: score.period,
          } : null,
          feedbackCount: feedbacks.length,
          starCount: feedbacks.filter(f => f.type === "star").length,
          warningCount: feedbacks.filter(f => f.type === "warning").length,
        };
      }));

      res.json(performanceData);
    } catch (error) {
      logger.error({ err: error }, "Error fetching staff performance");
      res.status(500).json({ message: "Failed to fetch performance data" });
    }
  });

  app.get("/api/staff-performance/my-score", authenticateRequest, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const period = getCurrentPeriod();
      const score = await storage.getStaffPerformanceScore(user.id, period);
      const history = await storage.getStaffPerformanceHistory(user.id);
      const feedbacks = await storage.getStaffFeedbackByStaff(user.id);

      res.json({
        currentScore: score,
        history: history.slice(0, 12),
        feedbacks: feedbacks.map(f => ({
          type: f.type,
          reason: f.reason,
          scoreImpact: f.scoreImpact,
          createdAt: f.createdAt,
        })),
      });
    } catch (error) {
      logger.error({ err: error }, "Error fetching my score");
      res.status(500).json({ message: "Failed to fetch score" });
    }
  });

  app.post("/api/staff-feedback", authenticateRequest, requireRole("owner_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const { staffId, type, reason } = req.body;

      if (!staffId || !type) {
        return res.status(400).json({ message: "staffId and type are required" });
      }

      if (type !== "star" && type !== "warning") {
        return res.status(400).json({ message: "Type must be 'star' or 'warning'" });
      }

      const targetStaff = await storage.getUser(staffId);
      if (!targetStaff) return res.status(404).json({ message: "Staff not found" });

      let hotelId = user.hotelId;
      if (!hotelId && user.ownerId) {
        const ownerProperties = await storage.getPropertiesByOwner(user.ownerId);
        for (const prop of ownerProperties) {
          const hotel = await storage.getHotelByPropertyId(prop.id);
          if (hotel) {
            hotelId = hotel.id;
            break;
          }
        }
      }

      if (!hotelId) return res.status(400).json({ message: "No hotel found" });

      const scoreImpact = type === "star" ? 5 : -7;

      const feedback = await storage.createStaffFeedback({
        ownerId: user.id,
        staffId,
        hotelId,
        tenantId: user.tenantId,
        type,
        reason: reason || null,
        scoreImpact,
      });

      await storage.createNotification({
        userId: staffId,
        tenantId: user.tenantId,
        title: type === "star" ? "You received a star!" : "You received a warning",
        message: reason || (type === "star" ? "Great job! Keep up the good work." : "Please review your performance."),
        type: type === "star" ? "success" : "warning",
      });

      await calculateStaffPerformance(staffId, hotelId, user.tenantId || null);

      res.json(feedback);
    } catch (error) {
      logger.error({ err: error }, "Error creating feedback");
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  app.get("/api/staff-feedback/history/:staffId", authenticateRequest, requireRole("owner_admin"), async (req, res) => {
    try {
      const feedbacks = await storage.getStaffFeedbackByStaff(asString(req.params.staffId));
      res.json(feedbacks);
    } catch (error) {
      logger.error({ err: error }, "Error fetching feedback history");
      res.status(500).json({ message: "Failed to fetch feedback history" });
    }
  });
}
