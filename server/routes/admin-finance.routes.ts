import type { Express, Request, Response } from "express";
import { requireRole } from "../middleware";
import { logger } from "../utils/logger";
import {
  getFinanceOverview,
  getRevenueTrend,
  getRecentTransactions,
} from "../services/adminFinanceService";

const financeLogger = logger.child({ module: "admin-finance-routes" });

export function registerAdminFinanceRoutes(app: Express): void {
  app.get("/api/admin/finance/overview", requireRole("oss_super_admin"), async (_req: Request, res: Response) => {
    try {
      const overview = await getFinanceOverview();
      res.json(overview);
    } catch (err: any) {
      financeLogger.error({ err: err.message }, "Failed to fetch finance overview");
      res.status(500).json({ message: "Failed to fetch finance overview" });
    }
  });

  app.get("/api/admin/finance/revenue-trend", requireRole("oss_super_admin"), async (req: Request, res: Response) => {
    try {
      const months = parseInt(req.query.months as string) || 12;
      const trend = await getRevenueTrend(Math.min(months, 24));
      res.json(trend);
    } catch (err: any) {
      financeLogger.error({ err: err.message }, "Failed to fetch revenue trend");
      res.status(500).json({ message: "Failed to fetch revenue trend" });
    }
  });

  app.get("/api/admin/finance/recent-transactions", requireRole("oss_super_admin"), async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const transactions = await getRecentTransactions(Math.min(limit, 100));
      res.json(transactions);
    } catch (err: any) {
      financeLogger.error({ err: err.message }, "Failed to fetch recent transactions");
      res.status(500).json({ message: "Failed to fetch recent transactions" });
    }
  });
}
