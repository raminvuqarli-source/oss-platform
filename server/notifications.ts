import { storage } from "./storage";
import type { HousekeepingTask } from "@shared/schema";
import { env } from "./config/env";
import {
  sendBookingConfirmationEmail,
  sendPaymentFailedEmail,
  sendSubscriptionRenewalEmail,
  sendInvoiceEmail,
} from "./email";
import { logger } from "./utils/logger";

export async function notifyNewBooking(params: {
  bookingId: string;
  guestName: string;
  roomNumber: string;
  checkIn: Date;
  checkOut: Date;
  ownerId: string;
  propertyId: string;
  hotelId: string;
}) {
  const { guestName, roomNumber, checkIn, checkOut, ownerId, propertyId, hotelId } = params;
  const staffUsers = await storage.getUsersByProperty(propertyId);
  const receptionUsers = staffUsers.filter(u => u.role === "reception" || u.role === "admin" || u.role === "owner_admin");

  const title = "New Booking";
  const message = `${guestName} booked Room ${roomNumber} (${checkIn.toLocaleDateString()} - ${checkOut.toLocaleDateString()})`;

  for (const user of receptionUsers) {
    await storage.createNotification({
      userId: user.id,
      title,
      message,
      type: "booking",
      read: false,
    }).catch(err => logger.error({ err, userId: user.id }, "Failed to notify user"));
  }
}

export async function notifyCheckIn(params: {
  guestName: string;
  roomNumber: string;
  propertyId: string;
}) {
  const { guestName, roomNumber, propertyId } = params;
  const staffUsers = await storage.getUsersByProperty(propertyId);
  const housekeeping = staffUsers.filter(u => u.role === "staff" || u.role === "admin");

  for (const user of housekeeping) {
    await storage.createNotification({
      userId: user.id,
      title: "Guest Checked In",
      message: `${guestName} has checked into Room ${roomNumber}`,
      type: "check_in",
      read: false,
    }).catch(err => logger.error({ err, userId: user.id }, "Failed to notify user"));
  }
}

export async function notifyServiceRequest(params: {
  guestName: string;
  roomNumber: string;
  requestType: string;
  description: string;
  propertyId: string;
}) {
  const { guestName, roomNumber, requestType, description, propertyId } = params;
  const staffUsers = await storage.getUsersByProperty(propertyId);
  const recipients = staffUsers.filter(u =>
    u.role === "reception" || u.role === "admin" || u.role === "staff" || u.role === "owner_admin"
  );

  for (const user of recipients) {
    await storage.createNotification({
      userId: user.id,
      title: `Service Request: ${requestType}`,
      message: `${guestName} (Room ${roomNumber}): ${description}`,
      type: "service_request",
      read: false,
    }).catch(err => logger.error({ err, userId: user.id }, "Failed to notify user"));
  }
}

export async function notifyPaymentReceived(params: {
  guestName: string;
  amount: number;
  currency: string;
  ownerId: string;
  propertyId: string;
}) {
  const { guestName, amount, currency, ownerId, propertyId } = params;
  const staffUsers = await storage.getUsersByProperty(propertyId);
  const financeUsers = staffUsers.filter(u => u.role === "admin" || u.role === "owner_admin");

  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);

  for (const user of financeUsers) {
    await storage.createNotification({
      userId: user.id,
      title: "Payment Received",
      message: `${formatted} payment from ${guestName}`,
      type: "payment",
      read: false,
    }).catch(err => logger.error({ err, userId: user.id }, "Failed to notify user"));
  }
}

export async function notifyDeviceAlert(params: {
  deviceName: string;
  deviceType: string;
  status: string;
  propertyId: string;
}) {
  const { deviceName, deviceType, status, propertyId } = params;
  const staffUsers = await storage.getUsersByProperty(propertyId);
  const techUsers = staffUsers.filter(u => u.role === "admin" || u.role === "owner_admin");

  for (const user of techUsers) {
    await storage.createNotification({
      userId: user.id,
      title: `Device Alert: ${deviceName}`,
      message: `${deviceType} "${deviceName}" is now ${status}`,
      type: "device_alert",
      read: false,
    }).catch(err => logger.error({ err, userId: user.id }, "Failed to notify user"));
  }
}

export async function notifySubscriptionEvent(params: {
  ownerId: string;
  event: "payment_failed" | "renewal_reminder" | "invoice_ready" | "plan_changed" | "cancelled";
  planType?: string;
  amount?: number;
  invoiceUrl?: string;
  nextBillingDate?: Date;
}) {
  const { ownerId, event, planType, amount, invoiceUrl, nextBillingDate } = params;

  const ownerUsers = await storage.getUsersByOwner(ownerId, ownerId);
  const ownerAdmins = ownerUsers.filter(u => u.role === "owner_admin");

  const messages: Record<string, { title: string; message: string }> = {
    payment_failed: {
      title: "Payment Failed",
      message: `Your ${planType || "subscription"} payment could not be processed. Please update your payment method.`,
    },
    renewal_reminder: {
      title: "Subscription Renewal",
      message: `Your ${planType || ""} plan will renew${nextBillingDate ? ` on ${nextBillingDate.toLocaleDateString()}` : " soon"}.`,
    },
    invoice_ready: {
      title: "Invoice Ready",
      message: `Your latest invoice${amount ? ` for ${(amount / 100).toFixed(2)}` : ""} is ready.`,
    },
    plan_changed: {
      title: "Plan Updated",
      message: `Your subscription has been updated to the ${planType || "new"} plan.`,
    },
    cancelled: {
      title: "Subscription Cancelled",
      message: "Your subscription has been cancelled and will end at the current billing period.",
    },
  };

  const { title, message } = messages[event] || { title: "Subscription Update", message: "Your subscription has been updated." };

  for (const user of ownerAdmins) {
    await storage.createNotification({
      userId: user.id,
      title,
      message,
      type: "subscription",
      read: false,
    }).catch(err => logger.error({ err, userId: user.id }, "Failed to notify user"));
  }

  if (event === "payment_failed" && ownerAdmins[0]?.email) {
    sendPaymentFailedEmail({
      to: ownerAdmins[0].email,
      ownerName: ownerAdmins[0].fullName || "Owner",
      amount: ((amount || 0) / 100).toFixed(2),
      currency: "USD",
      invoiceUrl: getAppUrl() + "/settings?section=billing",
      attemptCount: 1,
    }).catch(err => logger.error({ err }, "Failed to send payment failed email"));
  }

  if (event === "renewal_reminder" && ownerAdmins[0]?.email && nextBillingDate) {
    sendSubscriptionRenewalEmail({
      to: ownerAdmins[0].email,
      ownerName: ownerAdmins[0].fullName || "Owner",
      planName: planType || "subscription",
      renewalDate: nextBillingDate.toISOString(),
      amount: ((amount || 0) / 100).toFixed(2),
      currency: "USD",
    }).catch(err => logger.error({ err }, "Failed to send renewal email"));
  }

  if (event === "invoice_ready" && ownerAdmins[0]?.email && invoiceUrl) {
    sendInvoiceEmail({
      to: ownerAdmins[0].email,
      ownerName: ownerAdmins[0].fullName || "Owner",
      invoiceNumber: `INV-${Date.now()}`,
      amount: ((amount || 0) / 100).toFixed(2),
      currency: "USD",
      periodStart: new Date().toISOString(),
      periodEnd: (nextBillingDate || new Date()).toISOString(),
      invoiceUrl,
      pdfUrl: invoiceUrl,
    }).catch(err => logger.error({ err }, "Failed to send invoice email"));
  }
}

export async function notifyCleaningTaskAssigned(task: HousekeepingTask): Promise<void> {
  if (!task.assignedTo) return;

  await storage.createNotification({
    userId: task.assignedTo,
    tenantId: task.tenantId,
    title: "Cleaning Task Assigned",
    message: `Room ${task.roomNumber} requires cleaning.`,
    type: "housekeeping",
    read: false,
    actionUrl: "/housekeeping",
  });
}

function getAppUrl(): string {
  return process.env.APP_BASE_URL || process.env.BASE_URL || env.BASE_URL;
}
