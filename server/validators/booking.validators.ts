import { z } from "zod";

export const updateBookingSchema = z.object({
  roomNumber: z.string().min(1).optional(),
  roomType: z.string().min(1).optional(),
  checkInDate: z.string().or(z.date()).optional(),
  checkOutDate: z.string().or(z.date()).optional(),
  status: z.string().optional(),
  preCheckedIn: z.boolean().optional(),
  specialRequests: z.string().nullable().optional(),
  bookingNumber: z.string().nullable().optional(),
  bookingSource: z.string().nullable().optional(),
  numberOfGuests: z.number().int().positive().nullable().optional(),
  nationality: z.string().nullable().optional(),
  passportNumber: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  guestAddress: z.string().nullable().optional(),
  arrivalTime: z.string().nullable().optional(),
  preCheckNotes: z.string().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  specialNotes: z.string().nullable().optional(),
  nightlyRate: z.number().int().nullable().optional(),
  totalPrice: z.number().int().nullable().optional(),
  currency: z.string().max(10).nullable().optional(),
  discount: z.number().int().nullable().optional(),
  travelAgencyName: z.string().nullable().optional(),
  paymentStatus: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  unitId: z.string().nullable().optional(),
  ratePlanId: z.string().nullable().optional(),
}).passthrough();

export const arrivalInfoSchema = z.object({
  arrivalTime: z.string().min(1, "Expected arrival time is required"),
  preCheckNotes: z.string().nullable().optional(),
});

export const precheckSchema = z.object({
  passportNumber: z.string().min(1, "Passport number is required"),
  nationality: z.string().min(1, "Nationality is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  guestAddress: z.string().nullable().optional(),
  numberOfGuests: z.union([z.string(), z.number()]).nullable().optional(),
  specialRequests: z.string().nullable().optional(),
  guestSignatureBase64: z.string().min(1, "Digital signature is required"),
  idDocumentBase64: z.string().nullable().optional(),
});

export const roomSettingsSchema = z.object({
  temperature: z.number().int().min(16).max(30).optional(),
  lightsOn: z.boolean().optional(),
  lightsBrightness: z.number().int().min(0).max(100).optional(),
  bathroomLightsOn: z.boolean().optional(),
  bathroomLightsBrightness: z.number().int().min(0).max(100).optional(),
  hallLightsOn: z.boolean().optional(),
  hallLightsBrightness: z.number().int().min(0).max(100).optional(),
  nonDimmableLightsOn: z.boolean().optional(),
  curtainsOpen: z.boolean().optional(),
  curtainsPosition: z.number().int().min(0).max(100).optional(),
  jacuzziOn: z.boolean().optional(),
  jacuzziTemperature: z.number().int().min(20).max(45).optional(),
  doorLocked: z.boolean().optional(),
  welcomeMode: z.boolean().optional(),
}).passthrough();

export const doorControlSchema = z.object({
  action: z.enum(["open", "close"]),
});

export const unitStatusSchema = z.object({
  status: z.enum(["ready", "dirty", "cleaning", "occupied", "out_of_order"]),
});
