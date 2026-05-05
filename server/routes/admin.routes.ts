import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { asString } from "../utils/request";
import { requireAuth, requireRole } from "../middleware";
import { hashPassword } from "../services/auth.service";
import { insertContractSchema, insertBoardReportSchema, PLAN_TYPE_TO_CODE } from "@shared/schema";
import { z } from "zod";
import { logger } from "../utils/logger";
import { calculateSaasMetrics, calculateMrrTrend } from "../services/saasMetricsService";
import { getAlertStats, getRecentAlerts } from "../services/monitoringService";

export function registerAdminRoutes(app: Express): void {

  // ===== OSS SUPER ADMIN ROUTES =====

  // OSS Super Admin only: Get quote request notes
  app.get("/api/quote-requests/:id/notes", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const notes = await storage.getQuoteNotes(asString(req.params.id));
      res.json(notes);
    } catch (error) {
      logger.error({ err: error }, "Error fetching quote notes");
      res.status(500).json({ message: "Failed to fetch quote notes" });
    }
  });

  // OSS Super Admin only: Add note to quote request
  app.post("/api/quote-requests/:id/notes", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const { noteText } = req.body;
      if (!noteText || typeof noteText !== "string" || noteText.trim().length === 0) {
        return res.status(400).json({ message: "Note text is required" });
      }

      const note = await storage.createQuoteNote({
        quoteRequestId: asString(req.params.id),
        authorUserId: user.id,
        noteText: noteText.trim(),
      });
      res.status(201).json(note);
    } catch (error) {
      logger.error({ err: error }, "Error creating quote note");
      res.status(500).json({ message: "Failed to create quote note" });
    }
  });

  // OSS Admin: Get dashboard stats
  app.get("/api/oss-admin/stats", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const stats = await storage.getQuoteRequestsCount();
      
      // Get new requests in last 7 days
      const allRequests = await storage.getAllQuoteRequests();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const newLast7Days = allRequests.filter(r => 
        r.createdAt && new Date(r.createdAt) >= sevenDaysAgo
      ).length;
      
      res.json({
        ...stats,
        newLast7Days,
      });
    } catch (error) {
      logger.error({ err: error }, "Error fetching OSS admin stats");
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // OSS Admin: Get OSS team users
  app.get("/api/oss-admin/users", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const users = await storage.getOssSuperAdminUsers();
      res.json(users);
    } catch (error) {
      logger.error({ err: error }, "Error fetching OSS users");
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // OSS Admin: Create OSS team user
  app.post("/api/oss-admin/users", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const { username, password, fullName, email } = req.body;
      
      if (!username || !password || !fullName) {
        return res.status(400).json({ message: "Username, password, and full name are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const hashedOssPw = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedOssPw,
        fullName,
        email,
        role: "oss_super_admin",
      });

      res.status(201).json({ ...user, password: undefined });
    } catch (error) {
      logger.error({ err: error }, "Error creating OSS user");
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // OSS Admin: Set referral code for a team user
  app.patch("/api/oss-admin/users/:userId/referral-code", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const userId = asString(req.params.userId);
      const { referralCode } = req.body;

      if (!referralCode || typeof referralCode !== "string") {
        return res.status(400).json({ message: "referralCode is required" });
      }

      const code = referralCode.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{2,20}$/.test(code)) {
        return res.status(400).json({ message: "Referral code must be 2–20 uppercase letters/numbers only" });
      }

      // Check uniqueness
      const existing = await storage.getUserByReferralCode(code);
      if (existing && existing.id !== userId) {
        return res.status(409).json({ message: "This referral code is already used by another user" });
      }

      const updated = await storage.updateUser(userId, { referralCode: code });
      if (!updated) return res.status(404).json({ message: "User not found" });

      res.json({ referralCode: updated.referralCode });
    } catch (error) {
      logger.error({ err: error }, "Error setting referral code");
      res.status(500).json({ message: "Failed to set referral code" });
    }
  });

  // OSS Admin: Get platform-wide statistics
  app.get("/api/oss-admin/platform-stats", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const [rawOwners, allProperties, allUsers] = await Promise.all([
        storage.getAllOwners(),
        storage.adminGetAllProperties(),
        storage.adminGetAllUsers(),
      ]);
      const allOwners = rawOwners.filter(o => o.status !== "deleted");

      const totalOwners = allOwners.length;
      const totalProperties = allProperties.length;
      const totalRooms = allProperties.reduce((sum, p) => sum + (p.totalUnits || 0), 0);
      const totalUsers = allUsers.length;

      const staffRoles = ["staff", "reception", "admin", "property_manager"];
      const totalStaff = allUsers.filter(u => staffRoles.includes(u.role)).length;

      const subscriptionResults = await Promise.all(
        allOwners.map(owner => storage.getSubscriptionByOwner(owner.id))
      );
      const activeSubs = subscriptionResults.filter(s => s && s.isActive === true);
      const subscriptionsByPlan: Record<string, number> = { basic: 0, pro: 0, apartment_lite: 0 };
      for (const sub of activeSubs) {
        if (sub && sub.planType && subscriptionsByPlan.hasOwnProperty(sub.planType)) {
          subscriptionsByPlan[sub.planType]++;
        }
      }

      res.json({
        totalOwners,
        totalProperties,
        totalRooms,
        totalUsers,
        activeSubscriptions: activeSubs.length,
        subscriptionsByPlan,
        totalStaff,
      });
    } catch (error) {
      logger.error({ err: error }, "Error fetching platform stats");
      res.status(500).json({ message: "Failed to fetch platform stats" });
    }
  });

  // OSS Admin: Get all owner_admin customers
  app.get("/api/oss-admin/customers", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const search = req.query.search ? String(req.query.search).toLowerCase() : null;
      const planFilter = req.query.plan ? String(req.query.plan) : null;
      const statusFilter = req.query.status ? String(req.query.status) : null;

      const allOwners = await storage.getAllOwners();
      const activeOwners = allOwners.filter(o => o.status !== "deleted");

      const results = await Promise.all(
        activeOwners.map(async (owner) => {
          const [adminAllUsers, ownerProperties, subscription] = await Promise.all([
            storage.adminGetAllUsers(),
            storage.getPropertiesByOwner(owner.id),
            storage.getSubscriptionByOwner(owner.id),
          ]);
          const ownerUsers = adminAllUsers.filter(u => u.ownerId === owner.id);

          const ownerUser = ownerUsers.find(u => u.role === "owner_admin") || ownerUsers[0];

          const totalRooms = ownerProperties.reduce((sum, p) => sum + (p.totalUnits || 0), 0);

          return {
            ownerId: owner.id,
            companyName: owner.companyName || owner.name,
            email: ownerUser?.email || owner.email,
            fullName: ownerUser?.fullName || owner.name,
            propertyCount: ownerProperties.length,
            totalRooms,
            plan: subscription?.planType || null,
            subscriptionActive: subscription?.isActive || false,
            status: owner.status || "active",
            createdAt: owner.createdAt,
            _ownerUser: ownerUser,
            _subscription: subscription,
          };
        })
      );

      let filtered = results;

      if (search) {
        filtered = filtered.filter(r =>
          (r.companyName && r.companyName.toLowerCase().includes(search)) ||
          (r.email && r.email.toLowerCase().includes(search)) ||
          (r.fullName && r.fullName.toLowerCase().includes(search))
        );
      }

      if (planFilter) {
        filtered = filtered.filter(r => r.plan === planFilter);
      }

      if (statusFilter === "active") {
        filtered = filtered.filter(r => r.subscriptionActive === true);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(r => r.subscriptionActive === false);
      }

      const response = filtered.map(({ _ownerUser, _subscription, ...rest }) => rest);

      res.json(response);
    } catch (error) {
      logger.error({ err: error }, "Error fetching customers");
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // OSS Admin: Get detailed info for one customer
  app.get("/api/oss-admin/customers/:ownerId", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const ownerId = asString(req.params.ownerId);
      const owner = await storage.getOwner(ownerId);
      if (!owner) {
        return res.status(404).json({ message: "Owner not found" });
      }

      const [adminAllUsers, ownerProperties, subscription, billingInfo, auditLogs] = await Promise.all([
        storage.adminGetAllUsers(),
        storage.getPropertiesByOwner(ownerId),
        storage.getSubscriptionByOwner(ownerId),
        storage.getBillingInfo(ownerId),
        storage.getAuditLogsByOwner(ownerId, 10),
      ]);
      const ownerUsers = adminAllUsers.filter(u => u.ownerId === ownerId);

      const ownerUser = ownerUsers.find(u => u.role === "owner_admin") || ownerUsers[0];

      const staffRoles = ["staff", "reception", "admin", "property_manager"];
      const staffCount = ownerUsers.filter(u => staffRoles.includes(u.role)).length;

      // Resolve referral staff name if present
      let referralStaffName: string | null = null;
      if (owner.referralStaffId) {
        const referralStaff = adminAllUsers.find(u => u.id === owner.referralStaffId);
        referralStaffName = referralStaff?.fullName || referralStaff?.username || null;
      }

      res.json({
        owner,
        referralStaffName,
        user: ownerUser ? {
          fullName: ownerUser.fullName,
          email: ownerUser.email,
          username: ownerUser.username,
          createdAt: ownerUser.createdAt,
        } : null,
        properties: ownerProperties.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          totalUnits: p.totalUnits,
          city: p.city,
          country: p.country,
        })),
        subscription,
        billingInfo,
        staffCount,
        recentActivity: auditLogs,
      });
    } catch (error) {
      logger.error({ err: error }, "Error fetching customer detail");
      res.status(500).json({ message: "Failed to fetch customer detail" });
    }
  });

  // OSS Admin: Get all subscriptions with owner info
  app.get("/api/oss-admin/subscriptions", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const planFilter = req.query.plan ? String(req.query.plan) : null;
      const statusFilter = req.query.status ? String(req.query.status) : null;

      const allOwners = (await storage.getAllOwners()).filter(o => o.status !== "deleted");

      const results = await Promise.all(
        allOwners.map(async (owner) => {
          const subscription = await storage.getSubscriptionByOwner(owner.id);
          return {
            subscriptionId: subscription?.id || null,
            ownerId: owner.id,
            companyName: owner.companyName || owner.name,
            email: owner.email,
            planType: subscription?.planType || null,
            status: (subscription as any)?.status || null,
            isActive: subscription?.isActive || false,
            trialEndsAt: subscription?.trialEndsAt || null,
            createdAt: subscription?.createdAt || owner.createdAt,
          };
        })
      );

      let filtered = results;

      if (planFilter) {
        filtered = filtered.filter(r => r.planType === planFilter);
      }

      if (statusFilter === "active") {
        filtered = filtered.filter(r => r.isActive === true);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(r => r.isActive === false);
      }

      res.json(filtered);
    } catch (error) {
      logger.error({ err: error }, "Error fetching subscriptions");
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  // OSS Admin: Extend trial for a subscription (and optionally update plan code)
  app.post("/api/oss-admin/subscriptions/:subscriptionId/extend-trial", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const subscriptionId = asString(req.params.subscriptionId);
      const days = typeof req.body.days === "number" ? req.body.days : 30;
      const newPlanCode = req.body.planCode || null;

      const { PLAN_CODE_FEATURES, PLAN_TYPE_TO_CODE } = await import("@shared/planFeatures");
      const validPlanCodes = Object.keys(PLAN_CODE_FEATURES);

      const trialEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      const updateData: Record<string, unknown> = {
        trialEndsAt,
        status: "trial",
        isActive: true,
      };

      if (newPlanCode && validPlanCodes.includes(newPlanCode)) {
        updateData.planCode = newPlanCode;
        const planTypeEntry = Object.entries(PLAN_TYPE_TO_CODE).find(([, v]) => v === newPlanCode);
        if (planTypeEntry) updateData.planType = planTypeEntry[0];
      }

      await storage.updateSubscription(subscriptionId, updateData as any);
      logger.info({ subscriptionId, days, newPlanCode }, "Trial extended by OSS admin");
      res.json({ message: `Trial extended by ${days} days`, planCode: newPlanCode });
    } catch (error) {
      logger.error({ err: error }, "Error extending trial");
      res.status(500).json({ message: "Failed to extend trial" });
    }
  });

  // OSS Admin: Activate trial for an owner who has no active subscription
  app.post("/api/oss-admin/owners/:ownerId/activate-trial", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const ownerId = asString(req.params.ownerId);
      const days = typeof req.body.days === "number" ? req.body.days : 30;
      const planCode = req.body.planCode || "CORE_PRO";

      const owner = await storage.getOwner(ownerId);
      if (!owner) return res.status(404).json({ message: "Owner not found" });

      const { PLAN_CODE_FEATURES, applyPlanFeatures } = await import("@shared/planFeatures");
      const validPlanCodes = Object.keys(PLAN_CODE_FEATURES);
      const resolvedPlanCode = validPlanCodes.includes(planCode) ? planCode : "CORE_PRO";

      const planTypeEntry = Object.entries(PLAN_TYPE_TO_CODE).find(([, v]) => v === resolvedPlanCode);
      const resolvedPlanType = (planTypeEntry?.[0] || "pro") as any;
      const planDefaults = applyPlanFeatures(resolvedPlanType);

      const trialEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      // Use raw DB query to find any subscription for this owner (even inactive)
      const { db } = await import("../db");
      const { subscriptions: subTable } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const existingSubs = await db.select().from(subTable).where(eq(subTable.ownerId, ownerId)).limit(1);

      if (existingSubs.length > 0) {
        const existing = existingSubs[0];
        await storage.updateSubscription(existing.id, {
          planCode: resolvedPlanCode,
          planType: resolvedPlanType,
          status: "trial",
          isActive: true,
          trialEndsAt,
          ...planDefaults,
        } as any);
        logger.info({ ownerId, planCode: resolvedPlanCode, days }, "OSS admin activated existing subscription");
        return res.json({ message: "Subscription activated", planCode: resolvedPlanCode });
      }

      // No subscription at all — create one
      await storage.createSubscription({
        ownerId,
        planType: resolvedPlanType,
        planCode: resolvedPlanCode,
        ...planDefaults,
        trialEndsAt,
        isActive: true,
        status: "trial",
      } as any);
      logger.info({ ownerId, planCode: resolvedPlanCode, days }, "OSS admin created new trial subscription");
      res.json({ message: "Trial subscription created", planCode: resolvedPlanCode });
    } catch (error) {
      logger.error({ err: error }, "Error activating trial");
      res.status(500).json({ message: "Failed to activate trial" });
    }
  });

  // OSS Admin: Update customer status (suspend/delete/activate)
  app.patch("/api/oss-admin/customers/:ownerId/status", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const ownerId = asString(req.params.ownerId);
      const { status } = req.body;

      if (!["active", "suspended", "deleted"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be active, suspended, or deleted." });
      }

      const owner = await storage.getOwner(ownerId);
      if (!owner) {
        return res.status(404).json({ message: "Owner not found" });
      }

      await storage.updateOwner(ownerId, { status });

      if (status === "suspended" || status === "deleted") {
        const ownerProperties = await storage.getPropertiesByOwner(ownerId);
        for (const prop of ownerProperties) {
          await storage.updateProperty(prop.id, { isActive: false });
        }
      }

      if (status === "active") {
        const ownerProperties = await storage.getPropertiesByOwner(ownerId);
        for (const prop of ownerProperties) {
          await storage.updateProperty(prop.id, { isActive: true });
        }
      }

      res.json({ message: `Customer status updated to ${status}` });
    } catch (error) {
      logger.error({ err: error }, "Error updating customer status");
      res.status(500).json({ message: "Failed to update customer status" });
    }
  });

  app.delete("/api/oss-admin/customers/:ownerId", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const ownerId = asString(req.params.ownerId);
      const owner = await storage.getOwner(ownerId);
      if (!owner) {
        return res.status(404).json({ message: "Owner not found" });
      }

      const { db: database } = await import("../db");
      const { sql: rawSql } = await import("drizzle-orm");

      const deleteQueries: Array<{ table: string; query: any }> = [
        { table: "room_settings (by booking)", query: rawSql`DELETE FROM room_settings WHERE booking_id IN (SELECT id FROM bookings WHERE owner_id = ${ownerId})` },
        { table: "room_settings (by tenant)", query: rawSql`DELETE FROM room_settings WHERE tenant_id = ${ownerId}` },
        { table: "service_requests (by owner)", query: rawSql`DELETE FROM service_requests WHERE owner_id = ${ownerId}` },
        { table: "service_requests (by guest)", query: rawSql`DELETE FROM service_requests WHERE guest_id IN (SELECT id FROM users WHERE owner_id = ${ownerId} OR (tenant_id = ${ownerId} AND role = 'guest'))` },
        { table: "room_preparation_orders", query: rawSql`DELETE FROM room_preparation_orders WHERE owner_id = ${ownerId}` },
        { table: "chat_messages (by hotel)", query: rawSql`DELETE FROM chat_messages WHERE hotel_id IN (SELECT id FROM hotels WHERE owner_id = ${ownerId})` },
        { table: "chat_messages (by tenant)", query: rawSql`DELETE FROM chat_messages WHERE tenant_id = ${ownerId}` },
        { table: "notifications", query: rawSql`DELETE FROM notifications WHERE tenant_id = ${ownerId}` },
        { table: "bookings (by owner)", query: rawSql`DELETE FROM bookings WHERE owner_id = ${ownerId}` },
        { table: "bookings (by guest)", query: rawSql`DELETE FROM bookings WHERE guest_id IN (SELECT id FROM users WHERE owner_id = ${ownerId} OR (tenant_id = ${ownerId} AND role = 'guest'))` },
        { table: "financial_transactions", query: rawSql`DELETE FROM financial_transactions WHERE owner_id = ${ownerId}` },
        { table: "no_show_records", query: rawSql`DELETE FROM no_show_records WHERE hotel_id IN (SELECT id FROM hotels WHERE owner_id = ${ownerId})` },
        { table: "revenues", query: rawSql`DELETE FROM revenues WHERE owner_id = ${ownerId}` },
        { table: "expenses", query: rawSql`DELETE FROM expenses WHERE owner_id = ${ownerId}` },
        { table: "payroll_configs", query: rawSql`DELETE FROM payroll_configs WHERE owner_id = ${ownerId}` },
        { table: "payroll_entries", query: rawSql`DELETE FROM payroll_entries WHERE owner_id = ${ownerId}` },
        { table: "cash_accounts", query: rawSql`DELETE FROM cash_accounts WHERE owner_id = ${ownerId}` },
        { table: "recurring_expenses", query: rawSql`DELETE FROM recurring_expenses WHERE owner_id = ${ownerId}` },
        { table: "devices", query: rawSql`DELETE FROM devices WHERE owner_id = ${ownerId}` },
        { table: "subscriptions", query: rawSql`DELETE FROM subscriptions WHERE owner_id = ${ownerId}` },
        { table: "invoices", query: rawSql`DELETE FROM invoices WHERE owner_id = ${ownerId}` },
        { table: "payment_orders", query: rawSql`DELETE FROM payment_orders WHERE owner_id = ${ownerId}` },
        { table: "billing_info", query: rawSql`DELETE FROM billing_info WHERE owner_id = ${ownerId}` },
        { table: "feature_flag_overrides", query: rawSql`DELETE FROM feature_flag_overrides WHERE owner_id = ${ownerId}` },
        { table: "usage_meters", query: rawSql`DELETE FROM usage_meters WHERE owner_id = ${ownerId}` },
        { table: "white_label_settings", query: rawSql`DELETE FROM white_label_settings WHERE owner_id = ${ownerId}` },
        { table: "onboarding_progress", query: rawSql`DELETE FROM onboarding_progress WHERE owner_id = ${ownerId}` },
        { table: "audit_logs", query: rawSql`DELETE FROM audit_logs WHERE owner_id = ${ownerId}` },
        { table: "staff_message_status", query: rawSql`DELETE FROM staff_message_status WHERE message_id IN (SELECT id FROM staff_messages WHERE tenant_id = ${ownerId})` },
        { table: "staff_messages", query: rawSql`DELETE FROM staff_messages WHERE tenant_id = ${ownerId}` },
        { table: "staff_performance_scores", query: rawSql`DELETE FROM staff_performance_scores WHERE tenant_id = ${ownerId}` },
        { table: "staff_feedback", query: rawSql`DELETE FROM staff_feedback WHERE owner_id = ${ownerId}` },
        { table: "contracts", query: rawSql`DELETE FROM contracts WHERE owner_id = ${ownerId}` },
        { table: "credential_logs", query: rawSql`DELETE FROM credential_logs WHERE tenant_id = ${ownerId}` },
        { table: "units", query: rawSql`DELETE FROM units WHERE property_id IN (SELECT id FROM properties WHERE owner_id = ${ownerId})` },
        { table: "users (by owner)", query: rawSql`DELETE FROM users WHERE owner_id = ${ownerId}` },
        { table: "users (guests by tenant)", query: rawSql`DELETE FROM users WHERE tenant_id = ${ownerId} AND role = 'guest'` },
        { table: "hotels", query: rawSql`DELETE FROM hotels WHERE owner_id = ${ownerId}` },
        { table: "properties", query: rawSql`DELETE FROM properties WHERE owner_id = ${ownerId}` },
        { table: "owners", query: rawSql`DELETE FROM owners WHERE id = ${ownerId}` },
      ];

      for (const { table, query } of deleteQueries) {
        try {
          await database.execute(query);
        } catch (err: any) {
          logger.error({ table, err: err.message }, "Delete customer failed on table");
          if (!err.message?.includes("does not exist")) throw err;
        }
      }

      res.json({ message: "Customer permanently deleted" });
    } catch (error) {
      logger.error({ err: error }, "Error permanently deleting customer");
      res.status(500).json({ message: "Failed to permanently delete customer" });
    }
  });

  // ===== CONTRACTS ROUTES =====

  app.get("/api/oss-admin/contracts", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const allContracts = await storage.getContracts();
      res.json(allContracts);
    } catch (error) {
      logger.error({ err: error }, "Error fetching contracts");
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.get("/api/oss-admin/contracts/summary", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const allContracts = await storage.getContracts();
      const activeContracts = allContracts.filter(c => c.status !== "cancelled" && c.status !== "draft");
      
      let totalGross = 0;
      let totalTax = 0;
      let totalStateFee = 0;
      let totalPartnerCommission = 0;
      const byRegion: Record<string, { gross: number; tax: number; stateFee: number; partnerCommission: number; net: number; count: number }> = {};

      for (const c of activeContracts) {
        const gross = c.contractValue;
        const tax = gross * (c.taxPercent / 100);
        const stateFee = gross * (c.stateFeePercent / 100);
        const partnerComm = c.partnerCompany ? gross * (c.partnerCommissionPercent / 100) : 0;
        const net = gross - tax - stateFee - partnerComm;

        totalGross += gross;
        totalTax += tax;
        totalStateFee += stateFee;
        totalPartnerCommission += partnerComm;

        const region = c.region || "Unknown";
        if (!byRegion[region]) {
          byRegion[region] = { gross: 0, tax: 0, stateFee: 0, partnerCommission: 0, net: 0, count: 0 };
        }
        byRegion[region].gross += gross;
        byRegion[region].tax += tax;
        byRegion[region].stateFee += stateFee;
        byRegion[region].partnerCommission += partnerComm;
        byRegion[region].net += net;
        byRegion[region].count += 1;
      }

      const totalNet = totalGross - totalTax - totalStateFee - totalPartnerCommission;

      res.json({
        totalContracts: activeContracts.length,
        totalGross,
        totalTax,
        totalStateFee,
        totalPartnerCommission,
        totalNet,
        byRegion,
      });
    } catch (error) {
      logger.error({ err: error }, "Error fetching contract summary");
      res.status(500).json({ message: "Failed to fetch contract summary" });
    }
  });

  app.post("/api/oss-admin/contracts", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const data = insertContractSchema.parse(req.body);
      const contract = await storage.createContract({ ...data, createdBy: req.session.userId || undefined });
      res.json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      logger.error({ err: error }, "Error creating contract");
      res.status(500).json({ message: "Failed to create contract" });
    }
  });

  app.patch("/api/oss-admin/contracts/:id", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const contract = await storage.updateContract(asString(req.params.id), req.body);
      if (!contract) return res.status(404).json({ message: "Contract not found" });
      res.json(contract);
    } catch (error) {
      logger.error({ err: error }, "Error updating contract");
      res.status(500).json({ message: "Failed to update contract" });
    }
  });

  app.delete("/api/oss-admin/contracts/:id", requireRole("oss_super_admin"), async (req, res) => {
    try {
      await storage.deleteContract(asString(req.params.id));
      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error }, "Error deleting contract");
      res.status(500).json({ message: "Failed to delete contract" });
    }
  });

  // ===== BOARD REPORTS ROUTES =====

  app.get("/api/oss-admin/board-reports", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const reports = await storage.getBoardReports();
      res.json(reports);
    } catch (error) {
      logger.error({ err: error }, "Error fetching board reports");
      res.status(500).json({ message: "Failed to fetch board reports" });
    }
  });

  app.post("/api/oss-admin/board-reports", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const data = insertBoardReportSchema.parse(req.body);
      const report = await storage.createBoardReport({ ...data, createdBy: req.session.userId || undefined });
      res.json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      logger.error({ err: error }, "Error creating board report");
      res.status(500).json({ message: "Failed to create board report" });
    }
  });

  app.delete("/api/oss-admin/board-reports/:id", requireRole("oss_super_admin"), async (req, res) => {
    try {
      await storage.deleteBoardReport(asString(req.params.id));
      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error }, "Error deleting board report");
      res.status(500).json({ message: "Failed to delete board report" });
    }
  });

  app.get("/api/admin/saas-metrics", requireRole("oss_super_admin"), async (req: Request, res: Response) => {
    try {
      const metrics = await calculateSaasMetrics();
      const mrrTrend = await calculateMrrTrend(12);

      res.json({
        ...metrics,
        mrrTrend,
      });
    } catch (error) {
      logger.error({ err: error }, "Error calculating SaaS metrics");
      res.status(500).json({ message: "Failed to calculate SaaS metrics" });
    }
  });

  app.get("/api/admin/system/backups", requireRole("oss_super_admin"), async (_req: Request, res: Response) => {
    try {
      const { listBackups } = await import("../workers/backupWorker");
      const backups = listBackups();
      res.json({
        backups,
        maxBackups: 7,
        schedule: "Daily at 03:00 (Asia/Baku)",
      });
    } catch (error) {
      logger.error({ err: error }, "Failed to list backups");
      res.status(500).json({ message: "Failed to list backups" });
    }
  });

  app.post("/api/admin/system/backups/trigger", requireRole("oss_super_admin"), async (_req: Request, res: Response) => {
    try {
      const { runBackup } = await import("../workers/backupWorker");
      const result = await runBackup();
      if (result.success) {
        res.json({ message: "Backup completed", filename: result.filename, size: result.size });
      } else {
        res.status(500).json({ message: "Backup failed", error: result.error });
      }
    } catch (error) {
      logger.error({ err: error }, "Failed to trigger backup");
      res.status(500).json({ message: "Failed to trigger backup" });
    }
  });

  app.get("/api/system/health", requireRole("oss_super_admin"), async (_req: Request, res: Response) => {
    try {
      const mem = process.memoryUsage();
      const { getJobQueueStatus } = await import("../services/jobQueue");
      const queueStatus = getJobQueueStatus();
      const alertStats = getAlertStats();

      const { pool } = await import("../db");
      let dbOk = false;
      try {
        const client = await (pool as any).connect();
        await client.query("SELECT 1");
        client.release();
        dbOk = true;
      } catch {
        dbOk = false;
      }

      const status = dbOk && alertStats.total === 0 ? "healthy" :
                     dbOk ? "warning" : "critical";

      res.json({
        status,
        uptime: Math.floor(process.uptime()),
        memory: {
          rss: mem.rss,
          heapUsed: mem.heapUsed,
          heapTotal: mem.heapTotal,
          external: mem.external,
        },
        database: dbOk,
        queue: queueStatus,
        alerts: alertStats,
        recentAlerts: getRecentAlerts(10),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ err: error }, "System health check failed");
      res.status(500).json({ status: "error", message: "Health check failed" });
    }
  });

  app.get("/api/admin/audit-logs", requireRole("oss_super_admin"), async (req: Request, res: Response) => {
    try {
      const limitParam = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offsetParam = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const tenantId = req.query.tenantId as string | undefined;
      const action = req.query.action as string | undefined;
      const entityType = req.query.entityType as string | undefined;
      const search = req.query.search as string | undefined;
      const from = req.query.from ? new Date(req.query.from as string) : undefined;
      const to = req.query.to ? new Date(req.query.to as string) : undefined;

      if (from && isNaN(from.getTime())) return res.status(400).json({ message: "Invalid 'from' date" });
      if (to && isNaN(to.getTime())) return res.status(400).json({ message: "Invalid 'to' date" });

      const result = await storage.getAuditLogsAdmin({
        tenantId,
        action,
        entityType,
        from,
        to,
        search,
        limit: Math.min(limitParam, 200),
        offset: offsetParam,
      });

      res.json(result);
    } catch (error) {
      logger.error({ err: error }, "Failed to fetch admin audit logs");
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.patch("/api/oss-admin/users/:userId/role", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const ALLOWED_ROLES = ["admin", "owner_admin", "reception", "staff", "property_manager", "restaurant_manager", "waiter", "kitchen_staff", "restaurant_cleaner", "restaurant_cashier", "marketing_staff"];
      if (!role || !ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ message: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(", ")}` });
      }
      const user = await storage.updateUser(userId, { role });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ id: user.id, username: user.username, role: user.role });
    } catch (error) {
      logger.error({ err: error }, "Failed to update user role");
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
}
