import type { Express, Request, Response } from "express";
import { logger } from "../utils/logger";
import { storage } from "../storage";

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

// ─── Signature verification helper (TODO: implement when Channex provides key) ─

function verifyChannexSignature(req: Request): boolean {
  // TODO: Implement HMAC-SHA256 signature verification when Channex provides
  // a webhook signing secret in your dashboard.
  //
  // Steps to implement:
  //   1. Get the raw request body (use express.raw() before this middleware).
  //   2. Read the header: const signature = req.headers["x-channex-signature"];
  //   3. Compute: const expected = crypto
  //                 .createHmac("sha256", process.env.CHANNEX_WEBHOOK_SECRET!)
  //                 .update(rawBody)
  //                 .digest("hex");
  //   4. Return: timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  //
  // Until then, all incoming requests are accepted (safe for staging/dev).
  return true;
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleBookingCreated(payload: ChannexBookingPayload) {
  const guestName =
    (payload.customer?.name ??
    `${payload.customer?.first_name ?? ""} ${payload.customer?.last_name ?? ""}`.trim()) ||
    "Unknown Guest";

  webhookLog.info(
    {
      channexBookingId: payload.id,
      propertyId:       payload.property_id,
      guestName,
      totalAmount:      payload.total_price,
      currency:         payload.currency ?? "USD",
      checkin:          payload.checkin_date,
      checkout:         payload.checkout_date,
    },
    "Channex booking.created received"
  );

  console.log("─── Channex: booking.created ───────────────────────────────");
  console.log(`  Guest Name    : ${guestName}`);
  console.log(`  Property ID   : ${payload.property_id}`);
  console.log(`  Total Amount  : ${payload.total_price} ${payload.currency ?? ""}`);
  console.log(`  Check-in      : ${payload.checkin_date}`);
  console.log(`  Check-out     : ${payload.checkout_date}`);
  console.log("────────────────────────────────────────────────────────────");

  // TODO: Map to internal booking via storage.createBooking(...)
  // when the OTA channel manager integration is fully configured.
}

async function handleBookingModified(payload: ChannexBookingPayload) {
  webhookLog.info(
    {
      channexBookingId: payload.id,
      propertyId:       payload.property_id,
      newStatus:        payload.status,
    },
    "Channex booking.modified received"
  );

  console.log("─── Channex: booking.modified ──────────────────────────────");
  console.log(`  Booking ID    : ${payload.id}`);
  console.log(`  Property ID   : ${payload.property_id}`);
  console.log(`  New Status    : ${payload.status}`);
  console.log("────────────────────────────────────────────────────────────");

  // TODO: Update the matching booking in our DB.
  // const existing = await storage.getBookingByChannexId(payload.id);
  // if (existing) await storage.updateBooking(existing.id, { status: payload.status });
}

async function handleBookingCancelled(payload: ChannexBookingPayload) {
  webhookLog.warn(
    {
      channexBookingId: payload.id,
      propertyId:       payload.property_id,
    },
    "Channex booking.cancelled received"
  );

  console.log("─── Channex: booking.cancelled ─────────────────────────────");
  console.log(`  Booking ID    : ${payload.id}`);
  console.log(`  Property ID   : ${payload.property_id}`);
  console.log("────────────────────────────────────────────────────────────");

  // TODO: Cancel the matching booking in our DB.
  // const existing = await storage.getBookingByChannexId(payload.id);
  // if (existing) await storage.updateBooking(existing.id, { status: "cancelled" });
}

// ─── Route registration ───────────────────────────────────────────────────────

export function registerChannexWebhookRoutes(app: Express) {
  /**
   * POST /api/webhooks/channex
   *
   * Receives real-time booking events from Channex.io.
   * IMPORTANT: Always returns 200 immediately — Channex will keep retrying
   * until it receives a 200, so we acknowledge first and process asynchronously.
   */
  app.post("/api/webhooks/channex", async (req: Request, res: Response) => {
    // ── 1. Acknowledge receipt immediately (Channex retry prevention) ──────
    res.status(200).json({ received: true });

    // ── 2. Verify the request came from Channex ────────────────────────────
    if (!verifyChannexSignature(req)) {
      webhookLog.warn("Channex webhook signature verification failed — ignoring");
      return;
    }

    // ── 3. Parse and validate the body ────────────────────────────────────
    const body = req.body as ChannexWebhookBody;

    if (!body?.event || !body?.payload) {
      webhookLog.warn({ body }, "Channex webhook received with missing event or payload");
      return;
    }

    webhookLog.info({ event: body.event, bookingId: body.payload?.id }, "Channex webhook received");

    // ── 4. Route to the correct handler ───────────────────────────────────
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
          webhookLog.info({ event: body.event }, "Channex webhook: unhandled event type (ignored)");
      }
    } catch (err) {
      // Never let a processing error bubble up — the 200 was already sent
      webhookLog.error({ err, event: body.event }, "Error processing Channex webhook event");
    }
  });

  webhookLog.info("Channex webhook route registered at POST /api/webhooks/channex");
}
