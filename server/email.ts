import { Resend } from "resend";
import type { QuoteRequest } from "@shared/schema";
import { logger } from "./utils/logger";
import { env } from "./config/env";

// Resend integration via Replit connector (connection:conn_resend_01KH8M2GZ4591XMXXZKCDTB7RE)
let connectionSettings: any;

async function getCredentials(): Promise<{ apiKey: string; fromEmail: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (xReplitToken && hostname) {
    try {
      const url = "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend";
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          X_REPLIT_TOKEN: xReplitToken,
        },
      });
      const responseData = await response.json();
      connectionSettings = responseData.items?.[0];

      if (connectionSettings?.settings?.api_key) {
        const fromEmail = connectionSettings.settings.from_email || "O.S.S Hotel System <onboarding@resend.dev>";
        return { apiKey: connectionSettings.settings.api_key, fromEmail };
      } else {
        logger.warn({ keys: Object.keys(connectionSettings?.settings || {}) }, "Connector found but no api_key in settings");
      }
    } catch (err) {
      logger.error({ err }, "Failed to fetch connector credentials");
    }
  }

  const fallbackKey = process.env.RESEND_API_KEY;
  if (fallbackKey) {
    const fromEmail = process.env.EMAIL_FROM || "O.S.S Hotel System <onboarding@resend.dev>";
    return { apiKey: fallbackKey, fromEmail };
  }

  throw new Error("Email service not configured - no Resend connector and no RESEND_API_KEY env var");
}

export async function getResendClient(): Promise<{ client: Resend; fromEmail: string }> {
  const { apiKey, fromEmail } = await getCredentials();
  return { client: new Resend(apiKey), fromEmail };
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

function getAppUrl(): string {
  return process.env.APP_BASE_URL || process.env.BASE_URL || env.BASE_URL;
}

function baseStyles(): string {
  return `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 28px 24px; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .content { background: #ffffff; padding: 28px 24px; border: 1px solid #e5e7eb; border-top: none; }
    .section { margin-bottom: 16px; }
    .label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { font-size: 15px; margin-top: 4px; color: #1f2937; }
    .btn { display: inline-block; background: #f97316; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
    .btn-container { text-align: center; margin: 28px 0; }
    .info-box { background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; margin: 16px 0; font-size: 14px; color: #92400e; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-label { color: #6b7280; font-size: 14px; }
    .detail-value { color: #1f2937; font-weight: 500; font-size: 14px; }
    .footer { background: #1f2937; color: #9ca3af; padding: 18px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px; }
    .footer a { color: #f97316; text-decoration: none; }
  `;
}

// ===================== STAFF INVITATION EMAIL =====================

interface StaffInvitationEmailData {
  to: string;
  propertyName: string;
  staffRole: string;
  invitedByName: string;
  inviteToken: string;
}

export async function sendStaffInvitationEmail(data: StaffInvitationEmailData): Promise<SendEmailResult> {
  if (!data.to) {
    logger.error("Staff invitation FAILED: no recipient email provided");
    return { success: false, error: "No recipient email" };
  }

  const appUrl = getAppUrl();
  const joinUrl = `${appUrl}/join-team?token=${data.inviteToken}`;

  const roleLabels: Record<string, string> = {
    front_desk: "Front Desk",
    manager: "Manager",
    cleaner: "Housekeeping",
  };
  const roleLabel = roleLabels[data.staffRole] || data.staffRole;

  const subject = `You're invited to join ${data.propertyName} on O.S.S`;

  const html = `
<!DOCTYPE html>
<html>
<head><style>${baseStyles()}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Team Invitation</h1>
      <p>${data.propertyName}</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-top: 0;">Hello,</p>
      <p><strong>${data.invitedByName}</strong> has invited you to join <strong>${data.propertyName}</strong> as a <strong>${roleLabel}</strong> on the O.S.S Smart Hotel System.</p>

      <div class="info-box">
        <strong>Role:</strong> ${roleLabel}<br/>
        <strong>Property:</strong> ${data.propertyName}
      </div>

      <div class="btn-container">
        <a href="${joinUrl}" class="btn">Accept Invitation</a>
      </div>

      <p style="font-size: 13px; color: #6b7280;">If you didn't expect this invitation, you can safely ignore this email. The link will remain active until it is used or cancelled by the property owner.</p>
      <p style="font-size: 13px; color: #6b7280;">If the button doesn't work, copy and paste this URL into your browser:<br/>
      <a href="${joinUrl}" style="color: #f97316; word-break: break-all;">${joinUrl}</a></p>
    </div>
    <div class="footer">
      O.S.S &mdash; Smart Hotel System &copy; ${new Date().getFullYear()}
    </div>
  </div>
</body>
</html>`;

  const text = `Team Invitation - ${data.propertyName}

${data.invitedByName} has invited you to join ${data.propertyName} as a ${roleLabel} on the O.S.S Smart Hotel System.

Accept the invitation by visiting: ${joinUrl}

If you didn't expect this invitation, you can safely ignore this email.`;

  return sendEmail({ to: data.to, subject, html, text, emailType: "staff_invitation" });
}

// ===================== STAFF WELCOME EMAIL (direct create) =====================

interface StaffCreatedEmailData {
  to: string;
  fullName: string;
  username: string;
  password: string;
  propertyName: string;
  role: string;
  invitedByName: string;
}

export async function sendStaffCreatedEmail(data: StaffCreatedEmailData): Promise<SendEmailResult> {
  if (!data.to) return { success: false, error: "No recipient email" };

  const appUrl = getAppUrl();
  const roleLabels: Record<string, string> = {
    admin: "Admin", reception: "Reception", cleaner: "Housekeeping",
    restaurant_manager: "Restaurant Manager", waiter: "Waiter",
    kitchen_staff: "Kitchen Staff", staff: "Staff",
  };
  const roleLabel = roleLabels[data.role] || data.role;
  const subject = `Welcome to ${data.propertyName} — Your O.S.S Account`;

  const html = `
<!DOCTYPE html>
<html>
<head><style>${baseStyles()}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to O.S.S</h1>
      <p>${data.propertyName}</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-top: 0;">Hello ${data.fullName},</p>
      <p><strong>${data.invitedByName}</strong> has created an account for you on the <strong>O.S.S Smart Hotel System</strong> as a <strong>${roleLabel}</strong>.</p>
      <div class="info-box">
        <strong>Your login credentials:</strong><br/>
        <strong>Username:</strong> ${data.username}<br/>
        <strong>Temporary Password:</strong> ${data.password}<br/>
        <strong>Role:</strong> ${roleLabel}<br/>
        <strong>Property:</strong> ${data.propertyName}
      </div>
      <div class="btn-container">
        <a href="${appUrl}/login" class="btn">Sign In Now</a>
      </div>
      <p style="font-size: 13px; color: #6b7280;">Please change your password after your first login. If you did not expect this email, please contact your property manager.</p>
    </div>
    <div class="footer">O.S.S &mdash; Smart Hotel System &copy; ${new Date().getFullYear()}</div>
  </div>
</body>
</html>`;

  const text = `Welcome to ${data.propertyName} — O.S.S\n\nHello ${data.fullName},\n\n${data.invitedByName} has created an account for you.\n\nUsername: ${data.username}\nTemporary Password: ${data.password}\nRole: ${roleLabel}\n\nSign in at: ${appUrl}/login\n\nPlease change your password after first login.`;

  return sendEmail({ to: data.to, subject, html, text, emailType: "staff_invitation" });
}

// ===================== PASSWORD RESET EMAIL =====================

interface PasswordResetEmailData {
  to: string;
  resetToken: string;
  userName: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<SendEmailResult> {
  if (!data.to) {
    logger.error("Password reset FAILED: no recipient email provided");
    return { success: false, error: "No recipient email" };
  }

  const appUrl = getAppUrl();
  const resetUrl = `${appUrl}/reset-password?token=${data.resetToken}`;

  const subject = "Reset Your Password - O.S.S";

  const html = `
<!DOCTYPE html>
<html>
<head><style>${baseStyles()}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset</h1>
      <p>O.S.S Smart Hotel System</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-top: 0;">Hello ${data.userName},</p>
      <p>We received a request to reset your password. Click the button below to choose a new password.</p>

      <div class="btn-container">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>

      <div class="info-box">
        This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </div>

      <p style="font-size: 13px; color: #6b7280;">If the button doesn't work, copy and paste this URL into your browser:<br/>
      <a href="${resetUrl}" style="color: #f97316; word-break: break-all;">${resetUrl}</a></p>
    </div>
    <div class="footer">
      O.S.S &mdash; Smart Hotel System &copy; ${new Date().getFullYear()}
    </div>
  </div>
</body>
</html>`;

  const text = `Password Reset - O.S.S Smart Hotel System

Hello ${data.userName},

We received a request to reset your password. Visit the link below to choose a new password:

${resetUrl}

This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.`;

  return sendEmail({ to: data.to, subject, html, text, emailType: "password_reset" });
}

// ===================== BOOKING CONFIRMATION EMAIL =====================

interface BookingConfirmationEmailData {
  to: string;
  guestName: string;
  propertyName?: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  bookingNumber?: string;
  numberOfGuests?: number;
  nightlyRate?: string;
  totalPrice?: string;
  currency?: string;
  username: string;
  resetPasswordUrl?: string;
}

export async function sendBookingConfirmationEmail(data: BookingConfirmationEmailData): Promise<SendEmailResult> {
  if (!data.to) {
    logger.error("Booking confirmation FAILED: no recipient email provided");
    return { success: false, error: "No recipient email" };
  }

  const curr = data.currency || "USD";
  const propertyName = data.propertyName || "Your Hotel";

  const subject = `Booking Confirmed - ${propertyName}`;

  const detailRows = [
    { label: "Booking Number", value: data.bookingNumber || "\u2014" },
    { label: "Room", value: data.roomNumber },
    { label: "Check-in", value: formatDisplayDate(data.checkInDate) },
    { label: "Check-out", value: formatDisplayDate(data.checkOutDate) },
    { label: "Guests", value: String(data.numberOfGuests || 1) },
  ];
  if (data.nightlyRate) {
    detailRows.push({ label: "Nightly Rate", value: `${curr} ${data.nightlyRate}` });
  }
  if (data.totalPrice) {
    detailRows.push({ label: "Total Price", value: `${curr} ${data.totalPrice}` });
  }

  const detailsHtml = detailRows
    .map((r) => `<tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">${r.label}</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#1f2937;font-weight:500;font-size:14px;text-align:right;">${r.value}</td></tr>`)
    .join("");

  const appUrl = getAppUrl();
  const guestLoginUrl = `${appUrl}/login?switch=true`;

  const credentialsHtml = data.resetPasswordUrl
    ? `<div class="info-box">
        <strong>Your login credentials:</strong><br/>
        Username: <strong>${data.username}</strong><br/>
        Login URL: <a href="${guestLoginUrl}" style="color: #f97316;">${guestLoginUrl}</a><br/>
        Please set your password using the link below to access the guest portal.
      </div>
      <div class="btn-container">
        <a href="${data.resetPasswordUrl}" class="btn">Set Your Password</a>
      </div>`
    : `<div class="info-box">
        <strong>Your login credentials:</strong><br/>
        Username: <strong>${data.username}</strong><br/>
        Login URL: <a href="${guestLoginUrl}" style="color: #f97316;">${guestLoginUrl}</a><br/>
        Please contact the hotel front desk for your login password.
      </div>`;

  const html = `
<!DOCTYPE html>
<html>
<head><style>${baseStyles()}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Confirmed</h1>
      <p>${propertyName}</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-top: 0;">Hello ${data.guestName},</p>
      <p>Your booking at <strong>${propertyName}</strong> has been confirmed. Here are your reservation details:</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        ${detailsHtml}
      </table>

      ${credentialsHtml}

      <p style="font-size: 14px; color: #4b5563;">If you have any questions about your stay, please contact the hotel directly.</p>
    </div>
    <div class="footer">
      O.S.S &mdash; Smart Hotel System &copy; ${new Date().getFullYear()}
    </div>
  </div>
</body>
</html>`;

  const detailsText = detailRows.map((r) => `${r.label}: ${r.value}`).join("\n");

  const text = `Booking Confirmed - ${propertyName}

Hello ${data.guestName},

Your booking at ${propertyName} has been confirmed.

${detailsText}

Your login username: ${data.username}
Login URL: ${guestLoginUrl}

If you have any questions, please contact the hotel directly.`;

  return sendEmail({ to: data.to, subject, html, text, emailType: "booking_confirmation" });
}

// ===================== QUOTE REQUEST EMAIL =====================

export async function sendQuoteRequestEmail(
  quoteRequest: QuoteRequest,
  recipientEmail: string = "Ramin.v@orange-studio.az"
): Promise<SendEmailResult> {
  const subject = `New GET QUOTE Request - ${quoteRequest.hotelName} (${quoteRequest.country}, ${quoteRequest.city})`;

  const html = `
<!DOCTYPE html>
<html>
<head><style>${baseStyles()}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Quote Request</h1>
      <p>O.S.S Smart Hotel System</p>
    </div>
    <div class="content">
      <div class="section"><div class="label">Hotel Name</div><div class="value">${quoteRequest.hotelName}</div></div>
      <div class="section"><div class="label">Contact Person</div><div class="value">${quoteRequest.contactName}</div></div>
      <div class="section"><div class="label">Phone</div><div class="value">${quoteRequest.phone}</div></div>
      <div class="section"><div class="label">Email</div><div class="value"><a href="mailto:${quoteRequest.email}">${quoteRequest.email}</a></div></div>
      <div class="section"><div class="label">Location</div><div class="value">${quoteRequest.city}, ${quoteRequest.country}</div></div>
      <div class="section"><div class="label">Preferred Contact Hours</div><div class="value">${quoteRequest.preferredContactHours || "Not specified"} ${quoteRequest.timezone ? `(${quoteRequest.timezone})` : ""}</div></div>
      <div class="section"><div class="label">Preferred Contact Method</div><div class="value">${quoteRequest.preferredContactMethod || "Not specified"}</div></div>
      <div class="section"><div class="label">Total Rooms</div><div class="value">${quoteRequest.totalRooms || "Not specified"}</div></div>
      <div class="section"><div class="label">Expected Smart Rooms</div><div class="value">${quoteRequest.expectedSmartRooms || "Not specified"}</div></div>
      <div class="section"><div class="label">Interested Features</div><div class="value">${formatFeatures(quoteRequest.interestedFeatures)}</div></div>
      <div class="section"><div class="label">Message / Notes</div><div class="value">${quoteRequest.message || "No additional message"}</div></div>
      <div class="section"><div class="label">Submitted At</div><div class="value">${formatDisplayDate(quoteRequest.createdAt)}</div></div>
    </div>
    <div class="footer">
      O.S.S &mdash; Smart Hotel System &copy; ${new Date().getFullYear()}
    </div>
  </div>
</body>
</html>`;

  const text = `O.S.S - New Quote Request
========================
Hotel Name: ${quoteRequest.hotelName}
Contact Person: ${quoteRequest.contactName}
Phone: ${quoteRequest.phone}
Email: ${quoteRequest.email}
Location: ${quoteRequest.city}, ${quoteRequest.country}
Total Rooms: ${quoteRequest.totalRooms || "Not specified"}
Expected Smart Rooms: ${quoteRequest.expectedSmartRooms || "Not specified"}
Interested Features: ${formatFeatures(quoteRequest.interestedFeatures)}
Message: ${quoteRequest.message || "No additional message"}
Submitted At: ${formatDisplayDate(quoteRequest.createdAt)}`;

  return sendEmail({ to: recipientEmail, subject, html, text, emailType: "quote_request" });
}

// ===================== PAYMENT FAILED EMAIL =====================

interface PaymentFailedEmailData {
  to: string;
  ownerName: string;
  amount: string;
  currency: string;
  invoiceUrl: string;
  attemptCount: number;
}

export async function sendPaymentFailedEmail(data: PaymentFailedEmailData): Promise<SendEmailResult> {
  if (!data.to) return { success: false, error: "No recipient email" };

  const appUrl = getAppUrl();
  const subject = `Payment Failed - Action Required | O.S.S`;

  const html = `
<!DOCTYPE html>
<html>
<head><style>${baseStyles()}</style></head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #dc2626, #b91c1c);">
      <h1>Payment Failed</h1>
      <p>Action Required</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-top: 0;">Hello ${data.ownerName},</p>
      <p>We were unable to process your payment of <strong>${data.currency} ${data.amount}</strong> for your O.S.S subscription.</p>
      <div class="info-box" style="background: #fef2f2; border-color: #fecaca; color: #991b1b;">
        <strong>Attempt ${data.attemptCount}</strong> &mdash; ${data.attemptCount >= 3 ? "Your account may be suspended if payment is not resolved." : "We will retry automatically, but please update your payment method to avoid interruption."}
      </div>
      ${data.invoiceUrl ? `<div class="btn-container"><a href="${data.invoiceUrl}" class="btn" style="background: #dc2626;">Pay Now</a></div>` : ""}
      <div class="btn-container"><a href="${appUrl}/settings" class="btn" style="background: #6b7280;">Manage Billing</a></div>
    </div>
    <div class="footer">O.S.S &mdash; Smart Hotel System &copy; ${new Date().getFullYear()}</div>
  </div>
</body>
</html>`;

  const text = `Payment Failed - O.S.S\n\nHello ${data.ownerName},\n\nWe could not process your payment of ${data.currency} ${data.amount}.\nAttempt: ${data.attemptCount}\n\n${data.invoiceUrl ? `Pay now: ${data.invoiceUrl}` : ""}\nManage billing: ${appUrl}/settings`;

  return sendEmail({ to: data.to, subject, html, text, emailType: "payment_failed" });
}

// ===================== SUBSCRIPTION RENEWAL REMINDER EMAIL =====================

interface SubscriptionRenewalEmailData {
  to: string;
  ownerName: string;
  planName: string;
  amount: string;
  currency: string;
  renewalDate: string;
}

export async function sendSubscriptionRenewalEmail(data: SubscriptionRenewalEmailData): Promise<SendEmailResult> {
  if (!data.to) return { success: false, error: "No recipient email" };

  const appUrl = getAppUrl();
  const subject = `Subscription Renewal Reminder | O.S.S`;

  const html = `
<!DOCTYPE html>
<html>
<head><style>${baseStyles()}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Renewal Reminder</h1>
      <p>O.S.S Smart Hotel System</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-top: 0;">Hello ${data.ownerName},</p>
      <p>Your <strong>${data.planName}</strong> subscription will renew on <strong>${data.renewalDate}</strong>.</p>
      <div class="info-box">
        <strong>Amount:</strong> ${data.currency} ${data.amount}/month<br/>
        <strong>Next billing date:</strong> ${data.renewalDate}
      </div>
      <p style="font-size: 14px; color: #4b5563;">If you'd like to change your plan or update your payment method, visit your account settings.</p>
      <div class="btn-container"><a href="${appUrl}/settings" class="btn">Manage Subscription</a></div>
    </div>
    <div class="footer">O.S.S &mdash; Smart Hotel System &copy; ${new Date().getFullYear()}</div>
  </div>
</body>
</html>`;

  const text = `Subscription Renewal Reminder\n\nHello ${data.ownerName},\n\nYour ${data.planName} plan will renew on ${data.renewalDate} for ${data.currency} ${data.amount}/month.\n\nManage subscription: ${appUrl}/settings`;

  return sendEmail({ to: data.to, subject, html, text, emailType: "subscription_renewal" });
}

// ===================== INVOICE DELIVERY EMAIL =====================

interface InvoiceDeliveryEmailData {
  to: string;
  ownerName: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  invoiceUrl: string;
  pdfUrl?: string;
}

export async function sendInvoiceEmail(data: InvoiceDeliveryEmailData): Promise<SendEmailResult> {
  if (!data.to) return { success: false, error: "No recipient email" };

  const subject = `Invoice ${data.invoiceNumber} - O.S.S`;

  const html = `
<!DOCTYPE html>
<html>
<head><style>${baseStyles()}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invoice</h1>
      <p>${data.invoiceNumber}</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-top: 0;">Hello ${data.ownerName},</p>
      <p>Here is your invoice for the period <strong>${data.periodStart}</strong> to <strong>${data.periodEnd}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Invoice Number</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#1f2937;font-weight:500;font-size:14px;text-align:right;">${data.invoiceNumber}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Amount</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#1f2937;font-weight:500;font-size:14px;text-align:right;">${data.currency} ${data.amount}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Period</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#1f2937;font-weight:500;font-size:14px;text-align:right;">${data.periodStart} - ${data.periodEnd}</td></tr>
      </table>
      <div class="btn-container"><a href="${data.invoiceUrl}" class="btn">View Invoice</a></div>
      ${data.pdfUrl ? `<p style="font-size: 13px; color: #6b7280; text-align: center;"><a href="${data.pdfUrl}" style="color: #f97316;">Download PDF</a></p>` : ""}
    </div>
    <div class="footer">O.S.S &mdash; Smart Hotel System &copy; ${new Date().getFullYear()}</div>
  </div>
</body>
</html>`;

  const text = `Invoice ${data.invoiceNumber}\n\nHello ${data.ownerName},\n\nAmount: ${data.currency} ${data.amount}\nPeriod: ${data.periodStart} - ${data.periodEnd}\n\nView invoice: ${data.invoiceUrl}`;

  return sendEmail({ to: data.to, subject, html, text, emailType: "invoice_delivery" });
}

// ===================== HOTEL WELCOME EMAIL =====================

interface HotelWelcomeEmailData {
  to: string;
  ownerName: string;
  hotelName: string;
  planName?: string;
}

export async function sendHotelWelcomeEmail(data: HotelWelcomeEmailData): Promise<SendEmailResult> {
  if (!data.to) {
    logger.error("Hotel welcome FAILED: no recipient email provided");
    return { success: false, error: "No recipient email" };
  }

  const appUrl = getAppUrl();
  const dashboardUrl = `${appUrl}/dashboard`;
  const planName = data.planName || "14-Day Free Trial";

  const subject = `Welcome to O.S.S - ${data.hotelName}`;

  const html = `
<!DOCTYPE html>
<html>
<head><style>${baseStyles()}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to O.S.S</h1>
      <p>Smart Hotel System</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-top: 0;">Hello ${data.ownerName},</p>
      <p>Thank you for registering <strong>${data.hotelName}</strong> on the O.S.S Smart Hotel System. Your account is ready to use.</p>

      <div class="info-box">
        <strong>Your Plan:</strong> ${planName}<br/>
        <strong>Property:</strong> ${data.hotelName}
      </div>

      <p>Here's what you can do next:</p>
      <ul style="color: #4b5563; font-size: 14px; line-height: 2;">
        <li>Set up your rooms and smart devices</li>
        <li>Invite your staff members</li>
        <li>Configure your property settings</li>
        <li>Start managing bookings</li>
      </ul>

      <div class="btn-container">
        <a href="${dashboardUrl}" class="btn">Go to Dashboard</a>
      </div>

      <p style="font-size: 13px; color: #6b7280;">If you have any questions, our support team is here to help. Simply reply to this email or visit our help center.</p>
    </div>
    <div class="footer">
      O.S.S &mdash; Smart Hotel System &copy; ${new Date().getFullYear()}
    </div>
  </div>
</body>
</html>`;

  const text = `Welcome to O.S.S - Smart Hotel System

Hello ${data.ownerName},

Thank you for registering ${data.hotelName} on the O.S.S Smart Hotel System. Your account is ready to use.

Your Plan: ${planName}
Property: ${data.hotelName}

Get started by visiting your dashboard: ${dashboardUrl}

If you have any questions, our support team is here to help.`;

  return sendEmail({ to: data.to, subject, html, text, emailType: "hotel_welcome" });
}

// ===================== SHARED HELPERS =====================

function formatDisplayDate(date: Date | string | null): string {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatFeatures(features: string[] | null): string {
  if (!features || features.length === 0) return "None specified";
  return features.join(", ");
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  emailType: string;
}

const RESEND_DEFAULT_FROM = "O.S.S Hotel System <onboarding@resend.dev>";

async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    if (!params.to) {
      logger.error({ emailType: params.emailType }, "ABORTED: recipient email is empty/undefined");
      return { success: false, error: "No recipient email address" };
    }

    const { client, fromEmail } = await getResendClient();

    const result = await client.emails.send({
      from: fromEmail,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (result.error) {
      const errMsg = result.error.message || "";
      logger.error({ emailType: params.emailType, errorName: result.error.name, errorMsg: errMsg }, "Resend API error");

      if (errMsg.includes("domain is not verified") && fromEmail !== RESEND_DEFAULT_FROM) {
        logger.warn({ emailType: params.emailType, fallbackFrom: RESEND_DEFAULT_FROM }, "Domain not verified - retrying with default sender");
        const retryResult = await client.emails.send({
          from: RESEND_DEFAULT_FROM,
          to: [params.to],
          subject: params.subject,
          html: params.html,
          text: params.text,
        });

        if (retryResult.error) {
          logger.error({ emailType: params.emailType, errorName: retryResult.error.name, errorMsg: retryResult.error.message }, "Retry also failed");
          return { success: false, error: retryResult.error.message };
        }

        return { success: true };
      }

      return { success: false, error: errMsg };
    }

    logger.info({ emailType: params.emailType, to: params.to, id: result.data?.id }, "Email sent successfully");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error({ emailType: params.emailType, to: params.to, err: error }, "Failed to send email");
    return { success: false, error: msg };
  }
}
