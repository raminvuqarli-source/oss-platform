import PDFDocument from "pdfkit";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import type { GuestFolio, FolioCharge, FolioPayment, FolioAdjustment, Booking, User } from "@shared/schema";

const pdfLog = logger.child({ module: "folio-pdf" });

function fmt(d: Date | string | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

function money(cents: number, currency = "USD"): string {
  const sym = currency === "AZN" ? "AZN " : currency === "EUR" ? "€" : "$";
  return `${sym}${(cents / 100).toFixed(2)}`;
}

interface FolioInvoiceData {
  folio: GuestFolio;
  booking: Booking | null;
  guest: User | null;
  hotel: { name: string };
  charges: FolioCharge[];
  payments: FolioPayment[];
  adjustments: FolioAdjustment[];
}

export async function generateFolioInvoicePdf(folioId: string): Promise<Buffer> {
  const folio = await storage.getGuestFolio(folioId);
  if (!folio) throw new Error("Folio not found");

  const [charges, payments, adjustments] = await Promise.all([
    storage.getFolioCharges(folio.id),
    storage.getFolioPayments(folio.id),
    storage.getFolioAdjustments(folio.id),
  ]);

  const booking = await storage.getBooking(folio.bookingId);
  const guest = booking ? await storage.getUser(booking.guestId) : null;
  const hotelRec = booking?.propertyId ? await storage.getProperty(booking.propertyId) : null;
  const hotelName = hotelRec?.name ?? "Hotel";

  const postedCharges = charges.filter(c => c.status === "posted");
  const approvedAdjustments = adjustments.filter(a => a.approvalStatus === "approved");
  const currency = folio.currency ?? "USD";

  const subtotal = postedCharges.reduce((s, c) => s + c.amountNet, 0);
  const totalTax = postedCharges.reduce((s, c) => s + (c.taxAmount ?? 0), 0);
  const totalGross = postedCharges.reduce((s, c) => s + c.amountGross, 0);
  const totalPaid = payments.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  const totalAdj = approvedAdjustments.reduce((s, a) => s + a.amount, 0);
  const amountDue = totalGross + totalAdj - totalPaid;

  const guestName = guest?.fullName || guest?.username || "Guest";

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: "A4", margins: { top: 50, bottom: 50, left: 50, right: 50 } });

      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const W = doc.page.width - 100;
      const GRAY = "#6b7280";
      const DARK = "#111827";
      const GREEN = "#16a34a";
      const ACCENT = "#1e40af";

      doc.rect(0, 0, doc.page.width, 8).fill(ACCENT);
      doc.moveDown(0.3);

      doc.fontSize(22).font("Helvetica-Bold").fillColor(ACCENT).text("FOLIO INVOICE", 50, 30);
      doc.fontSize(9).font("Helvetica").fillColor(GRAY).text("O.S.S Smart Hotel System", 50, 58);
      doc.fillColor(DARK);

      const rightX = 350;
      doc.fontSize(9).font("Helvetica").fillColor(GRAY).text("Invoice Number:", rightX, 30, { width: 105, align: "right" });
      doc.font("Helvetica-Bold").fillColor(DARK).text(folio.folioNumber, rightX + 110, 30);

      doc.font("Helvetica").fillColor(GRAY).text("Date:", rightX, 46, { width: 105, align: "right" });
      doc.font("Helvetica-Bold").fillColor(DARK).text(fmt(folio.finalizedAt ?? folio.closedAt ?? new Date()), rightX + 110, 46);

      doc.font("Helvetica").fillColor(GRAY).text("Status:", rightX, 62, { width: 105, align: "right" });
      const statusColor = folio.status === "finalized" ? GREEN : folio.status === "closed" ? "#d97706" : ACCENT;
      doc.font("Helvetica-Bold").fillColor(statusColor).text(folio.status.toUpperCase(), rightX + 110, 62);
      doc.fillColor(DARK);

      doc.moveTo(50, 85).lineTo(50 + W, 85).strokeColor("#e5e7eb").lineWidth(0.5).stroke();

      let y = 100;
      const col2 = 310;

      doc.fontSize(9).font("Helvetica-Bold").fillColor(GRAY).text("GUEST", 50, y);
      doc.font("Helvetica").fillColor(DARK);
      doc.text(guestName, 50, y + 14);
      if (guest?.email) doc.text(guest.email, 50, y + 26);
      if (guest?.phoneNumber) doc.text(guest.phoneNumber, 50, y + 38);

      doc.fontSize(9).font("Helvetica-Bold").fillColor(GRAY).text("PROPERTY", col2, y);
      doc.font("Helvetica").fillColor(DARK);
      doc.text(hotelName, col2, y + 14);
      if (booking?.roomNumber) doc.text(`Room: ${booking.roomNumber}`, col2, y + 26);

      doc.fontSize(9).font("Helvetica-Bold").fillColor(GRAY).text("STAY PERIOD", col2 + 150, y);
      doc.font("Helvetica").fillColor(DARK);
      doc.text(fmt(booking?.checkInDate), col2 + 150, y + 14);
      doc.text(`→ ${fmt(booking?.checkOutDate)}`, col2 + 150, y + 26);

      y += 65;
      doc.moveTo(50, y).lineTo(50 + W, y).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
      y += 12;

      doc.fontSize(10).font("Helvetica-Bold").text("CHARGES", 50, y);
      y += 18;

      doc.rect(50, y, W, 20).fill("#f3f4f6");
      doc.fillColor(DARK).fontSize(8).font("Helvetica-Bold");
      doc.text("DATE", 58, y + 6);
      doc.text("DESCRIPTION", 115, y + 6);
      doc.text("QTY", 350, y + 6, { width: 30, align: "right" });
      doc.text("UNIT", 385, y + 6, { width: 50, align: "right" });
      doc.text("TAX%", 438, y + 6, { width: 30, align: "right" });
      doc.text("GROSS", 470, y + 6, { width: 75, align: "right" });
      y += 22;

      for (const charge of postedCharges) {
        if (y > doc.page.height - 140) {
          doc.addPage();
          y = 50;
        }
        const isEven = postedCharges.indexOf(charge) % 2 === 0;
        if (isEven) doc.rect(50, y - 2, W, 18).fill("#f9fafb");
        doc.fillColor(DARK).fontSize(8).font("Helvetica");
        doc.text(fmt(charge.serviceDate), 58, y + 1);
        doc.text(charge.description.slice(0, 45), 115, y + 1);
        doc.text(String(charge.quantity ?? 1), 350, y + 1, { width: 30, align: "right" });
        doc.text(money(charge.unitPrice, currency), 385, y + 1, { width: 50, align: "right" });
        const taxPct = ((charge.taxRate ?? 0) / 100).toFixed(0);
        doc.text(charge.taxRate ? `${taxPct}%` : "—", 438, y + 1, { width: 30, align: "right" });
        doc.font("Helvetica-Bold").text(money(charge.amountGross, currency), 470, y + 1, { width: 75, align: "right" });
        y += 16;
      }

      if (approvedAdjustments.length > 0) {
        y += 6;
        doc.fontSize(9).font("Helvetica-Bold").text("ADJUSTMENTS", 50, y);
        y += 14;
        for (const adj of approvedAdjustments) {
          doc.fontSize(8).font("Helvetica").fillColor(DARK);
          doc.text(adj.description.slice(0, 60), 58, y + 1);
          const adjColor = adj.amount < 0 ? GREEN : "#dc2626";
          doc.fillColor(adjColor).font("Helvetica-Bold").text(money(adj.amount, currency), 470, y + 1, { width: 75, align: "right" });
          doc.fillColor(DARK);
          y += 16;
        }
      }

      y += 8;
      doc.moveTo(350, y).lineTo(50 + W, y).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
      y += 8;

      const summaryRows: [string, string, boolean?][] = [
        ["Subtotal", money(subtotal, currency)],
        ["Tax", money(totalTax, currency)],
        ["Total Gross", money(totalGross, currency), true],
        ["Total Paid", money(totalPaid, currency)],
      ];
      for (const [label, value, bold] of summaryRows) {
        doc.fontSize(9).font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(GRAY).text(label + ":", 350, y, { width: 115, align: "right" });
        doc.fillColor(DARK).font(bold ? "Helvetica-Bold" : "Helvetica").text(value, 470, y, { width: 75, align: "right" });
        y += 16;
      }

      doc.moveTo(350, y).lineTo(50 + W, y).strokeColor(DARK).lineWidth(1.5).stroke();
      y += 6;

      const dueColor = amountDue <= 0 ? GREEN : "#dc2626";
      doc.fontSize(11).font("Helvetica-Bold").fillColor(dueColor);
      doc.text("AMOUNT DUE:", 350, y, { width: 115, align: "right" });
      doc.text(money(amountDue, currency), 470, y, { width: 75, align: "right" });
      doc.fillColor(DARK);

      if (payments.length > 0) {
        y += 30;
        doc.moveTo(50, y).lineTo(50 + W, y).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
        y += 10;
        doc.fontSize(10).font("Helvetica-Bold").text("PAYMENTS RECEIVED", 50, y);
        y += 16;
        for (const p of payments.filter(p => p.status === "completed")) {
          doc.fontSize(8).font("Helvetica").fillColor(DARK);
          const label = `${p.paymentMethod?.toUpperCase() ?? ""}${p.isDeposit ? " (deposit)" : ""}`;
          doc.text(label, 58, y);
          doc.text(fmt(p.receivedAt), 250, y);
          if (p.referenceNumber) doc.text(`Ref: ${p.referenceNumber}`, 350, y);
          doc.font("Helvetica-Bold").fillColor(GREEN).text(money(p.amount, currency), 470, y, { width: 75, align: "right" });
          doc.fillColor(DARK);
          y += 14;
        }
      }

      const footerY = doc.page.height - 65;
      doc.rect(0, footerY - 5, doc.page.width, 1).fill("#e5e7eb");
      doc.fontSize(7).font("Helvetica").fillColor(GRAY);
      doc.text("This is an official folio invoice generated by O.S.S Smart Hotel System.", 50, footerY + 5, { align: "center", width: W });
      doc.text("For inquiries, contact your property manager.", 50, footerY + 17, { align: "center", width: W });

      doc.end();
    } catch (err) {
      pdfLog.error({ err, folioId }, "PDF generation failed");
      reject(err);
    }
  });
}
