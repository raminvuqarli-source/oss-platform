import type { Express } from "express";
import { storage } from "../storage";
import { requireRole } from "../middleware";
import { hashPassword } from "../services/auth.service";
import { logger } from "../utils/logger";
import { asString } from "../utils/request";

export function registerMarketingRoutes(app: Express) {
  // OSS Admin: Create a marketing staff user
  app.post("/api/oss-admin/marketing-users", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const { username, password, fullName, email, referralCode } = req.body;

      if (!username || !password || !fullName) {
        return res.status(400).json({ message: "Username, password, and full name are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      let code: string | undefined = undefined;
      if (referralCode) {
        code = referralCode.trim().toUpperCase();
        if (!/^[A-Z0-9_-]{2,20}$/.test(code)) {
          return res.status(400).json({ message: "Referral code must be 2–20 uppercase letters/numbers" });
        }
        const existing = await storage.getUserByReferralCode(code);
        if (existing) {
          return res.status(409).json({ message: "This referral code is already in use" });
        }
      }

      const hashed = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashed,
        fullName,
        email: email || null,
        role: "marketing_staff",
        referralCode: code || null,
      });

      res.status(201).json({ ...user, password: undefined });
    } catch (error) {
      logger.error({ err: error }, "Error creating marketing user");
      res.status(500).json({ message: "Failed to create marketing user" });
    }
  });

  // OSS Admin: List all marketing staff
  app.get("/api/oss-admin/marketing-users", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const allUsers = await storage.adminGetAllUsers();
      const marketingUsers = allUsers.filter(u => u.role === "marketing_staff");

      // For each marketing user, fetch their referred owners count
      const withStats = await Promise.all(
        marketingUsers.map(async (u) => {
          const allOwners = await storage.getAllOwners();
          const referredOwners = allOwners.filter(o => o.referralStaffId === u.id && o.status !== "deleted");
          return {
            ...u,
            password: undefined,
            referredCount: referredOwners.length,
          };
        })
      );

      res.json(withStats);
    } catch (error) {
      logger.error({ err: error }, "Error fetching marketing users");
      res.status(500).json({ message: "Failed to fetch marketing users" });
    }
  });

  // OSS Admin: Update referral code for a marketing user
  app.patch("/api/oss-admin/marketing-users/:userId/referral-code", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const userId = asString(req.params.userId);
      const { referralCode } = req.body;

      if (!referralCode) return res.status(400).json({ message: "referralCode is required" });
      const code = referralCode.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{2,20}$/.test(code)) {
        return res.status(400).json({ message: "Invalid code format" });
      }

      const existing = await storage.getUserByReferralCode(code);
      if (existing && existing.id !== userId) {
        return res.status(409).json({ message: "Code already in use by another user" });
      }

      const updated = await storage.updateUser(userId, { referralCode: code });
      if (!updated) return res.status(404).json({ message: "User not found" });

      res.json({ referralCode: updated.referralCode });
    } catch (error) {
      logger.error({ err: error }, "Error updating referral code");
      res.status(500).json({ message: "Failed to update referral code" });
    }
  });

  // Marketing Staff: Get my referred hotels
  app.get("/api/marketing/my-hotels", requireRole("marketing_staff"), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const allOwners = await storage.getAllOwners();
      const myOwners = allOwners.filter(o => o.referralStaffId === userId && o.status !== "deleted");

      const results = await Promise.all(
        myOwners.map(async (owner) => {
          const [properties, subscription] = await Promise.all([
            storage.getPropertiesByOwner(owner.id),
            storage.getSubscriptionByOwner(owner.id),
          ]);
          return {
            ownerId: owner.id,
            companyName: owner.companyName || owner.name,
            email: owner.email,
            joinedAt: owner.createdAt,
            status: owner.status,
            properties: properties.map(p => ({ name: p.name, type: p.type, city: p.city, country: p.country, totalUnits: p.totalUnits })),
            plan: subscription?.planCode || subscription?.planType || null,
            subscriptionStatus: subscription?.isActive ? "active" : (subscription?.status || "inactive"),
            trialEndsAt: subscription?.trialEndsAt || null,
            isTrial: subscription?.planType === "trial",
          };
        })
      );

      res.json(results);
    } catch (error) {
      logger.error({ err: error }, "Error fetching marketing hotels");
      res.status(500).json({ message: "Failed to fetch referred hotels" });
    }
  });

  // Marketing Staff: Get my commissions
  app.get("/api/marketing/my-commissions", requireRole("marketing_staff"), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const commissions = await storage.getReferralCommissionsByStaff(userId);
      res.json(commissions);
    } catch (error) {
      logger.error({ err: error }, "Error fetching commissions");
      res.status(500).json({ message: "Failed to fetch commissions" });
    }
  });

  // Marketing Staff: Get my profile / referral code
  app.get("/api/marketing/me", requireRole("marketing_staff"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ id: user.id, fullName: user.fullName, email: user.email, referralCode: user.referralCode });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
}
