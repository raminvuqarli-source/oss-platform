import { storage } from "../storage";
import { hashPassword } from "./auth.service";

const VALID_STAFF_ROLES = ["admin", "manager", "reception", "cleaner", "front_desk"];

const ROLE_MAPPING: Record<string, string> = {
  front_desk: "reception",
  manager: "admin",
  cleaner: "staff",
  reception: "reception",
  admin: "admin",
};

interface CreateStaffInput {
  fullName: string;
  username: string;
  password: string;
  email?: string | null;
  role: string;
  propertyId: string;
  ownerId: string;
  hotelId?: string | null;
}

export function normalizeStaffRole(role: string): string {
  return role.toLowerCase().trim();
}

export function isValidStaffRole(role: string): boolean {
  return VALID_STAFF_ROLES.includes(normalizeStaffRole(role));
}

export function mapToSystemRole(role: string): string {
  const normalized = normalizeStaffRole(role);
  return ROLE_MAPPING[normalized] || "staff";
}

export async function createStaffUser(input: CreateStaffInput) {
  const normalizedRole = normalizeStaffRole(input.role);

  if (!isValidStaffRole(normalizedRole)) {
    throw new Error(`Invalid staff role "${input.role}". Must be one of: admin, manager, reception, cleaner`);
  }

  const existingUser = await storage.getUserByUsername(input.username);
  if (existingUser) {
    throw new Error("Username already exists");
  }

  const systemRole = mapToSystemRole(normalizedRole);
  const hashedPw = await hashPassword(input.password);

  const newUser = await storage.createUser({
    username: input.username,
    password: hashedPw,
    role: systemRole,
    fullName: input.fullName,
    email: input.email || null,
    propertyId: input.propertyId,
    ownerId: input.ownerId,
    hotelId: input.hotelId || null,
  });

  return newUser;
}
