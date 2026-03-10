import { z } from "zod";

export const createStaffSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email().nullable().optional(),
  role: z.string().optional(),
  staffRole: z.string().optional(),
});

export const createGuestSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  paymentAmount: z.union([z.string(), z.number()]).nullable().optional(),
  paymentStatus: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  bookingNumber: z.string().nullable().optional(),
  bookingSource: z.string().nullable().optional(),
  numberOfGuests: z.union([z.string(), z.number()]).nullable().optional(),
  nationality: z.string().nullable().optional(),
  passportNumber: z.string().nullable().optional(),
  specialNotes: z.string().nullable().optional(),
  nightlyRate: z.union([z.string(), z.number()]).nullable().optional(),
  totalPrice: z.union([z.string(), z.number()]).nullable().optional(),
  currency: z.string().nullable().optional(),
  discount: z.union([z.string(), z.number()]).nullable().optional(),
  reservationStatus: z.string().nullable().optional(),
  transactionReference: z.string().nullable().optional(),
  paymentNotes: z.string().nullable().optional(),
  amountPaid: z.union([z.string(), z.number()]).nullable().optional(),
  travelAgencyName: z.string().nullable().optional(),
}).passthrough();

export const updateStaffSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const inviteStaffSchema = z.object({
  email: z.string().email("Valid email is required"),
  staffRole: z.string().min(1, "Staff role is required"),
});
