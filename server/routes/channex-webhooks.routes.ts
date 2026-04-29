import type { Express, Request, Response } from "express";
import { logger } from "../utils/logger";
import { storage } from "../storage";
import { db } from "../db";
import { otaIntegrations, hotels } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import { broadcastToTenant } from "../websocket/index";

const webhookLog = logger.child({ module: "channex-webhook" });

// ─── Payload shapes (Channex.io webhook format) ───────────────────────────────

interface ChannexBookingPayload {
  id: string;
  property_id: string;
  channel_id?: string;
  status: string;
  checkin_date?: string;
  checkout_date?: string;
  total_price?: number | string;
  currency?: string;
  rooms?: Array<{
    room_type_id?: string;
    room_type_name?: string;
    rate_plan_id?: string;
  }>;
  customer?: {
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
}

interface ChannexWebhookBody {
  event: string;
  payload: ChannexBookingPayload;
  timestamp?: string;
}

// ─── Signature verification (TODO: enable when Channex provides signing secret) ─

function verifyChannexSignature(_req: Request): boolean {
  // TODO: Implement HMAC-SHA256 signature verification once Channex provides
  // a webhook signing secret in your dashboard settings.
  //
  // Steps to implement:
  //   1. Mount this route with express.raw({ type: "application/json" }) to
  //      capture the raw body before JSON.parse strips the whitespace.
  //   2. Read:  const sig = req.headers["x-channex-signature"] as string;
  //   3. Compute:
  //        const expected = crypto
  //          .createHmac("sha256", process.env.CHANNEX_WEBHOOK_SECRET!)
  //          .update(req.body)          // raw Buffer, not parsed JSON
  //          .digest("hex");
  //   4. Return: crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  //
  // Until the signing secret is configured, all requests are accepted.
  return true;
}

// ─── Internal helper: resolve Channex property_id → our hotelId + tenantId ───

async function resolveProperty(channexPropertyId: string): Promise<{
  hotelId: string | null;
  tenantId: string | null;
  internalPropertyId: string | null;
  isChannexEnabled: boolean;
}> {
  // Look up an active Channex OTA integration where api_secret stores the
  // Channex property UUID (the hotel owner sets this when configuring the channel).
  const integrations = await db
    .select({
      propertyId: otaIntegrations.propertyId,
      tenantId:   otaIntegrations.tenantId,
    })
    .from(otaIntegrations)
    .where(
      and(
        eq(otaIntegrations.provider,  "channex"),
        eq(otaIntegrations.apiSecret, channexPropertyId),
        eq(otaIntegrations.isActive,  true),
      )
    )
    .limit(1);

  if (!integrations.length) {
    webhookLog.warn(
      { channexPropertyId },
      "No active Channex OTA integration found for this property_id — booking saved without internal mapping"
    );
    return { hotelId: null, tenantId: null, internalPropertyId: null, isChannexEnabled: true };
  }

  const { propertyId, tenantId } = integrations[0];

  // Resolve hotelId: the hotels table stores the propertyId it belongs to
  const hotelRows = await db
    .select({ id: hotels.id, isChannexEnabled: hotels.isChannexEnabled })
    .from(hotels)
    .where(eq(hotels.propertyId, propertyId))
    .limit(1);

  const hotelId = hotelRows[0]?.id ?? null;
  const isChannexEnabled = hotelRows[0]?.isChannexEnabled ?? true; // default true when unmapped

  return { hotelId, tenantId: tenantId ?? null, internalPropertyId: propertyId, isChannexEnabled };
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleBookingCreated(payload: ChannexBookingPayload) {
  const guestName =
    (payload.customer?.name ??
    `${payload.customer?.first_name ?? ""} ${payload.customer?.last_name ?? ""}`.trim()) ||
    "Unknown Guest";

  const roomName = payload.rooms?.[0]?.room_type_name ?? "N/A";
  const totalPrice =
    typeof payload.total_price === "string"
      ? parseFloat(payload.total_price)
      : (payload.total_price ?? 0);

  webhookLog.info(
    {
      channexBookingId: payload.id,
      channexPropertyId: payload.property_id,
      guestName,
      totalPrice,
      currency:  payload.currency ?? "USD",
      checkin:   payload.checkin_date,
      checkout:  payload.checkout_date,
    },
    "Channex booking.created — saving to DB"
  );

  // ── Resolve internal property mapping ─────────────────────────────────────
  const { hotelId, tenantId, isChannexEnabled } = await resolveProperty(payload.property_id);

  // ── Safety gate: only process if channex integration is active ───────────
  if (hotelId && !isChannexEnabled) {
    webhookLog.warn(
      { channexBookingId: payload.id, hotelId },
      "Channex integration is disabled for this property — ignoring webhook"
    );
    return;
  }

  // ── Duplicate guard: skip if already saved ────────────────────────────────
  // Use hotelId if resolved, otherwise fall back to the "unmapped" sentinel
  const effectiveHotelId = hotelId ?? "channex-unmapped";
  const existing = await storage.getExternalBookingByExternalId(payload.id, effectiveHotelId);
  if (existing) {
    webhookLog.info(
      { channexBookingId: payload.id, existingId: existing.id },
      "Channex booking already exists — skipping duplicate"
    );
    return;
  }

  // ── Persist to external_bookings ──────────────────────────────────────────
  const saved = await storage.createExternalBooking({
    hotelId:      hotelId   ?? "channex-unmapped",
    tenantId:     tenantId  ?? null,
    source:       "channex",
    externalId:   payload.id,
    guestName,
    checkinDate:  payload.checkin_date  ?? "",
    checkoutDate: payload.checkout_date ?? "",
    roomName,
    price:        totalPrice,
    status:       "confirmed",
  });

  webhookLog.info({ savedId: saved.id, guestName, hotelId }, "Channex booking saved to DB");

  // ── Real-time push: notify connected dashboard clients ─────────────────────
  if (tenantId) {
    broadcastToTenant(tenantId, {
      type: "channex_new_booking",
      booking: {
        id: saved.id,
        guestName,
        checkinDate: payload.checkin_date ?? "",
        checkoutDate: payload.checkout_date ?? "",
        roomName,
        price: totalPrice,
        source: "channex",
        externalId: payload.id,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      },
    });
    webhookLog.info({ tenantId, savedId: saved.id }, "Channex WS event broadcast sent");
  }

  // ── Notification: create DB record for bell counter ────────────────────────
  if (hotelId) {
    try {
      const hotel = await storage.getHotel(hotelId);
      if (hotel?.ownerId) {
        const staffUsers = await storage.getUsersByHotel(hotelId, tenantId ?? hotel.ownerId!);
        const alertableUsers = staffUsers.filter(u =>
          ["owner_admin", "admin", "reception"].includes(u.role ?? "")
        );
        for (const u of alertableUsers) {
          await storage.createNotification({
            userId: u.id,
            title: "New Booking Received",
            message: `${guestName} via Channex — ${payload.checkin_date} → ${payload.checkout_date} (${roomName})`,
            type: "booking",
            read: false,
            actionUrl: "/dashboard?view=calendar",
          }).catch(() => {});
        }
      }
    } catch (e) {
      webhookLog.warn({ err: e }, "Failed to create Channex booking notification");
    }
  }

  console.log("─── Channex: booking.created → SAVED ───────────────────────");
  console.log(`  Internal ID   : ${saved.id}`);
  console.log(`  Channex ID    : ${payload.id}`);
  console.log(`  Guest Name    : ${guestName}`);
  console.log(`  Property ID   : ${payload.property_id}  →  hotel: ${hotelId ?? "unmapped"}`);
  console.log(`  Room          : ${roomName}`);
  console.log(`  Total Price   : ${totalPrice} ${payload.currency ?? "USD"}`);
  console.log(`  Check-in      : ${payload.checkin_date}`);
  console.log(`  Check-out     : ${payload.checkout_date}`);
  console.log("────────────────────────────────────────────────────────────");
}

async function handleBookingModified(payload: ChannexBookingPayload) {
  webhookLog.info(
    { channexBookingId: payload.id, newStatus: payload.status },
    "Channex booking.modified received"
  );

  const { hotelId } = await resolveProperty(payload.property_id);
  const effectiveHotelId = hotelId ?? "channex-unmapped";

  const existing = await storage.getExternalBookingByExternalId(payload.id, effectiveHotelId);
  if (existing) {
    await storage.updateExternalBooking(existing.id, { status: payload.status ?? existing.status });
    webhookLog.info({ id: existing.id, newStatus: payload.status }, "Channex booking updated in DB");
  } else {
    webhookLog.warn({ channexBookingId: payload.id }, "booking.modified — no matching record found, creating it");
    await handleBookingCreated(payload);
    return;
  }

  console.log("─── Channex: booking.modified → UPDATED ────────────────────");
  console.log(`  Channex ID    : ${payload.id}`);
  console.log(`  New Status    : ${payload.status}`);
  console.log("────────────────────────────────────────────────────────────");
}

async function handleBookingCancelled(payload: ChannexBookingPayload) {
  webhookLog.warn(
    { channexBookingId: payload.id, channexPropertyId: payload.property_id },
    "Channex booking.cancelled — setting status to cancelled"
  );

  const { hotelId } = await resolveProperty(payload.property_id);
  const effectiveHotelId = hotelId ?? "channex-unmapped";

  const existing = await storage.getExternalBookingByExternalId(payload.id, effectiveHotelId);
  if (existing) {
    await storage.updateExternalBooking(existing.id, { status: "cancelled" });
    webhookLog.info({ id: existing.id }, "Channex booking cancelled in DB");

    console.log("─── Channex: booking.cancelled → CANCELLED ─────────────────");
    console.log(`  Internal ID   : ${existing.id}`);
    console.log(`  Channex ID    : ${payload.id}`);
    console.log(`  Guest         : ${existing.guestName}`);
    console.log("────────────────────────────────────────────────────────────");
    return;
  }

  // Booking not in DB yet — log and move on
  webhookLog.warn(
    { channexBookingId: payload.id },
    "booking.cancelled — no matching record found in DB (may have never been created)"
  );

  console.log("─── Channex: booking.cancelled → NOT FOUND IN DB ───────────");
  console.log(`  Channex ID    : ${payload.id}`);
  console.log("────────────────────────────────────────────────────────────");
}

// ─── Route registration ───────────────────────────────────────────────────────

export function registerChannexWebhookRoutes(app: Express) {
  /**
   * POST /api/webhooks/channex
   *
   * Receives real-time booking events from Channex.io.
   *
   * CRITICAL: Returns 200 OK immediately before any DB work.
   * Channex retries failed webhooks — if this endpoint takes > a few seconds
   * or returns a non-2xx, Channex will resend, causing duplicate inserts.
   * The duplicate guard inside handleBookingCreated prevents that scenario.
   */
  app.post("/api/webhooks/channex", async (req: Request, res: Response) => {
    // ── 1. Acknowledge immediately ─────────────────────────────────────────
    res.status(200).json({ received: true });

    // ── 2. Signature check ─────────────────────────────────────────────────
    if (!verifyChannexSignature(req)) {
      webhookLog.warn("Channex webhook signature mismatch — ignoring payload");
      return;
    }

    // ── 3. Basic shape validation ──────────────────────────────────────────
    const body = req.body as ChannexWebhookBody;
    if (!body?.event || !body?.payload) {
      webhookLog.warn({ body }, "Channex webhook missing event or payload field");
      return;
    }

    webhookLog.info({ event: body.event, bookingId: body.payload?.id }, "Channex webhook dispatching");

    // ── 4. Dispatch ────────────────────────────────────────────────────────
    try {
      switch (body.event) {
        case "booking.created":
          await handleBookingCreated(body.payload);
          break;

        case "booking.modified":
          await handleBookingModified(body.payload);
          break;

        case "booking.cancelled":
          await handleBookingCancelled(body.payload);
          break;

        default:
          webhookLog.info(
            { event: body.event },
            "Channex webhook: unrecognised event type — ignored"
          );
      }
    } catch (err) {
      // 200 already sent — log the error but do not crash the process
      webhookLog.error({ err, event: body.event }, "Unhandled error while processing Channex webhook");
    }
  });

  webhookLog.info("Channex webhook route registered at POST /api/webhooks/channex");
}
