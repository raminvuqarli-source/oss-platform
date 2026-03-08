import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth, requireRole } from "../middleware";
import { logger } from "../utils/logger";
import { generateInvoicePdf, getInvoicePdfPath } from "../services/invoicePdfService";
import { logActionAsync } from "../services/auditLogService";
import fs from "fs";
import path from "path";

const invoiceLogger = logger.child({ module: "invoice-routes" });

export function registerInvoiceRoutes(app: Express): void {

  app.get("/api/invoices", requireRole("owner_admin"), async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const ownerId = user.role === "owner_admin" ? user.id : user.ownerId;
      if (!ownerId) return res.status(403).json({ message: "No owner context" });

      const invoiceList = await storage.getInvoicesByOwner(ownerId);
      res.json(invoiceList);
    } catch (err: any) {
      invoiceLogger.error({ err: err.message }, "Failed to list invoices");
      res.status(500).json({ message: "Failed to list invoices" });
    }
  });

  app.get("/api/invoices/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getInvoice(req.params.id as string);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      if (user.role !== "oss_super_admin") {
        const ownerId = user.role === "owner_admin" ? user.id : user.ownerId;
        if (invoice.ownerId !== ownerId) {
          return res.status(403).json({ message: "Access denied" });
        }
        if (req.tenantId && invoice.tenantId && invoice.tenantId !== req.tenantId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      res.json(invoice);
    } catch (err: any) {
      invoiceLogger.error({ err: err.message }, "Failed to get invoice");
      res.status(500).json({ message: "Failed to get invoice" });
    }
  });

  app.get("/api/invoices/:id/pdf", requireAuth, async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getInvoice(req.params.id as string);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      if (user.role !== "oss_super_admin") {
        const ownerId = user.role === "owner_admin" ? user.id : user.ownerId;
        if (invoice.ownerId !== ownerId) {
          return res.status(403).json({ message: "Access denied" });
        }
        if (req.tenantId && invoice.tenantId && invoice.tenantId !== req.tenantId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const pdfPath = await getInvoicePdfPath(invoice.id);
      if (!pdfPath || !fs.existsSync(pdfPath)) {
        return res.status(404).json({ message: "PDF not available" });
      }

      const invoiceNumber = invoice.invoiceNumber || invoice.id.slice(0, 8);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${invoiceNumber}.pdf"`);

      const stream = fs.createReadStream(pdfPath);
      stream.pipe(res);

      stream.on("error", (streamErr) => {
        invoiceLogger.error({ err: streamErr.message, invoiceId: invoice.id }, "Error streaming PDF");
        if (!res.headersSent) {
          res.status(500).json({ message: "Error streaming PDF" });
        }
      });
    } catch (err: any) {
      invoiceLogger.error({ err: err.message }, "Failed to serve invoice PDF");
      res.status(500).json({ message: "Failed to serve invoice PDF" });
    }
  });

  app.post("/api/invoices/:id/regenerate-pdf", requireRole("owner_admin", "oss_super_admin"), async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getInvoice(req.params.id as string);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      if (user.role !== "oss_super_admin") {
        const ownerId = user.role === "owner_admin" ? user.id : user.ownerId;
        if (invoice.ownerId !== ownerId) {
          return res.status(403).json({ message: "Access denied" });
        }
        if (req.tenantId && invoice.tenantId && invoice.tenantId !== req.tenantId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const owner = await storage.getOwner(invoice.ownerId);
      const orgName = owner?.name || undefined;

      const pdfPath = await generateInvoicePdf(invoice, orgName);

      logActionAsync({
        tenantId: invoice.tenantId || null,
        userId: user.id,
        userRole: user.role,
        ownerId: invoice.ownerId,
        action: "invoice_regenerated",
        entityType: "invoice",
        entityId: invoice.id,
        description: `Invoice PDF regenerated for invoice ${(invoice as any).invoiceNumber || invoice.id}`,
      });

      invoiceLogger.info({ invoiceId: invoice.id, path: pdfPath }, "Invoice PDF regenerated");

      res.json({ message: "PDF regenerated", pdfUrl: `/api/invoices/${invoice.id}/pdf` });
    } catch (err: any) {
      invoiceLogger.error({ err: err.message }, "Failed to regenerate invoice PDF");
      res.status(500).json({ message: "Failed to regenerate invoice PDF" });
    }
  });
}
