import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { asString } from "../utils/request";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { payrollConfigs, payrollEntries, cashAccounts, recurringExpenses } from "@shared/schema";
import { requireAuth, requireRole } from "../middleware";
import { logger } from "../utils/logger";

async function resolveFinanceHotelId(userId: string): Promise<{ hotelId?: string; propertyId?: string; ownerId?: string; user: any }> {
  const user = await storage.getUser(userId);
  if (!user) return { user: null };
  let hotelId = user.hotelId;
  if (!hotelId && user.propertyId) {
    const matchingHotel = await storage.getHotelByPropertyId(user.propertyId);
    if (matchingHotel) {
      hotelId = matchingHotel.id;
      await storage.updateUser(user.id, { hotelId });
    }
  }
  return { hotelId: hotelId || undefined, propertyId: user.propertyId || undefined, ownerId: user.ownerId || undefined, user };
}

export function registerFinanceCenterRoutes(app: Express): void {
  // --- Staff Users for payroll dropdown ---
  app.get("/api/finance-center/staff-users", requireRole("owner_admin"), async (req, res) => {
    try {
      const { ownerId, user } = await resolveFinanceHotelId(req.session.userId!);
      if (!ownerId) return res.status(400).json({ message: "No owner assigned" });
      const allUsers = await storage.getUsersByOwner(ownerId, req.tenantId!);
      const staffUsers = allUsers
        .filter((u: any) => ["reception", "admin", "staff"].includes(u.role))
        .map((u: any) => ({ id: u.id, fullName: u.fullName || u.username, role: u.role }));
      res.json(staffUsers);
    } catch (error) {
      logger.error({ err: error }, "Error fetching staff users");
      res.status(500).json({ message: "Failed to fetch staff users" });
    }
  });

  // --- Revenues ---
  app.get("/api/finance-center/revenues", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const { hotelId, ownerId, user } = await resolveFinanceHotelId(req.session.userId!);
      let revenues;
      if (user?.role === "owner_admin" && ownerId) {
        revenues = await storage.getRevenuesByOwner(ownerId, req.tenantId!);
      } else if (hotelId) {
        revenues = await storage.getRevenuesByHotel(hotelId, req.tenantId!);
      } else {
        return res.status(400).json({ message: "No hotel assigned" });
      }
      res.json(revenues);
    } catch (error) {
      logger.error({ err: error }, "Error fetching revenues");
      res.status(500).json({ message: "Failed to fetch revenues" });
    }
  });

  app.post("/api/finance-center/revenues", requireRole("reception", "admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const { hotelId, propertyId, ownerId, user } = await resolveFinanceHotelId(req.session.userId!);
      if (!hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const revenue = await storage.createRevenue({
        ...req.body,
        hotelId,
        propertyId,
        ownerId,
        createdBy: user?.id,
        createdByName: user?.fullName || user?.username,
        sourceType: "staff_input",
        tenantId: req.tenantId || null,
      });
      res.status(201).json(revenue);
    } catch (error) {
      logger.error({ err: error }, "Error creating revenue");
      res.status(500).json({ message: "Failed to create revenue" });
    }
  });

  // --- Expenses ---
  app.get("/api/finance-center/expenses", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const { hotelId, ownerId, user } = await resolveFinanceHotelId(req.session.userId!);
      let expenses;
      if (user?.role === "owner_admin" && ownerId) {
        expenses = await storage.getExpensesByOwner(ownerId, req.tenantId!);
      } else if (hotelId) {
        expenses = await storage.getExpensesByHotel(hotelId, req.tenantId!);
      } else {
        return res.status(400).json({ message: "No hotel assigned" });
      }
      res.json(expenses);
    } catch (error) {
      logger.error({ err: error }, "Error fetching expenses");
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/finance-center/expenses", requireRole("reception", "admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const { hotelId, propertyId, ownerId, user } = await resolveFinanceHotelId(req.session.userId!);
      if (!hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const expense = await storage.createExpense({
        ...req.body,
        hotelId,
        propertyId,
        ownerId,
        createdBy: user?.id,
        createdByName: user?.fullName || user?.username,
        tenantId: req.tenantId || null,
      });
      res.status(201).json(expense);
    } catch (error) {
      logger.error({ err: error }, "Error creating expense");
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  // --- Payroll Configs ---
  app.get("/api/finance-center/payroll-configs", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const { hotelId, ownerId, user } = await resolveFinanceHotelId(req.session.userId!);
      let configs;
      if (user?.role === "owner_admin" && ownerId) {
        configs = await storage.getPayrollConfigsByOwner(ownerId, req.tenantId!);
      } else if (hotelId) {
        configs = await storage.getPayrollConfigsByHotel(hotelId, req.tenantId!);
      } else {
        return res.status(400).json({ message: "No hotel assigned" });
      }
      res.json(configs);
    } catch (error) {
      logger.error({ err: error }, "Error fetching payroll configs");
      res.status(500).json({ message: "Failed to fetch payroll configs" });
    }
  });

  app.post("/api/finance-center/payroll-configs", requireRole("owner_admin"), async (req, res) => {
    try {
      const { hotelId, propertyId, ownerId, user } = await resolveFinanceHotelId(req.session.userId!);
      if (!hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const config = await storage.createPayrollConfig({
        ...req.body,
        hotelId,
        propertyId,
        ownerId,
        createdBy: user?.id,
        tenantId: req.tenantId || null,
      });
      res.status(201).json(config);
    } catch (error) {
      logger.error({ err: error }, "Error creating payroll config");
      res.status(500).json({ message: "Failed to create payroll config" });
    }
  });

  app.patch("/api/finance-center/payroll-configs/:id", requireRole("owner_admin"), async (req, res) => {
    try {
      const configId = asString(req.params.id);
      const existing = (await db.select().from(payrollConfigs).where(eq(payrollConfigs.id, configId)).limit(1))[0];
      if (!existing) return res.status(404).json({ message: "Payroll config not found" });

      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== "oss_super_admin" && existing.ownerId !== user?.ownerId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const config = await storage.updatePayrollConfig(configId, req.body);
      res.json(config);
    } catch (error) {
      logger.error({ err: error }, "Error updating payroll config");
      res.status(500).json({ message: "Failed to update payroll config" });
    }
  });

  // --- Payroll Entries ---
  app.get("/api/finance-center/payroll-entries", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const { hotelId, ownerId, user } = await resolveFinanceHotelId(req.session.userId!);
      let entries;
      if (user?.role === "owner_admin" && ownerId) {
        entries = await storage.getPayrollEntriesByOwner(ownerId, req.tenantId!);
      } else if (hotelId) {
        entries = await storage.getPayrollEntriesByHotel(hotelId, req.tenantId!);
      } else {
        return res.status(400).json({ message: "No hotel assigned" });
      }
      res.json(entries);
    } catch (error) {
      logger.error({ err: error }, "Error fetching payroll entries");
      res.status(500).json({ message: "Failed to fetch payroll entries" });
    }
  });

  app.post("/api/finance-center/payroll-entries", requireRole("owner_admin"), async (req, res) => {
    try {
      const { hotelId, propertyId, ownerId } = await resolveFinanceHotelId(req.session.userId!);
      if (!hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const entry = await storage.createPayrollEntry({
        ...req.body,
        hotelId,
        propertyId,
        ownerId,
        tenantId: req.tenantId || null,
      });
      res.status(201).json(entry);
    } catch (error) {
      logger.error({ err: error }, "Error creating payroll entry");
      res.status(500).json({ message: "Failed to create payroll entry" });
    }
  });

  app.patch("/api/finance-center/payroll-entries/:id", requireRole("owner_admin"), async (req, res) => {
    try {
      const entryId = asString(req.params.id);
      const existing = (await db.select().from(payrollEntries).where(eq(payrollEntries.id, entryId)).limit(1))[0];
      if (!existing) return res.status(404).json({ message: "Payroll entry not found" });

      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== "oss_super_admin" && existing.ownerId !== user?.ownerId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const entry = await storage.updatePayrollEntry(entryId, req.body);
      res.json(entry);
    } catch (error) {
      logger.error({ err: error }, "Error updating payroll entry");
      res.status(500).json({ message: "Failed to update payroll entry" });
    }
  });

  // --- Cash Accounts ---
  app.get("/api/finance-center/cash-accounts", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const { hotelId, ownerId, user } = await resolveFinanceHotelId(req.session.userId!);
      let accounts;
      if (user?.role === "owner_admin" && ownerId) {
        accounts = await storage.getCashAccountsByOwner(ownerId, req.tenantId!);
      } else if (hotelId) {
        accounts = await storage.getCashAccountsByHotel(hotelId, req.tenantId!);
      } else {
        return res.status(400).json({ message: "No hotel assigned" });
      }
      res.json(accounts);
    } catch (error) {
      logger.error({ err: error }, "Error fetching cash accounts");
      res.status(500).json({ message: "Failed to fetch cash accounts" });
    }
  });

  app.post("/api/finance-center/cash-accounts", requireRole("owner_admin"), async (req, res) => {
    try {
      const { hotelId, propertyId, ownerId } = await resolveFinanceHotelId(req.session.userId!);
      if (!hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const account = await storage.createCashAccount({
        ...req.body,
        hotelId,
        propertyId,
        ownerId,
        tenantId: req.tenantId || null,
      });
      res.status(201).json(account);
    } catch (error) {
      logger.error({ err: error }, "Error creating cash account");
      res.status(500).json({ message: "Failed to create cash account" });
    }
  });

  app.patch("/api/finance-center/cash-accounts/:id", requireRole("owner_admin"), async (req, res) => {
    try {
      const accountId = asString(req.params.id);
      const existing = (await db.select().from(cashAccounts).where(eq(cashAccounts.id, accountId)).limit(1))[0];
      if (!existing) return res.status(404).json({ message: "Cash account not found" });

      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== "oss_super_admin" && existing.ownerId !== user?.ownerId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const account = await storage.updateCashAccount(accountId, req.body);
      res.json(account);
    } catch (error) {
      logger.error({ err: error }, "Error updating cash account");
      res.status(500).json({ message: "Failed to update cash account" });
    }
  });

  // --- Recurring Expenses ---
  app.get("/api/finance-center/recurring-expenses", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const { hotelId, ownerId, user } = await resolveFinanceHotelId(req.session.userId!);
      let expenses;
      if (user?.role === "owner_admin" && ownerId) {
        expenses = await storage.getRecurringExpensesByOwner(ownerId, req.tenantId!);
      } else if (hotelId) {
        expenses = await storage.getRecurringExpensesByHotel(hotelId, req.tenantId!);
      } else {
        return res.status(400).json({ message: "No hotel assigned" });
      }
      res.json(expenses);
    } catch (error) {
      logger.error({ err: error }, "Error fetching recurring expenses");
      res.status(500).json({ message: "Failed to fetch recurring expenses" });
    }
  });

  app.post("/api/finance-center/recurring-expenses", requireRole("owner_admin"), async (req, res) => {
    try {
      const { hotelId, propertyId, ownerId, user } = await resolveFinanceHotelId(req.session.userId!);
      if (!hotelId) return res.status(400).json({ message: "No hotel assigned" });
      const expense = await storage.createRecurringExpense({
        ...req.body,
        hotelId,
        propertyId,
        ownerId,
        createdBy: user?.id,
        tenantId: req.tenantId || null,
      });
      res.status(201).json(expense);
    } catch (error) {
      logger.error({ err: error }, "Error creating recurring expense");
      res.status(500).json({ message: "Failed to create recurring expense" });
    }
  });

  app.patch("/api/finance-center/recurring-expenses/:id", requireRole("owner_admin"), async (req, res) => {
    try {
      const expenseId = asString(req.params.id);
      const existing = (await db.select().from(recurringExpenses).where(eq(recurringExpenses.id, expenseId)).limit(1))[0];
      if (!existing) return res.status(404).json({ message: "Recurring expense not found" });

      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== "oss_super_admin" && existing.ownerId !== user?.ownerId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const expense = await storage.updateRecurringExpense(expenseId, req.body);
      res.json(expense);
    } catch (error) {
      logger.error({ err: error }, "Error updating recurring expense");
      res.status(500).json({ message: "Failed to update recurring expense" });
    }
  });

  // --- Finance Center Summary/Analytics ---
  app.get("/api/finance-center/summary", requireRole("admin", "owner_admin", "property_manager"), async (req, res) => {
    try {
      const { hotelId, propertyId, ownerId, user } = await resolveFinanceHotelId(req.session.userId!);
      if (!hotelId && !ownerId) return res.status(400).json({ message: "No hotel assigned" });

      const isOwner = user?.role === "owner_admin" && ownerId;
      const [revenues, expenses, payrollEntriesList, cashAccountsList, payrollConfigsList] = await Promise.all([
        isOwner ? storage.getRevenuesByOwner(ownerId!, req.tenantId!) : storage.getRevenuesByHotel(hotelId!, req.tenantId!),
        isOwner ? storage.getExpensesByOwner(ownerId!, req.tenantId!) : storage.getExpensesByHotel(hotelId!, req.tenantId!),
        isOwner ? storage.getPayrollEntriesByOwner(ownerId!, req.tenantId!) : storage.getPayrollEntriesByHotel(hotelId!, req.tenantId!),
        isOwner ? storage.getCashAccountsByOwner(ownerId!, req.tenantId!) : storage.getCashAccountsByHotel(hotelId!, req.tenantId!),
        isOwner && ownerId ? storage.getPayrollConfigsByOwner(ownerId!, req.tenantId!) : (hotelId ? storage.getPayrollConfigsByHotel(hotelId!, req.tenantId!) : Promise.resolve([])),
      ]);

      const propId = propertyId || null;
      const property = propId ? await storage.getProperty(propId) : null;

      const now = new Date();
      const thisMonth = now.getMonth() + 1;
      const thisYear = now.getFullYear();

      const totalRevenue = revenues.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      const monthlyRevenue = revenues
        .filter((r: any) => {
          const d = new Date(r.createdAt);
          return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear;
        })
        .reduce((sum: number, r: any) => sum + (r.amount || 0), 0);

      const manualMonthlyExpenses = expenses
        .filter((e: any) => {
          const d = new Date(e.createdAt);
          return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear;
        })
        .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      const totalManualExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

      // Auto-calculated expenses from property financial settings
      const utilityExpensePct = property?.utilityExpensePct || 0;
      const cleaningExpenseMonthly = property?.cleaningExpenseMonthly || 0;
      const countryTaxRate = property?.countryTaxRate || 0;
      const autoUtilityExpense = utilityExpensePct > 0 ? Math.round(monthlyRevenue * utilityExpensePct / 100) : 0;
      const autoCleaningExpense = cleaningExpenseMonthly;
      const autoTaxExpense = countryTaxRate > 0 ? Math.round(monthlyRevenue * countryTaxRate / 100) : 0;
      const autoMonthlyExpenses = autoUtilityExpense + autoCleaningExpense + autoTaxExpense;
      const monthlyExpenses = manualMonthlyExpenses + autoMonthlyExpenses;
      const totalExpenses = totalManualExpenses + autoMonthlyExpenses;

      // Payroll: use manual entries if present, otherwise calculate from payroll_configs
      const manualMonthlyPayroll = payrollEntriesList
        .filter((p: any) => p.periodMonth === thisMonth && p.periodYear === thisYear)
        .reduce((sum: number, p: any) => sum + (p.netAmount || 0), 0);

      const hasPayrollEntries = payrollEntriesList.some((p: any) => p.periodMonth === thisMonth && p.periodYear === thisYear);
      const autoPayroll = !hasPayrollEntries
        ? payrollConfigsList
            .filter((c: any) => c.isActive)
            .reduce((sum: number, c: any) => {
              const base = c.baseSalary || 0;
              const taxCost = Math.round(base * (c.employeeTaxRate || 0) / 100);
              const addlExpenses = c.additionalExpensesMonthly || 0;
              return sum + base + taxCost + addlExpenses;
            }, 0)
        : 0;
      const monthlyPayroll = manualMonthlyPayroll + autoPayroll;

      const totalCashBalance = cashAccountsList.reduce((sum: number, a: any) => sum + (a.balance || 0), 0);
      const totalPayroll = payrollEntriesList.reduce((sum: number, p: any) => sum + (p.netAmount || 0), 0) + autoPayroll;

      res.json({
        totalRevenue,
        monthlyRevenue,
        totalExpenses,
        monthlyExpenses,
        monthlyPayroll,
        totalCashBalance,
        netProfit: totalRevenue - totalExpenses - totalPayroll,
        monthlyNetProfit: monthlyRevenue - monthlyExpenses - monthlyPayroll,
        revenueCount: revenues.length,
        expenseCount: expenses.length,
        payrollCount: payrollEntriesList.length + payrollConfigsList.filter((c: any) => c.isActive).length,
        accountCount: cashAccountsList.length,
        autoBreakdown: {
          utilityExpense: autoUtilityExpense,
          cleaningExpense: autoCleaningExpense,
          taxExpense: autoTaxExpense,
          autoPayroll,
          utilityExpensePct,
          cleaningExpenseMonthly,
          countryTaxRate,
        },
      });
    } catch (error) {
      logger.error({ err: error }, "Error fetching finance summary");
      res.status(500).json({ message: "Failed to fetch finance summary" });
    }
  });

  // ============== RECURRING EXPENSE SCHEDULER ==============
  async function processRecurringExpenses() {
    try {
      const dueExpenses = await storage.getDueRecurringExpenses();
      for (const recurring of dueExpenses) {
        const now = new Date();
        await storage.createExpense({
          hotelId: recurring.hotelId,
          propertyId: recurring.propertyId || null,
          ownerId: recurring.ownerId || null,
          recurringExpenseId: recurring.id,
          category: recurring.category,
          description: `[Auto] ${recurring.description}`,
          amount: recurring.amount,
          currency: recurring.currency,
          vendor: recurring.vendor || null,
          sourceType: "owner_config",
          periodMonth: now.getMonth() + 1,
          periodYear: now.getFullYear(),
          createdBy: recurring.createdBy || null,
          createdByName: null,
          receiptUrl: null,
          approvedBy: null,
          tenantId: recurring.tenantId || null,
        });

        let nextRun = new Date(now);
        switch (recurring.frequency) {
          case "daily": nextRun.setDate(nextRun.getDate() + 1); break;
          case "weekly": nextRun.setDate(nextRun.getDate() + 7); break;
          case "monthly": nextRun.setMonth(nextRun.getMonth() + 1); break;
          case "quarterly": nextRun.setMonth(nextRun.getMonth() + 3); break;
          case "yearly": nextRun.setFullYear(nextRun.getFullYear() + 1); break;
        }
        await storage.updateRecurringExpense(recurring.id, {
          lastRunAt: now,
          nextRunAt: nextRun,
        });
      }
    } catch (err) {
      logger.error({ err }, "Recurring expense scheduler error");
    }
  }

  setInterval(processRecurringExpenses, 60 * 60 * 1000);
  setTimeout(processRecurringExpenses, 10000);
}
