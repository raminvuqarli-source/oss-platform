import { z } from "zod";

export const createUnitSchema = z.object({
  unitNumber: z.string().min(1, "Unit number is required"),
  unitCategory: z.string().optional(),
  unitType: z.string().optional(),
  name: z.string().nullable().optional(),
  floor: z.number().int().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  description: z.string().nullable().optional(),
  amenities: z.array(z.string()).nullable().optional(),
  pricePerNight: z.number().int().min(0).nullable().optional(),
  status: z.string().optional(),
  isActive: z.boolean().optional(),
}).passthrough();

export const updateUnitSchema = z.object({
  unitNumber: z.string().min(1).optional(),
  unitCategory: z.string().optional(),
  unitType: z.string().optional(),
  name: z.string().nullable().optional(),
  floor: z.number().int().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  description: z.string().nullable().optional(),
  amenities: z.array(z.string()).nullable().optional(),
  pricePerNight: z.number().int().min(0).nullable().optional(),
  status: z.string().optional(),
  isActive: z.boolean().optional(),
}).passthrough();
