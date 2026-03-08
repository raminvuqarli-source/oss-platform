import { z } from "zod";
import i18n from "./i18n";

const t = () => i18n.t.bind(i18n);

export const phoneRegex = /^\+\d{7,15}$/;
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePhone(phone: string): boolean {
  return phoneRegex.test(phone);
}

export function validateEmail(email: string): boolean {
  return emailRegex.test(email);
}

export function validatePassword(password: string, minLength = 6): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: t()("validation.passwordRequired") };
  }
  if (password.length < minLength) {
    return { valid: false, message: t()("validation.minLength", { count: minLength }) };
  }
  return { valid: true };
}

export function validateRequired(value: unknown, fieldName?: string): { valid: boolean; message?: string } {
  const isEmpty = value === null || value === undefined || value === "" || 
    (typeof value === "string" && value.trim() === "");
  if (isEmpty) {
    return { valid: false, message: fieldName ? `${fieldName} ${t()("validation.required")}` : t()("validation.required") };
  }
  return { valid: true };
}

export function createPhoneSchema() {
  return z.string().regex(phoneRegex, {
    message: t()("validation.phoneFormat"),
  });
}

export function createEmailSchema() {
  return z.string().email({
    message: t()("validation.emailFormat"),
  });
}

export function createPasswordSchema(minLength = 6) {
  return z.string().min(minLength, {
    message: t()("validation.minLength", { count: minLength }),
  });
}

export function createUsernameSchema(minLength = 3) {
  return z.string().min(minLength, {
    message: t()("validation.minLength", { count: minLength }),
  });
}

export function createRequiredSchema(fieldName?: string) {
  return z.string().min(1, {
    message: fieldName ? t()("validation.fieldRequired", { field: fieldName }) : t()("validation.required"),
  });
}

export function createLoginFormSchema() {
  return z.object({
    username: z.string().min(1, t()("validation.usernameRequired")),
    password: z.string().min(1, t()("validation.passwordRequired")),
  });
}

export function createRegisterFormSchema() {
  return z.object({
    username: createUsernameSchema(),
    password: createPasswordSchema(),
    fullName: z.string().min(2, t()("validation.fullNameRequired")),
    email: createEmailSchema(),
    role: z.enum(["admin", "reception"]),
  });
}

export function createGuestFormSchema() {
  return z.object({
    fullName: z.string().min(2, t()("validation.fullNameRequired")),
    phone: createPhoneSchema(),
    roomNumber: z.string().min(1, t()("validation.roomNumberRequired")),
    checkInDate: z.string().min(1, t()("validation.checkInDateRequired")),
    checkOutDate: z.string().min(1, t()("validation.checkOutDateRequired")),
    checkInTime: z.string().optional().default("14:00"),
    checkOutTime: z.string().optional().default("12:00"),
    password: createPasswordSchema().optional(),
  });
}

export function createHotelFormSchema() {
  return z.object({
    hotelName: z.string().min(2, t()("validation.hotelNameRequired")),
    hotelCountry: z.string().min(1, t()("validation.countryRequired")),
    hotelCity: z.string().min(1, t()("validation.cityRequired")),
    hotelAddress: z.string().min(1, t()("validation.addressRequired")),
    hotelPhone: createPhoneSchema(),
    hotelEmail: createEmailSchema(),
    totalRooms: z.coerce.number().min(1, t()("validation.totalRoomsRequired")),
    adminFullName: z.string().min(2, t()("validation.fullNameRequired")),
    adminEmail: createEmailSchema(),
    adminUsername: createUsernameSchema(),
    adminPassword: createPasswordSchema(),
  });
}

export function createFinanceTransactionSchema() {
  return z.object({
    roomNumber: z.string().optional(),
    amount: z.coerce.number().min(0.01, t()("validation.amountRequired")),
    category: z.string().min(1, t()("validation.categoryRequired")),
    description: z.string().optional(),
    paymentStatus: z.enum(["paid", "unpaid", "pending", "voided", "refunded"]),
    paymentMethod: z.enum(["cash", "card", "online", "room_charge", "other"]).optional(),
    notes: z.string().optional(),
  });
}

export function validateFormFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    const value = data[field];
    if (!validateRequired(value).valid) {
      missingFields.push(String(field));
    }
  }
  
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

export type LoginForm = z.infer<ReturnType<typeof createLoginFormSchema>>;
export type RegisterForm = z.infer<ReturnType<typeof createRegisterFormSchema>>;
export type GuestForm = z.infer<ReturnType<typeof createGuestFormSchema>>;
export type HotelForm = z.infer<ReturnType<typeof createHotelFormSchema>>;
export type FinanceTransaction = z.infer<ReturnType<typeof createFinanceTransactionSchema>>;
