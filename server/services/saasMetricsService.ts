import { db } from "../db";
import { sql } from "drizzle-orm";
import { logger } from "../utils/logger";
import { PLAN_CODE_FEATURES } from "@shared/planFeatures";
import type { PlanCode } from "@shared/schema";

const metricsLogger = logger.child({ module: "saas-metrics" });

export interface SaasMetrics {
  mrr: number;
  arr: number;
  churnRate: number;
  arpu: number;
  ltv: number;
  activeSubscriptions: number;
  canceledLast30Days: number;
  trialSubscriptions: number;
  pastDueSubscriptions: number;
  totalRevenueLast30Days: number;
}

export interface MrrTrendEntry {
  month: string;
  mrr: number;
  activeCount: number;
}

export async function calculateSaasMetrics(): Promise<SaasMetrics> {
  const activeResult = await db.execute(sql`
    SELECT
      plan_code,
      COUNT(*)::int AS cnt
    FROM subscriptions
    WHERE status = 'active' AND is_active = true
    GROUP BY plan_code
  `);

  let mrr = 0;
  let activeSubscriptions = 0;

  for (const row of activeResult.rows as any[]) {
    const planCode = row.plan_code as PlanCode;
    const count = parseInt(row.cnt) || 0;
    activeSubscriptions += count;

    const planConfig = PLAN_CODE_FEATURES[planCode];
    if (planConfig) {
      mrr += planConfig.priceMonthlyAZN * count;
    }
  }

  mrr = Math.round(mrr * 100) / 100;
  const arr = Math.round(mrr * 12 * 100) / 100;

  const canceledResult = await db.execute(sql`
    SELECT COUNT(*)::int AS cnt
    FROM subscriptions
    WHERE status IN ('expired', 'suspended', 'canceled')
      AND updated_at >= NOW() - INTERVAL '30 days'
  `);
  const canceledLast30Days = parseInt((canceledResult.rows[0] as any).cnt) || 0;

  const startOfPeriodTotal = activeSubscriptions + canceledLast30Days;
  const churnRate = startOfPeriodTotal > 0
    ? Math.round((canceledLast30Days / startOfPeriodTotal) * 10000) / 10000
    : 0;

  const revenueResult = await db.execute(sql`
    SELECT COALESCE(SUM(amount), 0)::bigint AS total
    FROM invoices
    WHERE status = 'paid'
      AND paid_at >= NOW() - INTERVAL '30 days'
  `);
  const totalRevenueLast30Days = parseInt((revenueResult.rows[0] as any).total) || 0;

  const arpu = activeSubscriptions > 0
    ? Math.round((totalRevenueLast30Days / activeSubscriptions) * 100) / 100
    : 0;

  const ltv = churnRate > 0
    ? Math.round((arpu / churnRate) * 100) / 100
    : 0;

  const trialResult = await db.execute(sql`
    SELECT COUNT(*)::int AS cnt FROM subscriptions WHERE status = 'trial'
  `);
  const trialSubscriptions = parseInt((trialResult.rows[0] as any).cnt) || 0;

  const pastDueResult = await db.execute(sql`
    SELECT COUNT(*)::int AS cnt FROM subscriptions WHERE status = 'past_due'
  `);
  const pastDueSubscriptions = parseInt((pastDueResult.rows[0] as any).cnt) || 0;

  metricsLogger.info({
    mrr, arr, churnRate, arpu, ltv,
    activeSubscriptions, canceledLast30Days, trialSubscriptions, pastDueSubscriptions,
  }, "SaaS metrics calculated");

  return {
    mrr,
    arr,
    churnRate,
    arpu,
    ltv,
    activeSubscriptions,
    canceledLast30Days,
    trialSubscriptions,
    pastDueSubscriptions,
    totalRevenueLast30Days,
  };
}

export async function calculateMrrTrend(months: number = 12): Promise<MrrTrendEntry[]> {
  const result = await db.execute(sql`
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', NOW() - (${months - 1} || ' months')::interval),
        date_trunc('month', NOW()),
        '1 month'::interval
      )::date AS month_start
    )
    SELECT
      m.month_start,
      s.plan_code,
      COUNT(s.id)::int AS cnt
    FROM months m
    LEFT JOIN subscriptions s
      ON s.created_at < (m.month_start + INTERVAL '1 month')
      AND (
        s.status = 'active'
        OR (
          s.status IN ('expired', 'suspended', 'canceled')
          AND s.updated_at >= m.month_start
        )
      )
    GROUP BY m.month_start, s.plan_code
    ORDER BY m.month_start
  `);

  const monthMap = new Map<string, { mrr: number; activeCount: number }>();

  for (const row of result.rows as any[]) {
    const monthKey = new Date(row.month_start).toISOString().slice(0, 7);
    const planCode = row.plan_code as PlanCode | null;
    const count = parseInt(row.cnt) || 0;

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { mrr: 0, activeCount: 0 });
    }

    const entry = monthMap.get(monthKey)!;
    entry.activeCount += count;

    if (planCode) {
      const planConfig = PLAN_CODE_FEATURES[planCode];
      if (planConfig) {
        entry.mrr += planConfig.priceMonthlyAZN * count;
      }
    }
  }

  const trend: MrrTrendEntry[] = [];
  for (const [month, data] of monthMap) {
    trend.push({
      month,
      mrr: Math.round(data.mrr * 100) / 100,
      activeCount: data.activeCount,
    });
  }

  trend.sort((a, b) => a.month.localeCompare(b.month));

  metricsLogger.info({ months: trend.length }, "MRR trend calculated");
  return trend;
}
