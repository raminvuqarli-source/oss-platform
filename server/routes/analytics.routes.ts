import type { Express, Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { requireAuth } from "../middleware";
import { logger } from "../utils/logger";
import { z } from "zod";

const analyticsLogger = logger.child({ module: "analytics" });

const metricsQuerySchema = z.object({
  propertyId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export function registerAnalyticsRoutes(app: Express): void {

  app.get("/api/analytics/hotel-metrics", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = metricsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Missing or invalid query parameters. Required: propertyId, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)",
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const { propertyId, startDate, endDate } = parsed.data;
      const tenantId = req.tenantId;
      if (!tenantId) return res.status(403).json({ message: "Tenant not resolved" });

      const result = await db.execute(sql`
        WITH active_units AS (
          SELECT COUNT(*) AS unit_count
          FROM units
          WHERE property_id = ${propertyId}
            AND is_active = true
            AND tenant_id = ${tenantId}
        ),
        date_range AS (
          SELECT (DATE ${endDate} - DATE ${startDate}) AS total_days
        ),
        sold AS (
          SELECT
            COUNT(DISTINCT (rn.unit_id, rn.date)) AS sold_nights,
            COALESCE(SUM(b.total_price), 0) AS total_revenue_cents
          FROM room_nights rn
          JOIN bookings b ON b.id = rn.booking_id
          WHERE rn.property_id = ${propertyId}
            AND rn.tenant_id = ${tenantId}
            AND rn.date >= ${startDate}
            AND rn.date < ${endDate}
            AND b.status NOT IN ('cancelled', 'no_show')
        )
        SELECT
          s.sold_nights,
          s.total_revenue_cents,
          (au.unit_count * dr.total_days) AS available_nights,
          CASE WHEN (au.unit_count * dr.total_days) > 0
            THEN ROUND(s.sold_nights::numeric / (au.unit_count * dr.total_days) * 100, 2)
            ELSE 0
          END AS occupancy_rate,
          CASE WHEN s.sold_nights > 0
            THEN ROUND(s.total_revenue_cents::numeric / 100.0 / s.sold_nights, 2)
            ELSE 0
          END AS adr,
          CASE WHEN (au.unit_count * dr.total_days) > 0
            THEN ROUND(s.total_revenue_cents::numeric / 100.0 / (au.unit_count * dr.total_days), 2)
            ELSE 0
          END AS revpar
        FROM sold s, active_units au, date_range dr
      `);

      const row = result.rows[0] as any;

      res.json({
        propertyId,
        startDate,
        endDate,
        occupancyRate: parseFloat(row.occupancy_rate) || 0,
        adr: parseFloat(row.adr) || 0,
        revpar: parseFloat(row.revpar) || 0,
        totalRevenue: Math.round((parseInt(row.total_revenue_cents) || 0) / 100),
        soldNights: parseInt(row.sold_nights) || 0,
        availableNights: parseInt(row.available_nights) || 0,
      });

      analyticsLogger.info({ propertyId, startDate, endDate, tenantId }, "Hotel metrics calculated");
    } catch (err) {
      analyticsLogger.error({ err }, "Failed to calculate hotel metrics");
      res.status(500).json({ message: "Failed to calculate hotel metrics" });
    }
  });
}
