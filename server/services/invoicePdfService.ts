import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import type { Invoice } from "@shared/schema";

const pdfLogger = logger.child({ module: "invoice-pdf" });

const STORAGE_DIR = path.resolve("storage/invoices");

function ensureStorageDir(): void {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

function generateInvoiceNumber(invoice: Invoice): string {
  if (invoice.invoiceNumber) return invoice.invoiceNumber;
  const date = invoice.createdAt ? new Date(invoice.createdAt) : new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const shortId = invoice.id.slice(0, 5).toUpperCase();
  return `INV-${y}${m}-${shortId}`;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "N/A";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

function formatAmount(cents: number, currency: string): string {
  const value = (cents / 100).toFixed(2);
  const sym = currency.toUpperCase() === "AZN" ? "AZN" : currency.toUpperCase() === "USD" ? "$" : currency.toUpperCase();
  return `${value} ${sym}`;
}

export async function generateInvoicePdf(invoice: Invoice, orgName?: string): Promise<string> {
  ensureStorageDir();

  const invoiceNumber = generateInvoiceNumber(invoice);
  const filePath = path.join(STORAGE_DIR, `${invoice.id}.pdf`);

  const relativePath = `storage/invoices/${invoice.id}.pdf`;

  return new Promise<string>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      const pageWidth = doc.page.width - 100;

      doc.fontSize(22).font("Helvetica-Bold").text("INVOICE", 50, 50);
      doc.fontSize(10).font("Helvetica").fillColor("#666666")
        .text("ORANGE STUDIO", 50, 80)
        .text("O.S.S Smart Hotel Platform", 50, 94);

      doc.fontSize(10).font("Helvetica").fillColor("#333333");
      const rightCol = 350;
      doc.text("Invoice Number:", rightCol, 50, { width: 100, align: "right" });
      doc.font("Helvetica-Bold").text(invoiceNumber, rightCol + 105, 50);

      doc.font("Helvetica").text("Issue Date:", rightCol, 66, { width: 100, align: "right" });
      doc.font("Helvetica-Bold").text(formatDate(invoice.createdAt), rightCol + 105, 66);

      doc.font("Helvetica").text("Status:", rightCol, 82, { width: 100, align: "right" });
      const statusColor = invoice.status === "paid" ? "#16a34a" : invoice.status === "draft" ? "#d97706" : "#dc2626";
      doc.font("Helvetica-Bold").fillColor(statusColor).text(invoice.status.toUpperCase(), rightCol + 105, 82);
      doc.fillColor("#333333");

      doc.moveTo(50, 120).lineTo(50 + pageWidth, 120).strokeColor("#e5e7eb").stroke();

      doc.fontSize(11).font("Helvetica-Bold").text("Bill To:", 50, 135);
      doc.fontSize(10).font("Helvetica").text(orgName || "Organization", 50, 152);

      doc.moveTo(50, 180).lineTo(50 + pageWidth, 180).strokeColor("#e5e7eb").stroke();

      const tableTop = 200;
      doc.rect(50, tableTop, pageWidth, 24).fill("#f3f4f6");
      doc.fillColor("#333333").fontSize(9).font("Helvetica-Bold");
      doc.text("DESCRIPTION", 60, tableTop + 7);
      doc.text("PERIOD", 250, tableTop + 7);
      doc.text("AMOUNT", 430, tableTop + 7, { width: 70, align: "right" });

      const rowTop = tableTop + 30;
      doc.fontSize(10).font("Helvetica").fillColor("#111827");
      doc.text(invoice.description || "Subscription", 60, rowTop);

      const periodText = invoice.periodStart && invoice.periodEnd
        ? `${formatDate(invoice.periodStart)} — ${formatDate(invoice.periodEnd)}`
        : "N/A";
      doc.text(periodText, 250, rowTop);

      doc.font("Helvetica-Bold")
        .text(formatAmount(invoice.amount, invoice.currency), 430, rowTop, { width: 70, align: "right" });

      doc.moveTo(50, rowTop + 25).lineTo(50 + pageWidth, rowTop + 25).strokeColor("#e5e7eb").stroke();

      const totalTop = rowTop + 35;
      doc.fontSize(10).font("Helvetica").text("Subtotal:", 350, totalTop, { width: 80, align: "right" });
      doc.font("Helvetica-Bold").text(formatAmount(invoice.amount, invoice.currency), 430, totalTop, { width: 70, align: "right" });

      doc.font("Helvetica").text("Tax:", 350, totalTop + 18, { width: 80, align: "right" });
      doc.font("Helvetica-Bold").text("0.00", 430, totalTop + 18, { width: 70, align: "right" });

      doc.moveTo(350, totalTop + 38).lineTo(50 + pageWidth, totalTop + 38).strokeColor("#333333").lineWidth(1.5).stroke();

      doc.fontSize(12).font("Helvetica-Bold").text("TOTAL:", 350, totalTop + 46, { width: 80, align: "right" });
      doc.text(formatAmount(invoice.amount, invoice.currency), 430, totalTop + 46, { width: 70, align: "right" });

      if (invoice.paidAt) {
        doc.fontSize(9).font("Helvetica").fillColor("#16a34a")
          .text(`Paid on ${formatDate(invoice.paidAt)}`, 50, totalTop + 50);
      }

      const footerY = doc.page.height - 80;
      doc.moveTo(50, footerY).lineTo(50 + pageWidth, footerY).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
      doc.fontSize(8).font("Helvetica").fillColor("#9ca3af")
        .text("ORANGE STUDIO — O.S.S Smart Hotel Platform", 50, footerY + 10, { align: "center", width: pageWidth })
        .text("This invoice was generated automatically. For questions, contact support@ossai.com", 50, footerY + 22, { align: "center", width: pageWidth });

      doc.end();

      writeStream.on("finish", async () => {
        try {
          await storage.updateInvoice(invoice.id, {
            invoiceNumber,
            pdfPath: relativePath,
            pdfUrl: `/api/invoices/${invoice.id}/pdf`,
          });
          pdfLogger.info({ invoiceId: invoice.id, invoiceNumber, path: filePath }, "Invoice PDF generated");
          resolve(filePath);
        } catch (updateErr: any) {
          pdfLogger.error({ err: updateErr.message, invoiceId: invoice.id }, "Failed to update invoice with PDF path");
          resolve(filePath);
        }
      });

      writeStream.on("error", (err) => {
        pdfLogger.error({ err: err.message, invoiceId: invoice.id }, "Failed to write PDF file");
        reject(err);
      });
    } catch (err: any) {
      pdfLogger.error({ err: err.message, invoiceId: invoice.id }, "Failed to generate PDF");
      reject(err);
    }
  });
}

export function resolveInvoicePdfPath(invoiceId: string, storedPath?: string | null): string {
  if (storedPath) {
    if (path.isAbsolute(storedPath)) return storedPath;
    return path.resolve(storedPath);
  }
  return path.join(STORAGE_DIR, `${invoiceId}.pdf`);
}

export async function getInvoicePdfPath(invoiceId: string): Promise<string | null> {
  const invoice = await storage.getInvoice(invoiceId);
  if (!invoice) return null;

  const resolvedPath = resolveInvoicePdfPath(invoiceId, invoice.pdfPath);
  if (fs.existsSync(resolvedPath)) {
    return resolvedPath;
  }

  try {
    const filePath = await generateInvoicePdf(invoice);
    return filePath;
  } catch {
    return null;
  }
}
