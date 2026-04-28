import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, requireRole } from "../middleware";
import { logger } from "../utils/logger";
import { broadcastToProperty } from "../websocket/index";

const MANAGER_ROLES = ["restaurant_manager", "owner_admin", "admin"];
const KITCHEN_ROLES = ["kitchen_staff", "restaurant_manager", "owner_admin", "admin"];
const WAITER_ROLES = ["waiter", "restaurant_manager", "owner_admin", "admin"];
const SETTLE_ROLES = ["reception", "restaurant_manager", "owner_admin", "admin"];

function requireRestaurantRole(...roles: string[]) {
  return requireRole(...(roles as [string, ...string[]]));
}

export function registerRestaurantRoutes(app: Express): void {

  // ─── MENU CATEGORIES ─────────────────────────────────────────────────

  app.get("/api/restaurant/menu", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user?.propertyId) return res.status(400).json({ message: "No property linked" });
      const categories = await storage.getPosMenuCategories(user.propertyId);
      const items = await storage.getPosMenuItems(user.propertyId);
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
      if (!user?.propertyId) return res.status(400).json({ message: "No property linked" });

      const { tableNumber, guestName, bookingId, notes, items } = req.body;
      if (!items || items.length === 0) return res.status(400).json({ message: "Order must have at least one item" });

      const orderItems = items as Array<{ menuItemId?: string; itemName: string; quantity: number; unitPriceCents: number }>;
      const totalCents = orderItems.reduce((sum, it) => sum + it.unitPriceCents * it.quantity, 0);

      const order = await storage.createPosOrder(
        {
          tenantId: user.tenantId || user.ownerId || "",
          propertyId: user.propertyId,
          tableNumber: tableNumber || null,
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

      broadcastToProperty(user.propertyId, {
        type: "RESTAURANT_NEW_ORDER",
        order: { ...order, items: orderItems },
        timestamp: new Date().toISOString(),
      });

      logger.info({ orderId: order.id, propertyId: user.propertyId }, "New restaurant order created");
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

      res.json(order);
    } catch (err) {
      logger.error({ err }, "Failed to mark order delivered");
      res.status(500).json({ message: "Failed to deliver order" });
    }
  });

  // Reception/cashier settles an order
  app.post("/api/restaurant/orders/:id/settle", requireRestaurantRole(...SETTLE_ROLES), async (req, res) => {
    try {
      const { paymentType, folioId } = req.body;
      if (!paymentType) return res.status(400).json({ message: "paymentType required: room_charge | cash | card" });

      const existing = await storage.getPosOrder(req.params.id);
      if (!existing) return res.status(404).json({ message: "Order not found" });
      if (existing.settlementStatus !== "pending") {
        return res.status(409).json({ message: "Order already settled" });
      }

      let settlementStatus = "cash_paid";
      let linkedFolioId: string | undefined;

      if (paymentType === "room_charge" && (folioId || existing.bookingId)) {
        // Post charge to folio
        let targetFolioId = folioId;
        if (!targetFolioId && existing.bookingId) {
          // Try to find open folio for this booking
          const folio = await storage.getGuestFolioByBooking(existing.bookingId);
          if (folio && folio.status === "open") targetFolioId = folio.id;
        }

        if (targetFolioId) {
          await storage.createFolioCharge({
            folioId: targetFolioId,
            chargeType: "restaurant",
            description: `Restaurant Order #${existing.id.slice(-6).toUpperCase()} — Table ${existing.tableNumber || "N/A"}`,
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
      }

      const order = await storage.settlePosOrder(req.params.id, settlementStatus, linkedFolioId);
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
      if (!user?.propertyId) return res.status(400).json({ message: "No property linked" });

      const { tableNumber, roomNumber, bookingId } = req.body;
      const call = await storage.createWaiterCall({
        tenantId: user.tenantId || user.ownerId || "",
        propertyId: user.propertyId,
        tableNumber: tableNumber || null,
        roomNumber: roomNumber || null,
        bookingId: bookingId || null,
        status: "pending",
      });

      broadcastToProperty(user.propertyId, {
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

  // ─── ANALYTICS ────────────────────────────────────────────────────────

  app.get("/api/restaurant/analytics", requireRestaurantRole(...MANAGER_ROLES), async (req, res) => {
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

      res.json({
        today: {
          orderCount: todayOrders.length,
          revenueCents: totalRevenueCents,
        },
        activeOrders: byStatus,
        pendingSettlement,
      });
    } catch (err) {
      logger.error({ err }, "Failed to fetch restaurant analytics");
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
}
