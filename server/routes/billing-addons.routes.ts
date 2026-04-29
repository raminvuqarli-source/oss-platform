import type { Express } from "express";
import { requireAuth, requireRole } from "../middleware";
import { storage } from "../storage";

// WhatsApp package definitions
export const WHATSAPP_PACKAGES = [
  { id: "wa_500", name: "Starter", messages: 500, priceUsd: 15 },
  { id: "wa_1000", name: "Growth", messages: 1000, priceUsd: 25 },
  { id: "wa_3000", name: "Pro", messages: 3000, priceUsd: 60 },
];

export function registerBillingAddonRoutes(app: Express) {
  // GET /api/billing/addons — hotel's current addon status
  app.get("/api/billing/addons", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.tenantId) return res.status(403).json({ error: "No tenant" });

      const hotels = await storage.getAllHotels(user.tenantId);
      const hotel = hotels[0];
      if (!hotel) return res.status(404).json({ error: "Hotel not found" });

      const logs = await storage.getBillingLogsByTenant(user.tenantId);

      return res.json({
        hotel: {
          id: hotel.id,
          name: hotel.name,
          isChannexEnabled: hotel.isChannexEnabled ?? false,
          channexAddonPrice: hotel.channexAddonPrice ?? 0,
          channexRoomCount: hotel.channexRoomCount ?? 0,
          isWhatsappEnabled: hotel.isWhatsappEnabled ?? false,
          whatsappBalance: hotel.whatsappBalance ?? 0,
        },
        packages: WHATSAPP_PACKAGES,
        logs: logs.slice(-20).reverse(),
      });
    } catch (err) {
      console.error("[billing/addons]", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/billing/whatsapp/purchase — purchase a WhatsApp package
  app.post("/api/billing/whatsapp/purchase", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.tenantId) return res.status(403).json({ error: "No tenant" });
      if (!["owner_admin", "admin", "property_manager"].includes(user.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { packageId } = req.body;
      const pkg = WHATSAPP_PACKAGES.find((p) => p.id === packageId);
      if (!pkg) return res.status(400).json({ error: "Invalid package" });

      const hotels = await storage.getAllHotels(user.tenantId);
      const hotel = hotels[0];
      if (!hotel) return res.status(404).json({ error: "Hotel not found" });

      const newBalance = (hotel.whatsappBalance ?? 0) + pkg.messages;

      await storage.updateHotelBilling(hotel.id, {
        isWhatsappEnabled: true,
        whatsappBalance: newBalance,
      });

      await storage.createBillingLog({
        tenantId: user.tenantId,
        hotelId: hotel.id,
        ownerId: user.ownerId ?? user.id,
        eventType: "whatsapp_package",
        description: `Purchased WhatsApp ${pkg.name} package — ${pkg.messages} messages`,
        amountUsd: String(pkg.priceUsd),
        messagesAdded: pkg.messages,
        packageName: pkg.name,
        status: "completed",
      });

      return res.json({
        success: true,
        newBalance,
        message: `Successfully added ${pkg.messages} WhatsApp messages`,
      });
    } catch (err) {
      console.error("[billing/whatsapp/purchase]", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/billing/whatsapp/toggle — enable or disable WhatsApp addon
  app.post("/api/billing/whatsapp/toggle", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.tenantId) return res.status(403).json({ error: "No tenant" });
      if (!["owner_admin", "admin", "property_manager"].includes(user.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const hotels = await storage.getAllHotels(user.tenantId);
      const hotel = hotels[0];
      if (!hotel) return res.status(404).json({ error: "Hotel not found" });

      const newState = !hotel.isWhatsappEnabled;
      await storage.updateHotelBilling(hotel.id, { isWhatsappEnabled: newState });

      return res.json({ success: true, isWhatsappEnabled: newState });
    } catch (err) {
      console.error("[billing/whatsapp/toggle]", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ OSS SUPER ADMIN BILLING REPORTS ============

  // GET /api/oss-admin/reports/channex — channex revenue report
  app.get("/api/oss-admin/reports/channex", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const hotels = await storage.getAllHotelsAdmin();
      const channexHotels = hotels.filter((h) => h.isChannexEnabled);

      const rows = channexHotels.map((h) => ({
        hotelId: h.id,
        hotelName: h.name,
        city: h.city ?? "",
        country: h.country ?? "",
        roomCount: h.channexRoomCount ?? h.totalRooms ?? 0,
        monthlyFeeUsd: h.channexAddonPrice ?? 0,
        channexPropertyUuid: h.channexPropertyUuid ?? "",
        activatedAt: h.createdAt,
      }));

      const totalMonthlyRevenue = rows.reduce((s, r) => s + r.monthlyFeeUsd, 0);

      return res.json({ hotels: rows, totalMonthlyRevenue });
    } catch (err) {
      console.error("[oss-admin/reports/channex]", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/oss-admin/reports/whatsapp — whatsapp revenue report
  app.get("/api/oss-admin/reports/whatsapp", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const hotels = await storage.getAllHotelsAdmin();
      const allLogs = await storage.getAllBillingLogs();

      const whatsappLogs = allLogs.filter((l) => l.eventType === "whatsapp_package");

      const rows = hotels
        .filter((h) => h.isWhatsappEnabled || whatsappLogs.some((l) => l.hotelId === h.id))
        .map((h) => {
          const hotelLogs = whatsappLogs.filter((l) => l.hotelId === h.id);
          const totalPurchased = hotelLogs.reduce((s, l) => s + (l.messagesAdded ?? 0), 0);
          const totalSpentUsd = hotelLogs.reduce((s, l) => s + parseFloat(l.amountUsd ?? "0"), 0);
          return {
            hotelId: h.id,
            hotelName: h.name,
            city: h.city ?? "",
            isWhatsappEnabled: h.isWhatsappEnabled ?? false,
            currentBalance: h.whatsappBalance ?? 0,
            totalMessagesPurchased: totalPurchased,
            totalMessagesUsed: Math.max(0, totalPurchased - (h.whatsappBalance ?? 0)),
            totalSpentUsd,
            purchaseCount: hotelLogs.length,
          };
        });

      const totalRevenue = rows.reduce((s, r) => s + r.totalSpentUsd, 0);

      return res.json({ hotels: rows, totalRevenue });
    } catch (err) {
      console.error("[oss-admin/reports/whatsapp]", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/oss-admin/reports/revenue — combined revenue summary
  app.get("/api/oss-admin/reports/revenue", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const hotels = await storage.getAllHotelsAdmin();
      const allLogs = await storage.getAllBillingLogs();

      const channexHotels = hotels.filter((h) => h.isChannexEnabled);
      const channexMonthlyRevenue = channexHotels.reduce((s, h) => s + (h.channexAddonPrice ?? 0), 0);

      const whatsappLogs = allLogs.filter((l) => l.eventType === "whatsapp_package");
      const whatsappTotalRevenue = whatsappLogs.reduce((s, l) => s + parseFloat(l.amountUsd ?? "0"), 0);

      const allLogs30d = allLogs.filter((l) => {
        const d = new Date(l.createdAt!);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        return d >= cutoff;
      });
      const recentRevenue = allLogs30d.reduce((s, l) => s + parseFloat(l.amountUsd ?? "0"), 0);

      return res.json({
        channexMonthlyRevenue,
        channexHotelCount: channexHotels.length,
        whatsappTotalRevenue,
        whatsappActiveHotels: hotels.filter((h) => h.isWhatsappEnabled).length,
        totalMonthlyRevenue: channexMonthlyRevenue + recentRevenue,
        allTimeAddonRevenue: whatsappTotalRevenue,
        recentRevenue30d: recentRevenue,
        totalHotels: hotels.length,
        activeHotels: hotels.filter((h) => h.isChannexEnabled || h.isWhatsappEnabled).length,
      });
    } catch (err) {
      console.error("[oss-admin/reports/revenue]", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/oss-admin/hotels/:hotelId/whatsapp-credit — manually add balance
  app.post("/api/oss-admin/hotels/:hotelId/whatsapp-credit", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const { hotelId } = req.params;
      const { messages, note } = req.body;
      if (!messages || messages <= 0) return res.status(400).json({ error: "Invalid messages count" });

      const hotel = await storage.getHotel(hotelId);
      if (!hotel) return res.status(404).json({ error: "Hotel not found" });

      const newBalance = (hotel.whatsappBalance ?? 0) + messages;
      await storage.updateHotelBilling(hotelId, {
        isWhatsappEnabled: true,
        whatsappBalance: newBalance,
      });

      const user = (req as any).user;
      await storage.createBillingLog({
        tenantId: hotel.tenantId ?? hotelId,
        hotelId,
        ownerId: hotel.ownerId ?? undefined,
        eventType: "manual_credit",
        description: note || `Manual credit: ${messages} WhatsApp messages`,
        amountUsd: "0",
        messagesAdded: messages,
        packageName: "Manual Credit",
        status: "completed",
      });

      return res.json({ success: true, newBalance });
    } catch (err) {
      console.error("[oss-admin/hotels/whatsapp-credit]", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
