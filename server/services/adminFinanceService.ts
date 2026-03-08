import { db } from "../db";
import { sql } from "drizzle-orm";
import { logger } from "../utils/logger";

const financeLogger = logger.child({ module: "admin-finance" });

export interface FinanceOverview {
  totalRevenue30Days: number;
  totalRevenueAllTime: number;
  activeSubscriptions: number;
  pastDueSubscriptions: number;
  suspendedSubscriptions: number;
  trialSubscriptions: number;
  refundsTotal: number;
  failedPaymentsCount: number;
}

export interface RevenueTrendEntry {
  month: string;
  revenue: number;
  transactionCount: number;
}

export interface RecentTransaction {
  id: string;
  ownerId: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  createdAt: string;
}

export async function getFinanceOverview(): Promise<FinanceOverview> {
  const [revenueResult, subsResult, refundsResult, failedResult] = await Promise.all([
    db.execute(sql`
      SELECT
        COALESCE(SUM(CASE WHEN paid_at >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0)::bigint AS revenue_30d,
        COALESCE(SUM(amount), 0)::bigint AS revenue_all_time
      FROM invoices
      WHERE status = 'paid'
    `),
    db.execute(sql`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'active' AND is_active = true THEN 1 ELSE 0 END), 0)::int AS active,
        COALESCE(SUM(CASE WHEN status = 'past_due' THEN 1 ELSE 0 END), 0)::int AS past_due,
        COALESCE(SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END), 0)::int AS suspended,
        COALESCE(SUM(CASE WHEN status = 'trial' THEN 1 ELSE 0 END), 0)::int AS trial
      FROM subscriptions
    `),
    db.execute(sql`
      SELECT COALESCE(SUM(ABS(amount)), 0)::bigint AS total
      FROM invoices
      WHERE status = 'refunded'
    `),
    db.execute(sql`
      SELECT COUNT(*)::int AS cnt
      FROM payment_orders
      WHERE status = 'failed'
    `),
  ]);

  const rev = revenueResult.rows[0] as any;
  const subs = subsResult.rows[0] as any;
  const refunds = refundsResult.rows[0] as any;
  const failed = failedResult.rows[0] as any;

  const overview: FinanceOverview = {
    totalRevenue30Days: parseInt(rev.revenue_30d) || 0,
    totalRevenueAllTime: parseInt(rev.revenue_all_time) || 0,
    activeSubscriptions: parseInt(subs.active) || 0,
    pastDueSubscriptions: parseInt(subs.past_due) || 0,
    suspendedSubscriptions: parseInt(subs.suspended) || 0,
    trialSubscriptions: parseInt(subs.trial) || 0,
    refundsTotal: parseInt(refunds.total) || 0,
    failedPaymentsCount: parseInt(failed.cnt) || 0,
  };

  financeLogger.info(overview, "Finance overview calculated");
  return overview;
}

export async function getRevenueTrend(months: number = 12): Promise<RevenueTrendEntry[]> {
  months = Math.max(1, Math.min(months, 24));
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
      COALESCE(SUM(i.amount), 0)::bigint AS revenue,
      COUNT(i.id)::int AS tx_count
    FROM months m
    LEFT JOIN invoices i
      ON i.status = 'paid'
      AND i.paid_at >= m.month_start
      AND i.paid_at < (m.month_start + INTERVAL '1 month')
    GROUP BY m.month_start
    ORDER BY m.month_start
  `);

  const trend: RevenueTrendEntry[] = (result.rows as any[]).map((row) => ({
    month: new Date(row.month_start).toISOString().slice(0, 7),
    revenue: parseInt(row.revenue) || 0,
    transactionCount: parseInt(row.tx_count) || 0,
  }));

  financeLogger.info({ months: trend.length }, "Revenue trend calculated");
  return trend;
}

export async function getRecentTransactions(limit: number = 20): Promise<RecentTransaction[]> {
  const result = await db.execute(sql`
    SELECT
      id,
      owner_id,
      amount,
      currency,
      status,
      description AS type,
      created_at
    FROM invoices
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);

  const transactions: RecentTransaction[] = (result.rows as any[]).map((row) => ({
    id: row.id,
    ownerId: row.owner_id,
    amount: parseInt(row.amount) || 0,
    currency: row.currency || "AZN",
    status: row.status,
    type: row.type || "subscription",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
  }));

  financeLogger.info({ count: transactions.length }, "Recent transactions fetched");
  return transactions;
}
