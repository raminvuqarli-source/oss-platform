import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, requireRole } from "../middleware";
import { logger } from "../utils/logger";
import { broadcastToProperty } from "../websocket/index";
import { sendPushNotification } from "../onesignal";

const MANAGER_ROLES = ["restaurant_manager", "owner_admin", "admin", "reception", "property_manager"];
const KITCHEN_ROLES = ["kitchen_staff", "restaurant_manager", "owner_admin", "admin"];
const WAITER_ROLES = ["waiter", "restaurant_manager", "owner_admin", "admin"];
const SETTLE_ROLES = ["reception", "restaurant_manager", "owner_admin", "admin", "restaurant_cashier"];

function requireRestaurantRole(...roles: string[]) {
  return requireRole(...(roles as [string, ...string[]]));
}

async function resolvePropertyId(user: { propertyId?: string | null; hotelId?: string | null }): Promise<string | null> {
  if (user.propertyId) return user.propertyId;
  if (user.hotelId) {
    const hotel = await storage.getHotel(user.hotelId);
    if (hotel?.propertyId) return hotel.propertyId;
  }
  return null;
}

export function registerRestaurantRoutes(app: Express): void {

  // ─── MENU CATEGORIES ─────────────────────────────────────────────────

  app.get("/api/restaurant/menu", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const propertyId = await resolvePropertyId(user);
      if (!propertyId) return res.status(400).json({ message: "No property linked" });
      const categories = await storage.getPosMenuCategories(propertyId);
      const items = await storage.getPosMenuItems(propertyId);
      res.json({ categories, items });
    } catch (err) {
      logger.error({ err }, "Failed to fetch restaurant menu");
      res.status(500).json({ message: "Failed to load menu" });
    }
  });

  app.post("/api/restaurant/menu/categories", requireRestaurantRole(...MANAGER_ROLES), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.propertyId) return res.status(400).json({ message: "No property linked" });
      const { name, sortOrder } = req.body;
      if (!name) return res.status(400).json({ message: "Category name is required" });
      const cat = await storage.createPosMenuCategory({
        tenantId: user.tenantId || user.ownerId || "",
        propertyId: user.propertyId,
        name,
        sortOrder: sortOrder || 0,
      });
      res.status(201).json(cat);
    } catch (err) {
      logger.error({ err }, "Failed to create menu category");
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.patch("/api/restaurant/menu/categories/:id", requireRestaurantRole(...MANAGER_ROLES), async (req, res) => {
    try {
      const { name, sortOrder, isActive } = req.body;
      const cat = await storage.updatePosMenuCategory(req.params.id, { name, sortOrder, isActive });
      if (!cat) return res.status(404).json({ message: "Category not found" });
      res.json(cat);
    } catch (err) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/restaurant/menu/categories/:id", requireRestaurantRole(...MANAGER_ROLES), async (req, res) => {
    try {
      await storage.deletePosMenuCategory(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // ─── MENU ITEMS ───────────────────────────────────────────────────────

  app.post("/api/restaurant/menu/items", requireRestaurantRole(...MANAGER_ROLES), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.propertyId) return res.status(400).json({ message: "No property linked" });
      const { name, description, priceCents, categoryId, imageUrl } = req.body;
      if (!name || !priceCents) return res.status(400).json({ message: "Name and price are required" });
      const item = await storage.createPosMenuItem({
        tenantId: user.tenantId || user.ownerId || "",
        propertyId: user.propertyId,
        name,
        description: description || null,
        priceCents,
        categoryId: categoryId || null,
        imageUrl: imageUrl || null,
      });
      res.status(201).json(item);
    } catch (err) {
      logger.error({ err }, "Failed to create menu item");
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  app.patch("/api/restaurant/menu/items/:id", requireRestaurantRole(...MANAGER_ROLES), async (req, res) => {
    try {
      const { name, description, priceCents, categoryId, isAvailable, imageUrl } = req.body;
      const item = await storage.updatePosMenuItem(req.params.id, { name, description, priceCents, categoryId, isAvailable, imageUrl });
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json(item);
    } catch (err) {
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  app.delete("/api/restaurant/menu/items/:id", requireRestaurantRole(...MANAGER_ROLES), async (req, res) => {
    try {
      await storage.deletePosMenuItem(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // ─── ORDERS ───────────────────────────────────────────────────────────

  // Guest or any authenticated user submits an order
  app.post("/api/restaurant/orders", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const propertyId = await resolvePropertyId(user);
      if (!propertyId) return res.status(400).json({ message: "No property linked" });

      const { tableNumber, roomNumber, orderType, guestName, bookingId, notes, items } = req.body;
      if (!items || items.length === 0) return res.status(400).json({ message: "Order must have at least one item" });

      const orderItems = items as Array<{ menuItemId?: string; itemName: string; quantity: number; unitPriceCents: number }>;
      const totalCents = orderItems.reduce((sum, it) => sum + it.unitPriceCents * it.quantity, 0);

      const order = await storage.createPosOrder(
        {
          tenantId: user.tenantId || user.ownerId || "",
          propertyId,
          tableNumber: tableNumber || null,
          roomNumber: roomNumber || null,
          orderType: orderType || (tableNumber ? "dine_in" : "room_delivery"),
          guestName: guestName || user.fullName || null,
          bookingId: bookingId || null,
          notes: notes || null,
          totalCents,
          kitchenStatus: "pending",
          settlementStatus: "pending",
        },
        orderItems.map(it => ({
          orderId: "",
          menuItemId: it.menuItemId || null,
          itemName: it.itemName,
          quantity: it.quantity,
          unitPriceCents: it.unitPriceCents,
          totalCents: it.unitPriceCents * it.quantity,
        }))
      );

      broadcastToProperty(propertyId, {
        type: "RESTAURANT_NEW_ORDER",
        order: { ...order, items: orderItems },
        timestamp: new Date().toISOString(),
      });

      const allStaff = await storage.getUsersByProperty(propertyId);
      const locationLabel = tableNumber ? `Masa ${tableNumber}` : roomNumber ? `Otaq ${roomNumber}` : "Aparma";
      const itemSummary = orderItems.slice(0, 3).map(i => `${i.quantity}x ${i.itemName}`).join(", ");
      const orderSummary = `${locationLabel}: ${itemSummary}${orderItems.length > 3 ? ` +${orderItems.length - 3}` : ""}`;

      const kitchenIds = allStaff
        .filter(u => u.role === "kitchen_staff" || u.role === "restaurant_manager")
        .map(u => u.id);
      if (kitchenIds.length > 0) {
        sendPushNotification({
          userIds: kitchenIds,
          title: "🍽️ Yeni sifariş",
          message: orderSummary,
          url: "/restaurant/kitchen",
          data: { type: "RESTAURANT_NEW_ORDER", orderId: order.id },
        }).catch(err => logger.error({ err }, "Kitchen order push failed"));
      }

      const cashierIds = allStaff
        .filter(u => u.role === "restaurant_cashier")
        .map(u => u.id);
      if (cashierIds.length > 0) {
        sendPushNotification({
          userIds: cashierIds,
          title: "💰 Yeni sifariş gəldi",
          message: orderSummary,
          url: "/restaurant/cashier",
          data: { type: "RESTAURANT_NEW_ORDER", orderId: order.id },
        }).catch(err => logger.error({ err }, "Cashier order push failed"));
      }

      logger.info({ orderId: order.id, propertyId }, "New restaurant order created");
      res.status(201).json(order);
    } catch (err) {
      logger.error({ err }, "Failed to create order");
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/restaurant/orders", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.propertyId) return res.status(400).json({ message: "No property linked" });
      const { kitchenStatus, settlementStatus } = req.query as Record<string, string>;
      const orders = await storage.getPosOrders(user.propertyId, {
        kitchenStatus: kitchenStatus || undefined,
        settlementStatus: settlementStatus || undefined,
      });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/restaurant/orders/:id", requireAuth, async (req, res) => {
    try {
      const order = await storage.getPosOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Kitchen marks order as cooking / ready
  app.patch("/api/restaurant/orders/:id/kitchen-status", requireRestaurantRole(...KITCHEN_ROLES), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      const { status } = req.body;
      const allowed = ["cooking", "ready"];
      if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status. Use: cooking | ready" });

      const order = await storage.updatePosOrderKitchenStatus(req.params.id, status);
      if (!order) return res.status(404).json({ message: "Order not found" });

      if (status === "ready") {
        broadcastToProperty(order.propertyId, {
          type: "RESTAURANT_ORDER_READY",
          order,
          timestamp: new Date().toISOString(),
        });

        // Notify waiters that this order is ready for pickup
        const allStaff = await storage.getUsersByProperty(order.propertyId);
        const waiterIds = allStaff
          .filter(u => u.role === "waiter" || u.role === "restaurant_manager")
          .map(u => u.id);
        if (waiterIds.length > 0) {
          const locationLabel = order.tableNumber ? `Masa ${order.tableNumber}` : order.roomNumber ? `Otaq ${order.roomNumber}` : "";
          sendPushNotification({
            userIds: waiterIds,
            title: "✅ Sifariş hazırdır!",
            message: `${locationLabel ? locationLabel + " — " : ""}Təhvil vermək üçün götürün`,
            url: "/restaurant/waiter",
            data: { type: "RESTAURANT_ORDER_READY", orderId: order.id },
          }).catch(err => logger.error({ err }, "Waiter ready push failed"));
        }
      }
      res.json(order);
    } catch (err) {
      logger.error({ err }, "Failed to update kitchen status");
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Waiter claims and delivers an order
  app.patch("/api/restaurant/orders/:id/deliver", requireRestaurantRole(...WAITER_ROLES), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      // Assign waiter if not already assigned
      await storage.updatePosOrderWaiter(req.params.id, user!.id);
      const order = await storage.updatePosOrderKitchenStatus(req.params.id, "delivered");
      if (!order) return res.status(404).json({ message: "Order not found" });

      broadcastToProperty(order.propertyId, {
        type: "RESTAURANT_ORDER_DELIVERED",
        order,
        waiterId: user!.id,
        waiterName: user!.fullName,
        timestamp: new Date().toISOString(),
      });

      // Notify restaurant_manager that an order was delivered
      const allStaff = await storage.getUsersByProperty(order.propertyId);
      const managerIds = allStaff
        .filter(u => u.role === "restaurant_manager")
        .map(u => u.id);
      if (managerIds.length > 0) {
        const locationLabel = order.tableNumber ? `Masa ${order.tableNumber}` : order.roomNumber ? `Otaq ${order.roomNumber}` : "Sifariş";
        sendPushNotification({
          userIds: managerIds,
          title: "🚀 Sifariş təhvil verildi",
          message: `${locationLabel} — ${user!.fullName || "Qarson"} tərəfindən çatdırıldı`,
          url: "/restaurant/manager",
          data: { type: "RESTAURANT_ORDER_DELIVERED", orderId: order.id },
        }).catch(err => logger.error({ err }, "Manager delivery push failed"));
      }

      res.json(order);
    } catch (err) {
      logger.error({ err }, "Failed to mark order delivered");
      res.status(500).json({ message: "Failed to deliver order" });
    }
  });

  // Reception/cashier settles an order
  app.post("/api/restaurant/orders/:id/settle", requireRestaurantRole(...SETTLE_ROLES), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      const { paymentType, folioId } = req.body;
      if (!paymentType) return res.status(400).json({ message: "paymentType required: room_charge | cash | card" });

      const existing = await storage.getPosOrder(req.params.id);
      if (!existing) return res.status(404).json({ message: "Order not found" });
      if (existing.settlementStatus !== "pending") {
        return res.status(409).json({ message: "Order already settled" });
      }

      let settlementStatus = paymentType === "card" ? "card_paid" : "cash_paid";
      let linkedFolioId: string | undefined;

      if (paymentType === "room_charge") {
        // Post charge to guest folio — appears as debt in Reception
        let targetFolioId = folioId;
        if (!targetFolioId && existing.bookingId) {
          const folio = await storage.getGuestFolioByBooking(existing.bookingId);
          if (folio && folio.status === "open") targetFolioId = folio.id;
        }
        if (targetFolioId) {
          await storage.createFolioCharge({
            folioId: targetFolioId,
            chargeType: "restaurant",
            description: `Restoran sifarişi #${existing.id.slice(-6).toUpperCase()} — ${existing.roomNumber ? `Otaq ${existing.roomNumber}` : existing.tableNumber ? `Masa ${existing.tableNumber}` : "N/A"}`,
            amount: String(existing.totalCents / 100),
            quantity: 1,
            unitPrice: String(existing.totalCents / 100),
            taxRate: "0",
            taxAmount: "0",
            totalAmount: String(existing.totalCents / 100),
            status: "posted",
            idempotencyKey: `pos-order-${existing.id}`,
          });
          settlementStatus = "posted_to_folio";
          linkedFolioId = targetFolioId;
        }
      } else {
        // Cash or card — record in General Ledger for hotel-wide finance
        try {
          const hotel = await storage.getHotelByPropertyId(existing.propertyId);
          if (hotel) {
            const payLabel = paymentType === "card" ? "kart" : "nağd";
            const locationLabel = existing.roomNumber ? `Otaq ${existing.roomNumber}` : existing.tableNumber ? `Masa ${existing.tableNumber}` : "N/A";
            await storage.createJournalEntry(
              {
                hotelId: hotel.id,
                tenantId: existing.tenantId,
                entryNumber: `REST-${Date.now()}`,
                entryDate: new Date(),
                description: `Restoran gəliri (${payLabel}) — Sifariş #${existing.id.slice(-6).toUpperCase()} ${locationLabel}`,
                sourceType: "restaurant_order",
                sourceId: existing.id,
                status: "posted",
                totalDebit: existing.totalCents,
                totalCredit: existing.totalCents,
                currency: "AZN",
                createdBy: user?.id,
              },
              [
                { accountCode: paymentType === "card" ? "1020" : "1010", accountName: paymentType === "card" ? "Kart Kassası" : "Nağd Kassa", type: "debit", amount: existing.totalCents, description: `Restoran ${payLabel} qəbzi` },
                { accountCode: "4010", accountName: "Restoran Gəliri", type: "credit", amount: existing.totalCents, description: `Sifariş #${existing.id.slice(-6).toUpperCase()}` },
              ]
            );
          }
        } catch (glErr) {
          logger.error({ glErr }, "GL journal entry failed for restaurant payment — continuing");
        }
      }

      const order = await storage.settlePosOrder(req.params.id, settlementStatus, linkedFolioId);

      // Notify restaurant_manager about payment outcome
      const allStaff = await storage.getUsersByProperty(existing.propertyId);
      const managerIds = allStaff.filter(u => u.role === "restaurant_manager").map(u => u.id);
      if (managerIds.length > 0) {
        const locationLabel = existing.roomNumber ? `Otaq ${existing.roomNumber}` : existing.tableNumber ? `Masa ${existing.tableNumber}` : "Sifariş";
        const amountLabel = `₼${(existing.totalCents / 100).toFixed(2)}`;
        const msgMap: Record<string, string> = {
          cash: `${locationLabel} — ${amountLabel} nağd ödənildi`,
          card: `${locationLabel} — ${amountLabel} kartla ödənildi`,
          room_charge: `${locationLabel} — ${amountLabel} otaq hesabına borc yazıldı`,
        };
        sendPushNotification({
          userIds: managerIds,
          title: paymentType === "room_charge" ? "🏨 Borc yazıldı" : "✅ Ödəniş alındı",
          message: msgMap[paymentType] ?? `${locationLabel} — ${amountLabel} ödənildi`,
          url: "/restaurant/manager",
          data: { type: "RESTAURANT_ORDER_SETTLED", orderId: existing.id, paymentType },
        }).catch(err => logger.error({ err }, "Manager settle push failed"));
      }

      broadcastToProperty(existing.propertyId, {
        type: "RESTAURANT_ORDER_SETTLED",
        order,
        paymentType,
        timestamp: new Date().toISOString(),
      });

      res.json(order);
    } catch (err) {
      logger.error({ err }, "Failed to settle order");
      res.status(500).json({ message: "Failed to settle order" });
    }
  });

  // ─── WAITER CALLS ─────────────────────────────────────────────────────

  app.post("/api/restaurant/waiter-call", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const propertyId = await resolvePropertyId(user);
      if (!propertyId) return res.status(400).json({ message: "No property linked" });

      const { tableNumber, roomNumber, bookingId } = req.body;
      const call = await storage.createWaiterCall({
        tenantId: user.tenantId || user.ownerId || "",
        propertyId,
        tableNumber: tableNumber || null,
        roomNumber: roomNumber || null,
        bookingId: bookingId || null,
        status: "pending",
      });

      broadcastToProperty(propertyId, {
        type: "RESTAURANT_CALL_WAITER",
        call,
        guestName: user.fullName,
        tableNumber,
        roomNumber,
        timestamp: new Date().toISOString(),
      });

      res.status(201).json(call);
    } catch (err) {
      logger.error({ err }, "Failed to create waiter call");
      res.status(500).json({ message: "Failed to call waiter" });
    }
  });

  app.get("/api/restaurant/waiter-calls", requireRestaurantRole(...WAITER_ROLES, ...MANAGER_ROLES), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.propertyId) return res.status(400).json({ message: "No property linked" });
      const { status } = req.query as { status?: string };
      const calls = await storage.getWaiterCalls(user.propertyId, status);
      res.json(calls);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch waiter calls" });
    }
  });

  app.patch("/api/restaurant/waiter-calls/:id/acknowledge", requireRestaurantRole(...WAITER_ROLES, ...MANAGER_ROLES), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      const call = await storage.acknowledgeWaiterCall(req.params.id, user!.id);
      if (!call) return res.status(404).json({ message: "Call not found" });

      broadcastToProperty(call.propertyId, {
        type: "RESTAURANT_WAITER_ACKNOWLEDGED",
        call,
        acknowledgedBy: user!.fullName,
        timestamp: new Date().toISOString(),
      });

      res.json(call);
    } catch (err) {
      res.status(500).json({ message: "Failed to acknowledge call" });
    }
  });

  // ─── ROOM ORDERS VIEW ─────────────────────────────────────────────────
  // Manager sees all orders from room numbers (room_delivery type)
  app.get("/api/restaurant/room-orders", requireRestaurantRole(...MANAGER_ROLES, "restaurant_cashier"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.propertyId) return res.status(400).json({ message: "No property linked" });
      const orders = await storage.getPosOrders(user.propertyId);
      const roomOrders = orders.filter(o => o.roomNumber && o.settlementStatus === "pending");
      // Group by room
      const grouped: Record<string, { roomNumber: string; orders: typeof orders; totalCents: number }> = {};
      for (const o of roomOrders) {
        const room = o.roomNumber!;
        if (!grouped[room]) grouped[room] = { roomNumber: room, orders: [], totalCents: 0 };
        grouped[room].orders.push(o);
        grouped[room].totalCents += o.totalCents;
      }
      res.json(Object.values(grouped));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch room orders" });
    }
  });

  // ─── CLEANING TASKS ───────────────────────────────────────────────────
  const CLEANING_ROLES = ["restaurant_cleaner", "restaurant_manager", "owner_admin", "admin", "restaurant_cashier"];

  app.get("/api/restaurant/cleaning-tasks", requireRestaurantRole(...CLEANING_ROLES), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.propertyId) return res.status(400).json({ message: "No property linked" });
      const isCleaner = user.role === "restaurant_cleaner";
      const tasks = await storage.getRestaurantCleaningTasks(
        user.propertyId,
        isCleaner ? user.id : undefined
      );
      res.json(tasks);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch cleaning tasks" });
    }
  });

  app.post("/api/restaurant/cleaning-tasks", requireRestaurantRole(...MANAGER_ROLES, "restaurant_cashier"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.propertyId) return res.status(400).json({ message: "No property linked" });
      const { description, location, assignedToId } = req.body;
      if (!description) return res.status(400).json({ message: "Description is required" });
      const task = await storage.createRestaurantCleaningTask({
        tenantId: user.tenantId || user.ownerId || "",
        propertyId: user.propertyId!,
        description,
        location: location || null,
        assignedToId: assignedToId || null,
        createdById: user.id,
        status: "pending",
      });

      broadcastToProperty(user.propertyId!, {
        type: "RESTAURANT_CLEANING_TASK_CREATED",
        task,
        timestamp: new Date().toISOString(),
      });

      if (assignedToId) {
        sendPushNotification({
          userIds: [assignedToId],
          title: "🧹 Yeni temizlik tapşırığı",
          message: description + (location ? ` — ${location}` : ""),
          url: "/restaurant/cleaner",
          data: { type: "CLEANING_TASK_ASSIGNED", taskId: task.id },
        }).catch(err => logger.error({ err }, "Cleaning task assign push failed"));
      } else {
        const allStaff = await storage.getUsersByProperty(user.propertyId);
        const cleanerIds = allStaff
          .filter(u => u.role === "restaurant_cleaner")
          .map(u => u.id);
        if (cleanerIds.length > 0) {
          sendPushNotification({
            userIds: cleanerIds,
            title: "🧹 Yeni temizlik tapşırığı",
            message: description + (location ? ` — ${location}` : ""),
            url: "/restaurant/cleaner",
            data: { type: "CLEANING_TASK_ASSIGNED", taskId: task.id },
          }).catch(err => logger.error({ err }, "Cleaning task broadcast push failed"));
        }
      }

      res.status(201).json(task);
    } catch (err) {
      res.status(500).json({ message: "Failed to create cleaning task" });
    }
  });

  app.patch("/api/restaurant/cleaning-tasks/:id", requireRestaurantRole(...CLEANING_ROLES), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.propertyId) return res.status(400).json({ message: "No property linked" });
      const { status, photoUrl } = req.body;
      const updates: Record<string, unknown> = {};
      if (status) updates.status = status;
      if (photoUrl) updates.photoUrl = photoUrl;
      if (status === "done") updates.completedAt = new Date();
      const task = await storage.updateRestaurantCleaningTask(req.params.id, updates);
      if (!task) return res.status(404).json({ message: "Task not found" });

      broadcastToProperty(task.propertyId, {
        type: "RESTAURANT_CLEANING_TASK_UPDATED",
        task,
        timestamp: new Date().toISOString(),
      });

      if (status === "done" || status === "in_progress") {
        const allStaff = await storage.getUsersByProperty(task.propertyId);
        const managerIds = allStaff
          .filter(u => u.role === "restaurant_manager" || u.role === "owner_admin")
          .map(u => u.id);

        if (task.createdById && !managerIds.includes(task.createdById)) {
          managerIds.push(task.createdById);
        }

        const notifyIds = [...new Set(managerIds)];

        if (notifyIds.length > 0) {
          const statusLabel = status === "done" ? "✅ Tapşırıq tamamlandı" : "🔄 Tapşırıq başladı";
          const cleanerName = user.fullName || user.username || "Temizlikçi";
          sendPushNotification({
            userIds: notifyIds,
            title: statusLabel,
            message: `${cleanerName}: ${task.description}${task.location ? ` — ${task.location}` : ""}`,
            url: "/restaurant/manager",
            data: { type: "CLEANING_TASK_UPDATED", taskId: task.id, newStatus: status },
          }).catch(err => logger.error({ err }, "Cleaning task done push failed"));
        }
      }

      res.json(task);
    } catch (err) {
      res.status(500).json({ message: "Failed to update cleaning task" });
    }
  });

  // ─── STAFF PROFILES ───────────────────────────────────────────────────

  app.get("/api/restaurant/staff-profiles", requireRestaurantRole(...MANAGER_ROLES), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.propertyId) return res.status(400).json({ message: "No property linked" });
      const profiles = await storage.getRestaurantStaffProfiles(user.propertyId);
      res.json(profiles);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch staff profiles" });
    }
  });

  app.put("/api/restaurant/staff-profiles/:userId", requireRestaurantRole(...MANAGER_ROLES), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.propertyId) return res.status(400).json({ message: "No property linked" });
      const { salaryAmount, taxRate, tablesAssigned, notes } = req.body;
      const profile = await storage.upsertRestaurantStaffProfile({
        userId: req.params.userId,
        propertyId: user.propertyId,
        salaryAmount: salaryAmount || "0",
        taxRate: taxRate || "0",
        tablesAssigned: tablesAssigned || null,
        notes: notes || null,
      });
      res.json(profile);
    } catch (err) {
      res.status(500).json({ message: "Failed to save staff profile" });
    }
  });

  // ─── ANALYTICS ────────────────────────────────────────────────────────

  app.get("/api/restaurant/analytics", requireRestaurantRole(...MANAGER_ROLES, "restaurant_cashier"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.propertyId) return res.status(400).json({ message: "No property linked" });

      const allOrders = await storage.getPosOrders(user.propertyId);
      const today = new Date().toDateString();
      const todayOrders = allOrders.filter(o => new Date(o.createdAt!).toDateString() === today);

      const totalRevenueCents = todayOrders
        .filter(o => o.settlementStatus !== "cancelled" && o.settlementStatus !== "pending")
        .reduce((s, o) => s + o.totalCents, 0);

      const byStatus = {
        pending: allOrders.filter(o => o.kitchenStatus === "pending").length,
        cooking: allOrders.filter(o => o.kitchenStatus === "cooking").length,
        ready: allOrders.filter(o => o.kitchenStatus === "ready").length,
        delivered: allOrders.filter(o => o.kitchenStatus === "delivered").length,
      };

      const pendingSettlement = allOrders.filter(
        o => o.kitchenStatus === "delivered" && o.settlementStatus === "pending"
      ).length;

      // Monthly breakdown for finance tab
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthOrders = allOrders.filter(o => new Date(o.createdAt!) >= monthStart);
      const monthRevenueCents = monthOrders
        .filter(o => o.settlementStatus !== "cancelled" && o.settlementStatus !== "pending")
        .reduce((s, o) => s + o.totalCents, 0);

      // By payment type
      const cashCents = allOrders.filter(o => o.settlementStatus === "cash_paid")
        .reduce((s, o) => s + o.totalCents, 0);
      const cardCents = allOrders.filter(o => o.settlementStatus === "card_paid")
        .reduce((s, o) => s + o.totalCents, 0);
      const roomChargeCents = allOrders.filter(o => o.settlementStatus === "posted_to_folio")
        .reduce((s, o) => s + o.totalCents, 0);

      res.json({
        today: { orderCount: todayOrders.length, revenueCents: totalRevenueCents },
        month: { orderCount: monthOrders.length, revenueCents: monthRevenueCents },
        activeOrders: byStatus,
        pendingSettlement,
        totalAllTime: allOrders.filter(o => !["cancelled","pending"].includes(o.settlementStatus)).reduce((s,o)=>s+o.totalCents,0),
        byPaymentType: { cashCents, cardCents, roomChargeCents },
      });
    } catch (err) {
      logger.error({ err }, "Failed to fetch restaurant analytics");
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
}
