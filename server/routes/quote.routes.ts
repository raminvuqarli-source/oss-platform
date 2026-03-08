import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertQuoteRequestSchema } from "@shared/schema";
import type { QuoteRequestStatus } from "@shared/schema";
import { asString } from "../utils/request";
import { sendQuoteRequestEmail } from "../email";
import { requireAuth, requireRole } from "../middleware";
import { logger } from "../utils/logger";

export function registerQuoteRoutes(app: Express): void {

  // ===== QUOTE REQUESTS =====

  // Public: Submit a quote request
  app.post("/api/quote-requests", async (req, res) => {
    try {
      const data = insertQuoteRequestSchema.parse(req.body);

      // Create the quote request in database
      const quoteRequest = await storage.createQuoteRequest(data);

      // Try to send email notification
      const emailResult = await sendQuoteRequestEmail(quoteRequest);

      // Update email sent status
      if (emailResult.success) {
        await storage.updateQuoteRequest(quoteRequest.id, { emailSent: true });
      }

      res.status(201).json({
        success: true,
        message: "Quote request submitted successfully",
        emailSent: emailResult.success,
        id: quoteRequest.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      logger.error({ err: error }, "Error submitting quote request");
      res.status(500).json({ message: "Failed to submit quote request" });
    }
  });

  // OSS Super Admin only: Get all quote requests
  app.get("/api/quote-requests", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const requests = await storage.getAllQuoteRequests();
      res.json(requests);
    } catch (error) {
      logger.error({ err: error }, "Error fetching quote requests");
      res.status(500).json({ message: "Failed to fetch quote requests" });
    }
  });

  // OSS Super Admin only: Get single quote request
  app.get("/api/quote-requests/:id", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const request = await storage.getQuoteRequest(asString(req.params.id));
      if (!request) {
        return res.status(404).json({ message: "Quote request not found" });
      }
      res.json(request);
    } catch (error) {
      logger.error({ err: error }, "Error fetching quote request");
      res.status(500).json({ message: "Failed to fetch quote request" });
    }
  });

  // OSS Super Admin only: Update quote request (status, internal notes, assignment)
  app.patch("/api/quote-requests/:id", requireRole("oss_super_admin"), async (req, res) => {
    try {
      const { status, internalNotes, assignedToUserId } = req.body;
      
      const validStatuses = ["NEW", "CONTACTED", "DEMO_SCHEDULED", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"];
      const updates: { status?: QuoteRequestStatus; internalNotes?: string; assignedToUserId?: string; contactedAt?: Date } = {};
      
      if (status && validStatuses.includes(status)) {
        updates.status = status;
        // Track when first contacted
        if (status === "CONTACTED") {
          const existing = await storage.getQuoteRequest(asString(req.params.id));
          if (existing && !existing.contactedAt) {
            updates.contactedAt = new Date();
          }
        }
      }
      if (internalNotes !== undefined) {
        updates.internalNotes = internalNotes;
      }
      if (assignedToUserId !== undefined) {
        updates.assignedToUserId = assignedToUserId;
      }

      const updated = await storage.updateQuoteRequest(asString(req.params.id), updates);
      if (!updated) {
        return res.status(404).json({ message: "Quote request not found" });
      }
      res.json(updated);
    } catch (error) {
      logger.error({ err: error }, "Error updating quote request");
      res.status(500).json({ message: "Failed to update quote request" });
    }
  });
}
