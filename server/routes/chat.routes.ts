import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { asString } from "../utils/request";
import { sendPushNotification } from "../onesignal";
import { requireAuth, requireRole } from "../middleware";
import { logger } from "../utils/logger";
import { broadcastToUser } from "../websocket/index";

export function registerChatRoutes(app: Express): void {

  app.get("/api/chat/messages", requireRole("guest"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.hotelId) {
        return res.status(400).json({ message: "No hotel assigned" });
      }
      const messages = await storage.getChatMessagesForGuest(user.id, user.hotelId, req.tenantId!);
      res.json(messages);
    } catch (error) {
      logger.error({ err: error }, "Error fetching guest chat messages");
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Guest: Send a message
  app.post("/api/chat/messages", requireRole("guest"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.hotelId) {
        return res.status(400).json({ message: "No hotel assigned" });
      }
      
      const { message } = req.body;
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const chatMessage = await storage.createChatMessage({
        hotelId: user.hotelId,
        guestId: user.id,
        senderId: user.id,
        senderRole: "guest",
        message: message.trim(),
        tenantId: req.tenantId || user.tenantId || null,
      });

      try {
        const effectiveTenantId = req.tenantId || user.tenantId || null;
        const hotelStaff = effectiveTenantId
          ? await storage.getUsersByHotel(user.hotelId, effectiveTenantId)
          : [];
        const staffRoles = ["reception", "admin", "owner_admin", "property_manager"];
        const staffToNotify = hotelStaff.filter(u => staffRoles.includes(u.role));
        const guestName = user.fullName || "Guest";
        const shortMsg = message.trim().length > 80 ? message.trim().substring(0, 80) + "..." : message.trim();
        const notifTitle = `💬 ${guestName} mesaj göndərdi`;
        for (const staff of staffToNotify) {
          await storage.createNotification({
            userId: staff.id,
            tenantId: effectiveTenantId,
            title: notifTitle,
            message: shortMsg,
            type: "chat",
            actionUrl: `/reception-dashboard?view=messages`,
          });
          broadcastToUser(String(staff.id), {
            type: "new_notification",
            title: notifTitle,
            message: shortMsg,
            actionUrl: `/reception-dashboard?view=messages`,
          });
        }
        const staffIds = staffToNotify.map(s => String(s.id));
        if (staffIds.length > 0) {
          sendPushNotification({
            userIds: staffIds,
            title: notifTitle,
            message: shortMsg,
            data: { type: "chat", guestId: String(user.id) },
          }).catch(err => logger.error({ err }, "OneSignal push error"));
        }
      } catch (notifError) {
        logger.error({ err: notifError }, "Error creating chat notifications");
      }
      
      res.json(chatMessage);
    } catch (error) {
      logger.error({ err: error }, "Error sending guest message");
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Reception/Admin: Get chat messages for a specific guest
  app.get("/api/chat/messages/:guestId", requireRole("reception", "admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.hotelId) {
        return res.status(400).json({ message: "No hotel assigned" });
      }
      
      const guestId = asString(req.params.guestId);
      
      // Verify the guest belongs to the same hotel
      const guest = await storage.getUser(guestId);
      if (!guest || guest.hotelId !== user.hotelId) {
        return res.status(403).json({ message: "Guest not found in your hotel" });
      }
      
      const messages = await storage.getChatMessagesForHotel(user.hotelId, req.tenantId!, guestId);
      res.json(messages);
    } catch (error) {
      logger.error({ err: error }, "Error fetching chat messages for guest");
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Reception/Admin: Send message to a guest
  app.post("/api/chat/messages/:guestId", requireRole("reception", "admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.hotelId) {
        return res.status(400).json({ message: "No hotel assigned" });
      }
      
      const guestId = asString(req.params.guestId);
      const { message } = req.body;
      
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Verify the guest belongs to the same hotel
      const guest = await storage.getUser(guestId);
      if (!guest || guest.hotelId !== user.hotelId) {
        return res.status(403).json({ message: "Guest not found in your hotel" });
      }
      
      const chatMessage = await storage.createChatMessage({
        hotelId: user.hotelId,
        guestId: guestId,
        senderId: user.id,
        senderRole: user.role,
        message: message.trim(),
        tenantId: req.tenantId || user.tenantId || null,
      });

      try {
        const staffName = user.fullName || "Staff";
        const shortMsg = message.trim().length > 50 ? message.trim().substring(0, 50) + "..." : message.trim();
        await storage.createNotification({
          userId: guestId,
          tenantId: user.tenantId || null,
          title: `New message from ${staffName}`,
          message: shortMsg,
          type: "chat",
          actionUrl: "/guest/chat",
        });
        sendPushNotification({
          userIds: [String(guestId)],
          title: `New message from ${staffName}`,
          message: shortMsg,
          data: { type: "chat" },
        }).catch(err => logger.error({ err }, "OneSignal push error"));
      } catch (notifError) {
        logger.error({ err: notifError }, "Error creating guest chat notification");
      }
      
      res.json(chatMessage);
    } catch (error) {
      logger.error({ err: error }, "Error sending message to guest");
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Reception/Admin: Broadcast a message to ALL current guests
  app.post("/api/chat/broadcast", requireRole("reception", "admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.hotelId) {
        return res.status(400).json({ message: "No hotel assigned" });
      }
      const { message } = req.body;
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ message: "Message is required" });
      }
      const trimmed = message.trim();
      const tenantId = req.tenantId || user.tenantId || null;
      const guests = await storage.getGuestUsers(user.hotelId, tenantId ?? "");
      if (guests.length === 0) {
        return res.json({ count: 0, guestNames: [] });
      }
      const staffName = user.fullName || "Staff";
      const shortMsg = trimmed.length > 50 ? trimmed.substring(0, 50) + "..." : trimmed;
      const results: string[] = [];
      for (const guest of guests) {
        await storage.createChatMessage({
          hotelId: user.hotelId,
          guestId: guest.id,
          senderId: user.id,
          senderRole: user.role,
          message: trimmed,
          tenantId,
        });
        await storage.createNotification({
          userId: guest.id,
          tenantId,
          title: `New message from ${staffName}`,
          message: shortMsg,
          type: "chat",
          actionUrl: "/guest/chat",
        });
        results.push(guest.fullName || guest.username);
      }
      sendPushNotification({
        userIds: guests.map(g => String(g.id)),
        title: `New message from ${staffName}`,
        message: shortMsg,
        data: { type: "chat" },
      }).catch(err => logger.error({ err }, "OneSignal broadcast push error"));
      res.json({ count: guests.length, guestNames: results });
    } catch (error) {
      logger.error({ err: error }, "Error broadcasting message to guests");
      res.status(500).json({ message: "Failed to broadcast message" });
    }
  });

  // Reception/Admin: Get list of guests with chats
  app.get("/api/chat/guests", requireRole("reception", "admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      let hotelIds: string[] = [];
      if (user?.hotelId) {
        hotelIds = [user.hotelId];
      } else if (user?.role === "owner_admin" && user.ownerId) {
        const ownerProperties = await storage.getPropertiesByOwner(user.ownerId);
        for (const prop of ownerProperties) {
          const hotel = await storage.getHotelByPropertyId(prop.id);
          if (hotel) hotelIds.push(hotel.id);
        }
      }
      if (hotelIds.length === 0) {
        return res.json([]);
      }
      
      const allGuestsWithChats: { guestId: string; lastMessage: string; lastMessageAt: Date | null }[] = [];
      for (const hid of hotelIds) {
        const chats = await storage.getGuestsWithChats(hid, req.tenantId!);
        allGuestsWithChats.push(...chats);
      }
      
      // Enrich with guest details
      const enrichedGuests = await Promise.all(
        allGuestsWithChats.map(async (chat) => {
          const guest = await storage.getUser(chat.guestId);
          return {
            ...chat,
            guestName: guest?.fullName || "Unknown Guest",
            roomNumber: null as string | null,
          };
        })
      );
      
      // Get room numbers from bookings
      for (const guest of enrichedGuests) {
        const booking = await storage.getCurrentBookingForGuest(guest.guestId);
        if (booking) {
          guest.roomNumber = booking.roomNumber;
        }
      }
      
      res.json(enrichedGuests);
    } catch (error) {
      logger.error({ err: error }, "Error fetching guests with chats");
      res.status(500).json({ message: "Failed to fetch chat list" });
    }
  });

  // ============== INTERNAL CHAT ROUTES (Owner ↔ Staff) ==============

  app.get("/api/chat/internal", requireRole("reception", "admin", "owner_admin", "property_manager", "staff", "restaurant_manager", "kitchen_staff", "waiter", "restaurant_cleaner", "restaurant_cashier"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      let hotelIds: string[] = [];
      if (user?.hotelId) {
        hotelIds = [user.hotelId];
      } else if (user?.role === "owner_admin" && user.ownerId) {
        const ownerProperties = await storage.getPropertiesByOwner(user.ownerId);
        for (const prop of ownerProperties) {
          const hotel = await storage.getHotelByPropertyId(prop.id);
          if (hotel) hotelIds.push(hotel.id);
        }
      }
      if (hotelIds.length === 0) return res.json([]);
      const allMessages: any[] = [];
      for (const hid of hotelIds) {
        const msgs = await storage.getInternalMessages(hid, req.tenantId!);
        allMessages.push(...msgs);
      }
      allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      res.json(allMessages);
    } catch (error) {
      logger.error({ err: error }, "Error fetching internal chat");
      res.status(500).json({ message: "Failed to fetch internal messages" });
    }
  });

  app.post("/api/chat/internal", requireRole("reception", "admin", "owner_admin", "property_manager", "staff", "restaurant_manager", "kitchen_staff", "waiter", "restaurant_cleaner", "restaurant_cashier"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.hotelId && !(user?.role === "owner_admin")) {
        return res.status(400).json({ message: "No hotel assigned" });
      }
      const { message, hotelId: targetHotelId } = req.body;
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ message: "Message is required" });
      }
      const resolvedHotelId = user.hotelId || targetHotelId;
      if (!resolvedHotelId) {
        return res.status(400).json({ message: "Hotel ID required" });
      }
      const chatMessage = await storage.createChatMessage({
        hotelId: resolvedHotelId,
        guestId: "internal",
        senderId: user.id,
        senderRole: user.role,
        message: message.trim(),
        threadType: "internal",
        tenantId: req.tenantId || user.tenantId || null,
      });
      res.json(chatMessage);
    } catch (error) {
      logger.error({ err: error }, "Error sending internal message");
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ============== STAFF DM ROUTES (1-on-1 messaging) ==============

  function makeConversationKey(userId1: string, userId2: string): string {
    return `dm_${[userId1, userId2].sort().join("_")}`;
  }

  const STAFF_ROLES = ["reception", "admin", "owner_admin", "property_manager", "staff", "restaurant_manager", "kitchen_staff", "waiter", "restaurant_cleaner", "restaurant_cashier"];

  async function resolveHotelIds(user: any): Promise<string[]> {
    const hotelIds: string[] = [];
    if (user.hotelId) {
      hotelIds.push(user.hotelId);
    } else if (user.role === "owner_admin" && user.ownerId) {
      const ownerProperties = await storage.getPropertiesByOwner(user.ownerId);
      for (const prop of ownerProperties) {
        const hotel = await storage.getHotelByPropertyId(prop.id);
        if (hotel) hotelIds.push(hotel.id);
      }
    }
    return hotelIds;
  }

  async function validatePeerAccess(user: any, peer: any): Promise<{ valid: boolean; hotelId?: string; error?: string }> {
    if (!STAFF_ROLES.includes(peer.role)) {
      return { valid: false, error: "Can only message staff members" };
    }
    const userHotelIds = await resolveHotelIds(user);
    if (peer.hotelId && userHotelIds.includes(peer.hotelId)) {
      return { valid: true, hotelId: peer.hotelId };
    }
    if (user.hotelId && peer.hotelId && user.hotelId === peer.hotelId) {
      return { valid: true, hotelId: user.hotelId };
    }
    if (user.tenantId && peer.tenantId && user.tenantId === peer.tenantId) {
      const hotelId = user.hotelId || peer.hotelId || userHotelIds[0];
      if (hotelId) return { valid: true, hotelId };
    }
    return { valid: false, error: "Staff member not found in your organization" };
  }

  app.get("/api/chat/staff-dm/conversations", requireRole("reception", "admin", "owner_admin", "property_manager", "staff", "restaurant_manager", "kitchen_staff", "waiter", "restaurant_cleaner", "restaurant_cashier"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const hotelIds = await resolveHotelIds(user);
      const conversations = await storage.getStaffDmConversations(user.id, hotelIds);
      const enriched = await Promise.all(
        conversations.map(async (conv) => {
          const peer = await storage.getUser(conv.peerId);
          return {
            ...conv,
            peerName: peer?.fullName || "Unknown",
            peerRole: peer?.role || "staff",
          };
        })
      );
      res.json(enriched);
    } catch (error) {
      logger.error({ err: error }, "Error fetching staff DM conversations");
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/chat/staff-dm/:staffId", requireRole("reception", "admin", "owner_admin", "property_manager", "staff", "restaurant_manager", "kitchen_staff", "waiter", "restaurant_cleaner", "restaurant_cashier"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const staffId = asString(req.params.staffId);
      const peer = await storage.getUser(staffId);
      if (!peer) return res.status(404).json({ message: "Staff member not found" });

      const access = await validatePeerAccess(user, peer);
      if (!access.valid) return res.status(403).json({ message: access.error });

      const conversationKey = makeConversationKey(user.id, staffId);
      const messages = await storage.getStaffDmMessages(conversationKey, access.hotelId!);
      res.json(messages);
    } catch (error) {
      logger.error({ err: error }, "Error fetching staff DM messages");
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat/staff-dm/:staffId", requireRole("reception", "admin", "owner_admin", "property_manager", "staff", "restaurant_manager", "kitchen_staff", "waiter", "restaurant_cleaner", "restaurant_cashier"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const staffId = asString(req.params.staffId);
      const { message } = req.body;
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ message: "Message is required" });
      }
      const peer = await storage.getUser(staffId);
      if (!peer) return res.status(404).json({ message: "Staff member not found" });

      const access = await validatePeerAccess(user, peer);
      if (!access.valid) return res.status(403).json({ message: access.error });
      const hotelId = access.hotelId!;

      const conversationKey = makeConversationKey(user.id, staffId);
      const chatMessage = await storage.createChatMessage({
        hotelId,
        guestId: conversationKey,
        senderId: user.id,
        senderRole: user.role,
        message: message.trim(),
        threadType: "staff_dm",
        tenantId: req.tenantId || user.tenantId || null,
      });

      try {
        const senderName = user.fullName || "Staff";
        const shortMsg = message.trim().length > 50 ? message.trim().substring(0, 50) + "..." : message.trim();
        await storage.createNotification({
          userId: staffId,
          tenantId: user.tenantId || null,
          title: `Message from ${senderName}`,
          message: shortMsg,
          type: "chat",
          actionUrl: `/dashboard?view=staff-messages&staffId=${user.id}`,
        });
        broadcastToUser(String(staffId), {
          type: "new_notification",
          title: `Message from ${senderName}`,
          message: shortMsg,
        });
        sendPushNotification({
          userIds: [String(staffId)],
          title: `Message from ${senderName}`,
          message: shortMsg,
          data: { type: "staff_dm", senderId: String(user.id) },
        }).catch(err => logger.error({ err }, "OneSignal push error"));
      } catch (notifError) {
        logger.error({ err: notifError }, "Error creating staff DM notification");
      }

      res.json(chatMessage);
    } catch (error) {
      logger.error({ err: error }, "Error sending staff DM");
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ============== BROADCAST MESSAGE TO ALL STAFF ==============

  app.post("/api/chat/staff-broadcast", requireRole("owner_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "owner_admin" || !user.ownerId) {
        return res.status(403).json({ message: "Only owners can broadcast messages" });
      }
      const { message } = req.body;
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ message: "Message is required" });
      }

      const hotelIds = await resolveHotelIds(user);
      if (hotelIds.length === 0) {
        return res.status(400).json({ message: "No properties found" });
      }

      const staffWithHotels: { staffId: string; hotelId: string }[] = [];
      const seenStaffIds = new Set<string>();
      for (const hid of hotelIds) {
        const hotelUsers = await storage.getUsersByHotel(hid, req.tenantId!);
        for (const u of hotelUsers) {
          if (u.id !== user.id && STAFF_ROLES.includes(u.role) && !seenStaffIds.has(u.id)) {
            seenStaffIds.add(u.id);
            staffWithHotels.push({ staffId: u.id, hotelId: u.hotelId || hid });
          }
        }
      }

      const sentMessages: any[] = [];
      const senderName = user.fullName || "Owner";
      const shortMsg = message.trim().length > 50 ? message.trim().substring(0, 50) + "..." : message.trim();

      for (const { staffId, hotelId: staffHotelId } of staffWithHotels) {
        const conversationKey = makeConversationKey(user.id, staffId);
        const chatMessage = await storage.createChatMessage({
          hotelId: staffHotelId,
          guestId: conversationKey,
          senderId: user.id,
          senderRole: user.role,
          message: message.trim(),
          threadType: "staff_dm",
          tenantId: req.tenantId || user.tenantId || null,
        });
        sentMessages.push(chatMessage);

        try {
          await storage.createNotification({
            userId: staffId,
            tenantId: user.tenantId || null,
            title: `Broadcast from ${senderName}`,
            message: shortMsg,
            type: "chat",
            actionUrl: `/dashboard?view=staff-chat&staffId=${user.id}`,
          });
        } catch (notifError) {
          logger.error({ err: notifError }, "Error creating broadcast notification");
        }
      }

      try {
        sendPushNotification({
          userIds: Array.from(seenStaffIds).map(String),
          title: `Broadcast from ${senderName}`,
          message: shortMsg,
          data: { type: "staff_broadcast", senderId: String(user.id) },
        }).catch(err => logger.error({ err }, "OneSignal push error"));
      } catch (pushErr) {
        logger.error({ err: pushErr }, "Push notification error");
      }

      res.json({ sent: sentMessages.length, staffCount: seenStaffIds.size });
    } catch (error) {
      logger.error({ err: error }, "Error broadcasting message");
      res.status(500).json({ message: "Failed to broadcast message" });
    }
  });

  // ============== ESCALATION ROUTES ==============

  app.get("/api/chat/escalations", requireRole("owner_admin", "admin", "property_manager", "reception", "staff"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      let hotelIds: string[] = [];
      if (user?.hotelId) {
        hotelIds = [user.hotelId];
      } else if (user?.role === "owner_admin" && user.ownerId) {
        const ownerProperties = await storage.getPropertiesByOwner(user.ownerId);
        for (const prop of ownerProperties) {
          const hotel = await storage.getHotelByPropertyId(prop.id);
          if (hotel) hotelIds.push(hotel.id);
        }
      }
      if (hotelIds.length === 0) return res.json([]);
      const allMessages: any[] = [];
      for (const hid of hotelIds) {
        const msgs = await storage.getEscalationMessages(hid, req.tenantId!);
        allMessages.push(...msgs);
      }
      allMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const enriched = await Promise.all(
        allMessages.map(async (msg: any) => {
          const sender = await storage.getUser(msg.senderId);
          const escalator = msg.escalatedBy ? await storage.getUser(msg.escalatedBy) : null;
          return {
            ...msg,
            senderName: sender?.fullName || "Unknown",
            escalatedByName: escalator?.fullName || null,
          };
        })
      );
      res.json(enriched);
    } catch (error) {
      logger.error({ err: error }, "Error fetching escalations");
      res.status(500).json({ message: "Failed to fetch escalations" });
    }
  });

  app.post("/api/chat/escalate", requireRole("reception", "admin", "staff"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.hotelId) {
        return res.status(400).json({ message: "No hotel assigned" });
      }
      const { guestId, message, escalationNote } = req.body;
      if (!guestId || !message) {
        return res.status(400).json({ message: "Guest ID and message are required" });
      }
      const guest = await storage.getUser(guestId);
      if (!guest || guest.hotelId !== user.hotelId) {
        return res.status(403).json({ message: "Guest not found in your hotel" });
      }
      const chatMessage = await storage.createChatMessage({
        hotelId: user.hotelId,
        guestId: guestId,
        senderId: user.id,
        senderRole: user.role,
        message: message.trim(),
        threadType: "escalation",
        escalatedBy: user.id,
        escalationNote: escalationNote || null,
        tenantId: req.tenantId || user.tenantId || null,
      });
      res.json(chatMessage);
    } catch (error) {
      logger.error({ err: error }, "Error creating escalation");
      res.status(500).json({ message: "Failed to escalate" });
    }
  });

  app.get("/api/escalations/:id/replies", requireAuth, async (req, res) => {
    try {
      const id = asString(req.params.id);

      const escalation = await storage.getEscalation(id);
      if (!escalation) {
        return res.status(404).json({ message: "Escalation not found" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (user.role !== "oss_super_admin" && escalation.hotelId !== user.hotelId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const replies = await storage.getEscalationReplies(id);
      const enriched = await Promise.all(
        replies.map(async (reply) => {
          const replyUser = await storage.getUser(reply.userId);
          return {
            ...reply,
            userName: replyUser?.fullName || "Unknown",
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      logger.error({ err: error }, "Error fetching escalation replies");
      res.status(500).json({ message: "Failed to fetch replies" });
    }
  });

  app.post("/api/escalations/:id/reply", requireAuth, async (req, res) => {
    try {
      const id = asString(req.params.id);
      const { message } = req.body;
      
      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Message is required" });
      }

      const escalation = await storage.getEscalation(id);
      if (!escalation) {
        return res.status(404).json({ message: "Escalation not found" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (user.role !== "oss_super_admin" && escalation.hotelId !== user.hotelId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const reply = await storage.createEscalationReply({
        escalationId: id,
        userId: req.session.userId!,
        message: message.trim(),
      });

      res.json({
        ...reply,
        userName: user?.fullName || "Unknown",
      });
    } catch (error) {
      logger.error({ err: error }, "Error creating escalation reply");
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  app.patch("/api/escalations/:id/status", requireRole("owner_admin", "admin", "property_manager"), async (req, res) => {
    try {
      const id = asString(req.params.id);
      const { status, assignedTo } = req.body;

      if (!status || !["open", "in_progress", "resolved", "closed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const escalation = await storage.getEscalation(id);
      if (!escalation) {
        return res.status(404).json({ message: "Escalation not found" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (user.role !== "oss_super_admin" && escalation.hotelId !== user.hotelId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (req.tenantId && escalation.tenantId && escalation.tenantId !== req.tenantId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updates: Partial<typeof escalation> = {
        status,
      };

      if (assignedTo !== undefined) {
        updates.assignedTo = assignedTo || null;
      }

      const updated = await storage.updateEscalation(id, updates);
      res.json(updated);
    } catch (error) {
      logger.error({ err: error }, "Error updating escalation status");
      res.status(500).json({ message: "Failed to update escalation" });
    }
  });

}
